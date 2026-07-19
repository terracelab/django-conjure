from django.contrib.auth.models import User
from django.test import TestCase, override_settings
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


class SchemaGroupingTests(TestCase):
    """Sidebar grouping (APP_GROUPS) and section tabs (SECTIONS) surfaced on the schema list."""

    def setUp(self):
        self.admin = User.objects.create(username="admin", is_staff=True, is_superuser=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def _models(self):
        response = self.client.get("/conjure/schema/")
        self.assertEqual(response.status_code, 200)
        return {m["model"]: m for m in response.data["models"]}

    def test_defaults_group_by_app_label_standalone_sections(self):
        prod = self._models()["testapp.Product"]
        self.assertEqual(prod["group"], "testapp")  # defaults to app_label
        self.assertEqual(prod["section"], "testapp.Product")  # standalone = its own section
        self.assertEqual(prod["section_order"], 0)

    @override_settings(CONJURE={"APP_GROUPS": {"testapp": "Catalog"}})
    def test_app_groups_label_and_order(self):
        models = self._models()
        self.assertEqual(models["testapp.Product"]["group"], "Catalog")
        self.assertEqual(models["testapp.Product"]["group_order"], 0)
        # an unlisted app keeps its label and sorts last
        self.assertEqual(models["conjure.AdminAuditLog"]["group"], "conjure")
        self.assertEqual(models["conjure.AdminAuditLog"]["group_order"], 999)

    @override_settings(CONJURE={"MODEL_ORDER": ["testapp.Category", "testapp.product"]})
    def test_model_order_position_and_default(self):
        models = self._models()
        self.assertEqual(models["testapp.Category"]["model_order"], 0)
        self.assertEqual(models["testapp.Product"]["model_order"], 1)  # case-insensitive match
        # an unlisted model sorts last
        self.assertEqual(models["conjure.AdminAuditLog"]["model_order"], 999)

    def test_model_order_defaults_to_999(self):
        self.assertEqual(self._models()["testapp.Product"]["model_order"], 999)

    @override_settings(CONJURE={"SECTIONS": [["testapp.Product", "testapp.Category"]]})
    def test_sections_main_and_tab_order(self):
        models = self._models()
        self.assertEqual(models["testapp.Product"]["section"], "testapp.Product")
        self.assertEqual(models["testapp.Product"]["section_order"], 0)
        # a member points at the section main and gets a later tab order
        self.assertEqual(models["testapp.Category"]["section"], "testapp.Product")
        self.assertEqual(models["testapp.Category"]["section_order"], 1)
