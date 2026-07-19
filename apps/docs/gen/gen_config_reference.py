#!/usr/bin/env python3
"""Generate the CONJURE settings reference table for the docs.

This is the headline "code -> docs sync" generator. It produces
``docs/reference/_generated_config.md``, which ``reference/configuration.md`` pulls in via
the pymdownx snippet include (``--8<-- "reference/_generated_config.md"``).

Strategy (robust, in priority order):

1. Parse the package's ``conjure/conf.py`` for a defaults dict named ``CONJURE_DEFAULTS``
   or ``DEFAULTS``. We parse with :mod:`ast` (no import, no Django setup needed), so this
   runs in CI without a configured Django project or installed dependencies.
2. If that file or dict isn't present yet (the package may not exist), fall back to the
   authored table in ``PACKAGE_GUIDE.md`` -- captured here as ``FALLBACK_SETTINGS`` so the
   docs always build.

Run:

    python apps/docs/gen/gen_config_reference.py

CI runs this before ``mkdocs build`` so the published table can never drift from the code.
See ``apps/docs/gen/README.md`` and ``contributing/releasing.md``.
"""

from __future__ import annotations

import ast
import datetime as _dt
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths. This file lives at apps/docs/gen/gen_config_reference.py.
# ---------------------------------------------------------------------------
HERE = Path(__file__).resolve()
DOCS_APP = HERE.parents[1]            # apps/docs
REPO_ROOT = HERE.parents[3]          # repo root (apps/docs/gen -> apps/docs -> apps -> root)

CONF_PY = REPO_ROOT / "packages" / "conjure" / "conjure" / "conf.py"
OUT_FILE = DOCS_APP / "docs" / "reference" / "_generated_config.md"

# Defaults dict names we'll accept inside conf.py, in order of preference.
DEFAULTS_NAMES = ("CONJURE_DEFAULTS", "DEFAULTS")

# ---------------------------------------------------------------------------
# Fallback: the authored settings table (PACKAGE_GUIDE §8), used when conf.py
# isn't available yet. Tuples are (key, default, description).
# ---------------------------------------------------------------------------
FALLBACK_SETTINGS: list[tuple[str, str, str]] = [
    ("AUTH", '"session"',
     'Authentication mode: `"session"` (reuse Django login, works everywhere) or '
     '`"jwt"` (staff-only SimpleJWT for a separately-hosted SPA).'),
    ("BRAND.name", '"Admin"',
     "Title shown in the dashboard header and on the login screen."),
    ("BRAND.accent", '"#4f46e5"',
     "Brand / primary-action color. Hex or `R G B` channels; hover is derived."),
    ("USER_PAYLOAD", "get_username / get_full_name",
     "Dotted path to a callable that shapes the login response user info. "
     "Set this for custom user models."),
    ("PAGE_SIZE", "50",
     "Default page size for list endpoints (server-side pagination)."),
    ("AUDIT", "True",
     "Toggle the audit log (diff of every write to `AdminAuditLog`)."),
]

# Human descriptions keyed by setting name, merged in when we parse real defaults
# from conf.py (a defaults dict has values but no prose). Start from the fallback prose
# and add keys that only exist in the live conf.py.
DESCRIPTIONS: dict[str, str] = {k: d for k, _, d in FALLBACK_SETTINGS}
DESCRIPTIONS.update({
    "MAX_PAGE_SIZE": "Upper bound a client may request via `?page_size=`.",
    "AUTODISCOVER": "Auto-import every installed app's `admin_config` module on `ready()` "
                    "(like `admin.autodiscover`).",
    "AUTO_REGISTER": "Opt-in install-and-go: register every concrete project model not already "
                     "registered. Explicit `@register` always wins; framework/internal models are "
                     "skipped and secret-looking fields (password/token/secret/…) are redacted.",
    "AUTO_REGISTER_EXCLUDE": "When `AUTO_REGISTER` is on, app labels (`\"myapp\"`) or model keys "
                             "(`\"myapp.Model\"`) to skip.",
    "APP_GROUPS": "Sidebar grouping: `app_label` → group label. Apps sharing a label merge into "
                  "one group; group order follows the dict's insertion order; unlisted apps group "
                  "by `app_label`, last. Drives the runtime sidebar — no codegen manifest needed.",
    "SECTIONS": "Section tabs: a list of model-key lists. The first model is the section *main* "
                "(the only one shown in the sidebar); the rest become tabs on the main's page. "
                "Models in no section stand alone.",
    "MODEL_ORDER": "Row order within a sidebar group: a list of `\"app_label.Model\"` strings. "
                   "List position = row order (same convention as `APP_GROUPS`); unlisted models "
                   "sort last, keeping alphabetical label order. Matching is case-insensitive.",
    "LOGGER_NAME": "Name of the `logging` logger used for non-fatal internal errors "
                   "(e.g. audit write failures).",
})


def _literal(node: ast.AST) -> str:
    """Render an AST value node as a short, table-friendly string."""
    try:
        value = ast.literal_eval(node)
    except (ValueError, SyntaxError):
        # Not a literal (e.g. a callable / name reference) -- show the source.
        return f"`{ast.unparse(node)}`"
    if isinstance(value, str):
        return f'`"{value}"`'
    if isinstance(value, dict):
        return "`{...}`" if value else "`{}`"
    return f"`{value!r}`"


def _flatten(prefix: str, node: ast.AST) -> list[tuple[str, str]]:
    """Flatten a dict literal into (dotted_key, rendered_default) rows.

    Nested dicts (e.g. BRAND) become dotted keys like ``BRAND.name``.
    """
    rows: list[tuple[str, str]] = []
    if isinstance(node, ast.Dict):
        for key_node, val_node in zip(node.keys, node.values):
            if not isinstance(key_node, ast.Constant) or not isinstance(key_node.value, str):
                continue
            key = key_node.value
            dotted = f"{prefix}.{key}" if prefix else key
            if isinstance(val_node, ast.Dict) and val_node.keys:
                rows.extend(_flatten(dotted, val_node))
            else:
                rows.append((dotted, _literal(val_node)))
    return rows


def parse_conf_py(path: Path) -> list[tuple[str, str, str]] | None:
    """Parse conf.py for a defaults dict. Returns (key, default, desc) rows or None."""
    if not path.exists():
        return None
    try:
        tree = ast.parse(path.read_text(encoding="utf-8"))
    except (OSError, SyntaxError):
        return None

    target: ast.AST | None = None
    for stmt in tree.body:
        if isinstance(stmt, ast.Assign):
            names = {t.id for t in stmt.targets if isinstance(t, ast.Name)}
            for wanted in DEFAULTS_NAMES:
                if wanted in names:
                    target = stmt.value
                    break
        if target is not None:
            break

    if target is None or not isinstance(target, ast.Dict):
        return None

    flat = _flatten("", target)
    if not flat:
        return None

    return [(key, default, DESCRIPTIONS.get(key, "")) for key, default in flat]


def render(rows: list[tuple[str, str, str]], source: str) -> str:
    """Render the settings rows as a Markdown table with a provenance note."""
    today = _dt.date.today().isoformat()
    lines = [
        "<!-- DO NOT EDIT. Generated by apps/docs/gen/gen_config_reference.py -->",
        f"<!-- source: {source} · generated: {today} -->",
        "",
        "| Key | Default | Description |",
        "|---|---|---|",
    ]
    for key, default, desc in rows:
        # Escape pipes so values like `{...}` never break the table.
        safe_desc = desc.replace("|", "\\|")
        lines.append(f"| `{key}` | {default} | {safe_desc} |")
    lines.append("")
    note = (
        "!!! abstract \"Source\"\n"
        f"    Parsed from `packages/conjure/conjure/conf.py` on {today}."
        if source == "conf.py"
        else "!!! abstract \"Source\"\n"
        "    `conjure/conf.py` not found yet — table mirrors `PACKAGE_GUIDE` §8. "
        "It will switch to the live code automatically once the package lands."
    )
    lines.append(note)
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    rows = parse_conf_py(CONF_PY)
    if rows:
        source = "conf.py"
        print(f"[gen_config_reference] parsed {len(rows)} keys from {CONF_PY}")
    else:
        rows = FALLBACK_SETTINGS
        source = "PACKAGE_GUIDE"
        print(f"[gen_config_reference] conf.py unavailable — using fallback table "
              f"({len(rows)} keys)")

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(render(rows, source), encoding="utf-8")
    print(f"[gen_config_reference] wrote {OUT_FILE.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
