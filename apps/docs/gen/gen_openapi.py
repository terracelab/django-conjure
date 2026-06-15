#!/usr/bin/env python3
"""Generate the REST API reference from the live OpenAPI schema.

STATUS: 📋 TODO — stub. Not yet implemented.

Unlike ``gen_config_reference.py`` (which parses ``conf.py`` statically and needs no Django
setup), this generator requires a *running, configured* Django project so it can ask
drf-spectacular for the OpenAPI document. The example project at ``examples/demo-shop`` is
the intended host.

Intended pipeline:

    1. Point DJANGO_SETTINGS_MODULE at examples/demo-shop and set up Django.
    2. Generate the schema, e.g.:
           python examples/demo-shop/manage.py spectacular --file /tmp/conjure-openapi.yaml
       (or call drf_spectacular.generators.SchemaGenerator directly).
    3. Walk the OpenAPI paths/operations under /conjure/ and render a Markdown reference:
       per-endpoint method, path, params, request/response shapes.
    4. Write docs/reference/_generated_openapi.md and include it from reference/rest-api.md
       via:  --8<-- "reference/_generated_openapi.md"

Until then, ``reference/rest-api.md`` documents the (frozen) contract by hand.

Run (once implemented):

    python apps/docs/gen/gen_openapi.py
"""

from __future__ import annotations

import sys
from pathlib import Path

HERE = Path(__file__).resolve()
DOCS_APP = HERE.parents[1]
OUT_FILE = DOCS_APP / "docs" / "reference" / "_generated_openapi.md"


def main() -> int:
    # TODO(P5): implement via drf-spectacular against examples/demo-shop.
    #   from drf_spectacular.generators import SchemaGenerator
    #   schema = SchemaGenerator().get_schema(request=None, public=True)
    #   render schema["paths"] -> Markdown -> OUT_FILE
    print(
        "[gen_openapi] STUB — not implemented. "
        "Will render the OpenAPI (drf-spectacular) of examples/demo-shop into "
        f"{OUT_FILE.name}. See module docstring.",
        file=sys.stderr,
    )
    return 0  # exit 0 so CI doesn't fail on the unimplemented stub


if __name__ == "__main__":
    raise SystemExit(main())
