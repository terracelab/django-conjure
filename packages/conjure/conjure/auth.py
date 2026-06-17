"""
@Domain: conjure / auth
@BusinessLogic: Staff-only login for the admin frontend. Two modes selected at request time by
    CONJURE["AUTH"]: "session" (reuse Django's session login — works in any project, the default)
    and "jwt" (SimpleJWT, requires the optional [jwt] extra). Non-staff accounts are always
    rejected. The login/me response body comes from CONJURE["USER_PAYLOAD"].
@Context: DECOUPLING — the payload is a configurable callable defaulting to get_username()/
    get_full_name(), so it never assumes project-specific user fields (e.g. nickname/real_name).
@Connection: conjure/urls.py, conjure/conf.py, packages/web/src/lib/auth.ts
"""

from django.contrib.auth import authenticate
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.core.exceptions import ImproperlyConfigured
from django.http import Http404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from conjure.conf import conjure_settings
from conjure.mixins import ConjureAuthMixin
from conjure.permissions import IsStaffUser


def default_user_payload(user):
    """Project-agnostic default — only uses the User API guaranteed by contrib.auth."""
    full_name = (user.get_full_name() or "").strip()
    return {
        "id": user.pk,
        "username": user.get_username(),
        "name": full_name or user.get_username(),
        "is_superuser": user.is_superuser,
    }


def user_payload(user):
    fn = conjure_settings.USER_PAYLOAD
    return fn(user) if callable(fn) else default_user_payload(user)


def _require_staff(user):
    if not (user and user.is_active and user.is_staff):
        raise AuthenticationFailed("This account has no admin access.")


def _jwt_module():
    try:
        import rest_framework_simplejwt.serializers as ser
    except ImportError as e:  # pragma: no cover - guarded path
        raise ImproperlyConfigured(
            "CONJURE['AUTH'] == 'jwt' requires the optional dependency: pip install 'django-conjure[jwt]'"
        ) from e
    return ser


class LoginView(APIView):
    """POST /auth/login/ — dispatches on CONJURE['AUTH']."""

    permission_classes = [AllowAny]
    authentication_classes = []
    swagger_schema = None

    # Issue the CSRF cookie on login so a session-auth SPA can send X-CSRFToken on writes.
    # (Harmless in jwt mode — the cookie just goes unused.)
    @method_decorator(ensure_csrf_cookie)
    def post(self, request):
        if conjure_settings.AUTH == "jwt":
            serializer_cls = _jwt_module().TokenObtainPairSerializer
            serializer = serializer_cls(data=request.data, context={"request": request})
            serializer.is_valid(raise_exception=True)
            _require_staff(serializer.user)
            data = dict(serializer.validated_data)
            data["user"] = user_payload(serializer.user)
            return Response(data)

        # session mode
        user = authenticate(
            request._request,
            username=request.data.get("username"),
            password=request.data.get("password"),
        )
        if user is None:
            raise AuthenticationFailed("Invalid credentials.")
        _require_staff(user)
        django_login(request._request, user)
        return Response({"user": user_payload(user)})


class RefreshView(APIView):
    """POST /auth/refresh/ — JWT mode only."""

    permission_classes = [AllowAny]
    authentication_classes = []
    swagger_schema = None

    def post(self, request):
        if conjure_settings.AUTH != "jwt":
            raise Http404
        serializer = _jwt_module().TokenRefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class LogoutView(ConjureAuthMixin, APIView):
    """POST /auth/logout/ — session mode (no-op for JWT, client just drops the token)."""

    permission_classes = [IsStaffUser]
    swagger_schema = None

    def post(self, request):
        if conjure_settings.AUTH != "jwt":
            django_logout(request._request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(ConjureAuthMixin, APIView):
    """GET /auth/me/ — the currently authenticated staff user."""

    permission_classes = [IsStaffUser]
    swagger_schema = None

    # Refresh the CSRF cookie on every auth check so the SPA always has a usable token.
    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return Response(user_payload(request.user))


class ConfigView(APIView):
    """GET /config/ — public dashboard bootstrap config (brand, auth mode) for the SPA.

    Public (AllowAny) so the login screen can brand itself before authentication.
    Brand name/accent and the auth mode are not sensitive.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    swagger_schema = None

    def get(self, request):
        return Response({"brand": conjure_settings.BRAND, "auth": conjure_settings.AUTH})
