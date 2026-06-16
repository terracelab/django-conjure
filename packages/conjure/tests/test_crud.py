from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from conjure.models import AdminAuditLog
from tests.testapp.models import Category, Product


class CrudTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create(username="admin", is_staff=True, is_superuser=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)
        self.category = Category.objects.create(name="stock", display_name="Stock", order=1)

    def test_create_and_audit(self):
        response = self.client.post(
            "/conjure/r/testapp.Product/",
            {"name": "Widget", "price": "9.99", "category": self.category.id},
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["name"], "Widget")
        self.assertEqual(response.data["category_label"], str(self.category))
        log = AdminAuditLog.objects.latest("id")
        self.assertEqual(log.action, "create")
        self.assertEqual(log.model_label, "testapp.Product")

    def test_list_search_filter_ordering(self):
        Product.objects.create(name="findme", price="1.00", category=self.category)
        Product.objects.create(name="other", price="2.00", category=self.category, is_active=False)
        response = self.client.get("/conjure/r/testapp.Product/?search=findme")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        response = self.client.get("/conjure/r/testapp.Product/?is_active=false")
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["name"], "other")
        response = self.client.get("/conjure/r/testapp.Product/?ordering=name&page_size=1")
        self.assertEqual(len(response.data["results"]), 1)

    def test_partial_update_records_diff(self):
        product = Product.objects.create(name="before", price="1.00", category=self.category)
        response = self.client.patch(f"/conjure/r/testapp.Product/{product.id}/", {"name": "after"})
        self.assertEqual(response.status_code, 200, response.data)
        log = AdminAuditLog.objects.latest("id")
        self.assertEqual(log.action, "update")
        self.assertEqual(log.diff["name"], ["before", "after"])

    def test_destroy_and_related(self):
        product = Product.objects.create(name="doomed", price="1.00", category=self.category)
        response = self.client.get(f"/conjure/r/testapp.Product/{product.id}/related/")
        self.assertEqual(response.status_code, 200)
        response = self.client.delete(f"/conjure/r/testapp.Product/{product.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Product.objects.filter(id=product.id).exists())

    def test_autocomplete(self):
        response = self.client.get("/conjure/r/testapp.Category/autocomplete/?q=Stock")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["value"], self.category.id)

    def test_bulk_delete_and_operations(self):
        p1 = Product.objects.create(name="b1", price="1.00", category=self.category)
        p2 = Product.objects.create(name="b2", price="1.00", category=self.category)
        response = self.client.post(
            "/conjure/r/testapp.Product/bulk/",
            {"action": "delete", "ids": [p1.id, p2.id]},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["deleted"], 2)
        response = self.client.post(
            "/conjure/r/testapp.Product/bulk/",
            {"operations": [{"op": "create", "data": {"name": "op", "price": "1.00", "category": self.category.id}}]},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(Product.objects.filter(name="op").exists())

    def test_readonly_model_rejects_write(self):
        response = self.client.post("/conjure/r/testapp.ActivityLog/", {"message": "nope"})
        self.assertEqual(response.status_code, 403)

    def test_validation_error_shape(self):
        response = self.client.post("/conjure/r/testapp.Product/", {"price": "1.00"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("name", response.data)
