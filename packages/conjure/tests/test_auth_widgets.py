from unittest import skipUnless

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

try:
    import rest_framework_simplejwt  # noqa: F401

    HAS_JWT = True
except ImportError:
    HAS_JWT = False


class SessionAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff = User.objects.create(username="staff", is_staff=True)
        self.staff.set_password("pw-1!")
        self.staff.save()

    def test_session_login_staff_only(self):
        response = self.client.post("/conjure/auth/login/", {"username": "staff", "password": "pw-1!"})
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["user"]["username"], "staff")
        # default payload uses get_username() — no project-specific fields assumed
        self.assertIn("name", response.data["user"])

        normal = User.objects.create(username="normal")
        normal.set_password("pw-1!")
        normal.save()
        response = self.client.post("/conjure/auth/login/", {"username": "normal", "password": "pw-1!"})
        self.assertIn(response.status_code, (401, 403))

    def test_session_login_bad_password(self):
        response = self.client.post("/conjure/auth/login/", {"username": "staff", "password": "wrong"})
        self.assertIn(response.status_code, (401, 403))

    def test_me_and_logout(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get("/conjure/auth/me/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "staff")
        response = self.client.post("/conjure/auth/logout/")
        self.assertEqual(response.status_code, 204)


@skipUnless(HAS_JWT, "djangorestframework-simplejwt not installed")
@override_settings(CONJURE={"AUTH": "jwt"})
class JwtAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff = User.objects.create(username="staff", is_staff=True)
        self.staff.set_password("pw-1!")
        self.staff.save()

    def test_jwt_login_returns_tokens_for_staff_only(self):
        response = self.client.post("/conjure/auth/login/", {"username": "staff", "password": "pw-1!"})
        self.assertEqual(response.status_code, 200, response.data)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["username"], "staff")

        normal = User.objects.create(username="normal")
        normal.set_password("pw-1!")
        normal.save()
        response = self.client.post("/conjure/auth/login/", {"username": "normal", "password": "pw-1!"})
        self.assertIn(response.status_code, (401, 403))

    def test_jwt_token_authenticates_requests(self):
        """The access token works against a protected endpoint with NO project-level DRF auth
        config — Conjure wires JWTAuthentication itself via ConjureAuthMixin."""
        login = self.client.post("/conjure/auth/login/", {"username": "staff", "password": "pw-1!"})
        token = login.data["access"]
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = client.get("/conjure/auth/me/")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["username"], "staff")


class WidgetTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create(username="admin", is_staff=True, is_superuser=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_builtin_widgets(self):
        for name in ("recent-audit", "model-counts"):
            response = self.client.get(f"/conjure/widgets/{name}/")
            self.assertEqual(response.status_code, 200, name)
        response = self.client.get("/conjure/widgets/unknown/")
        self.assertEqual(response.status_code, 404)
