#!/usr/bin/env python3
"""Generate the CLI / management-command reference from --help output.

STATUS: 📋 TODO — stub. Not yet implemented.

Captures each Conjure management command's ``--help`` text and renders a reference, so the
CLI docs are generated from the code instead of hand-maintained. Needs a configured Django
project (the example project at ``examples/demo-shop``) to discover and invoke the commands.

Intended pipeline:

    1. Point DJANGO_SETTINGS_MODULE at examples/demo-shop and set up Django.
    2. Discover Conjure's commands (e.g. via django.core.management.get_commands(), filtered
       to those provided by the ``conjure`` app): conjure_dump_schema, sync_admin_actions, …
    3. For each, capture `manage.py <command> --help` (call_command(..., "--help") or run as
       a subprocess and read stdout).
    4. Render each command's name + help into Markdown.
    5. Write docs/reference/_generated_cli.md and include it from reference/cli.md via:
           --8<-- "reference/_generated_cli.md"

Until then, ``reference/cli.md`` documents the commands by hand.

Run (once implemented):

    python apps/docs/gen/gen_cli.py
"""

from __future__ import annotations

import sys
from pathlib import Path

HERE = Path(__file__).resolve()
DOCS_APP = HERE.parents[1]
OUT_FILE = DOCS_APP / "docs" / "reference" / "_generated_cli.md"


def main() -> int:
    # TODO(P5): implement by capturing `manage.py <cmd> --help` for conjure commands
    #   against examples/demo-shop, then rendering to OUT_FILE.
    print(
        "[gen_cli] STUB — not implemented. "
        "Will capture management-command --help from examples/demo-shop into "
        f"{OUT_FILE.name}. See module docstring.",
        file=sys.stderr,
    )
    return 0  # exit 0 so CI doesn't fail on the unimplemented stub


if __name__ == "__main__":
    raise SystemExit(main())
