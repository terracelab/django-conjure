from django.contrib.auth.models import User
from django.test import TestCase

from rest_framework.test import APIClient


class SchemaTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create(username="admin", is_staff=True, is_superuser=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_schema_list_contains_registered_models(self):
        response = self.client.get("/conjure/schema/")
        self.assertEqual(response.status_code, 200)
        keys = [m["model"] for m in response.data["models"]]
        self.assertIn("testapp.Product", keys)
        self.assertIn("testapp.Category", keys)
        self.assertIn("conjure.AdminAuditLog", keys)

    def test_schema_detail_product(self):
        response = self.client.get("/conjure/schema/testapp.Product/")
        self.assertEqual(response.status_code, 200)
        data = response.data
        field_names = [f["name"] for f in data["fields"]]
        self.assertIn("name", field_names)
        self.assertIn("category", field_names)
        category_field = next(f for f in data["fields"] if f["name"] == "category")
        self.assertEqual(category_field["related_model"], "testapp.Category")
        self.assertTrue(data["permissions"]["change"])  # superuser
        self.assertEqual(len(data["inlines"]), 1)

    def test_schema_case_insensitive_model_key(self):
        response = self.client.get("/conjure/schema/testapp.product/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["model"], "testapp.Product")

    def test_non_staff_blocked(self):
        normal = User.objects.create(username="normal")
        client = APIClient()
        client.force_authenticate(user=normal)
        response = client.get("/conjure/schema/")
        self.assertEqual(response.status_code, 403)
