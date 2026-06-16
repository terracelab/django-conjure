"""Regression tests for import-time safety of the `conjure` package.

Importing `conjure` happens while Django is still *populating* apps (Django imports the
package to read its AppConfig). If that import pulls in `rest_framework.views`, DRF resolves
``DEFAULT_AUTHENTICATION_CLASSES`` at class-definition time — and a project whose default auth
imports ``django.contrib.auth.models`` (e.g. SimpleJWT) then raises ``AppRegistryNotReady``.

So `import conjure` must stay free of rest_framework; `register_widget` is exposed lazily via
module ``__getattr__`` and only imported from ``ConjureConfig.ready()`` (apps already loaded).
"""

import os
import subprocess
import sys


def _run(code: str) -> subprocess.CompletedProcess:
    # Give the child the same import path the test process has, so `conjure` is importable
    # whether it's installed (CI) or only on sys.path (editable / PYTHONPATH).
    env = {**os.environ, "PYTHONPATH": os.pathsep.join(p for p in sys.path if p)}
    return subprocess.run([sys.executable, "-c", code], capture_output=True, text=True, env=env)


def test_import_conjure_does_not_pull_rest_framework():
    code = (
        "import sys, conjure\n"
        "leaked = sorted(m for m in sys.modules if m == 'rest_framework' or m.startswith('rest_framework.'))\n"
        "print('LEAKED:' + ','.join(leaked))\n"
        "sys.exit(1 if leaked else 0)\n"
    )
    result = _run(code)
    assert result.returncode == 0, (
        "`import conjure` must not import rest_framework (it does so during app population, "
        f"causing AppRegistryNotReady under SimpleJWT-style default auth).\n"
        f"stdout: {result.stdout}\nstderr: {result.stderr}"
    )


def test_register_widget_still_exposed_lazily():
    # Public API must remain accessible; it's just imported on first access. Run in-process
    # under the configured test settings (apps ready), where the lazy DRF import is safe.
    import conjure

    assert "register_widget" in conjure.__all__
    assert callable(conjure.register_widget)
