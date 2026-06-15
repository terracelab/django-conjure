import io
import json

from django.core.management import call_command
from django.test import TestCase


class DumpSchemaCommandTests(TestCase):
    def test_dump_schema_to_stdout(self):
        out = io.StringIO()
        call_command("conjure_dump_schema", stdout=out)
        data = json.loads(out.getvalue())
        # every registered model is present, with the full schema shape
        self.assertIn("testapp.Product", data)
        self.assertIn("conjure.AdminAuditLog", data)
        product = data["testapp.Product"]
        self.assertEqual(product["model"], "testapp.Product")
        field_names = [f["name"] for f in product["fields"]]
        self.assertIn("category", field_names)
        # _AllPerms forces full permissions so the dump is complete
        self.assertTrue(product["permissions"]["change"])

    def test_dump_schema_to_file(self, tmp_path=None):
        import tempfile

        with tempfile.NamedTemporaryFile("r", suffix=".json", delete=False) as fh:
            path = fh.name
        call_command("conjure_dump_schema", output=path)
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        self.assertIn("testapp.Category", data)
