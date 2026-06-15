"""
@Domain: conjure / codegen
@BusinessLogic: Dump the registered models' admin schema to JSON — the snapshot the frontend
    codegen reads. Replaces the ad-hoc shell one-liner. Permissions are forced on so the dump
    is complete regardless of who runs it.
@Connection: conjure/schema.py (model_schema), packages/web/codegen/schema-snapshot.json
"""

import json

from django.core.management.base import BaseCommand

from conjure.registry import registry
from conjure.schema import model_schema


class _AllPerms:
    """Stand-in user so the schema dump includes every model's full permission flags."""

    is_superuser = True

    def has_perm(self, perm, obj=None):
        return True


class Command(BaseCommand):
    help = "Dump the registered models' admin schema to JSON (the codegen snapshot)."

    def add_arguments(self, parser):
        parser.add_argument("-o", "--output", default=None, help="Write to this path instead of stdout.")
        parser.add_argument("--indent", type=int, default=2, help="JSON indent (default: 2).")

    def handle(self, *args, **options):
        user = _AllPerms()
        data = {key: model_schema(key, config, user) for key, config in registry.items()}
        text = json.dumps(data, ensure_ascii=False, indent=options["indent"])

        output = options["output"]
        if output:
            with open(output, "w", encoding="utf-8") as fh:
                fh.write(text)
            self.stderr.write(self.style.SUCCESS(f"Wrote {len(data)} models to {output}"))
        else:
            self.stdout.write(text)
