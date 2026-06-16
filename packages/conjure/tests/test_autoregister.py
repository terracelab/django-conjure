"""Tests for opt-in AUTO_REGISTER (install-and-go model registration).

Auto-registration happens in ``ConjureConfig.ready()``, so the ``CONJURE`` settings must be in
place *before* ``django.setup()``. A fresh subprocess is the clean way to exercise it with
different settings without leaking app state into the main test process.
"""

import json
import os
import subprocess
import sys

_SNIPPET = """
import json, os, django
from django.conf import settings
settings.configure(
    INSTALLED_APPS=["django.contrib.contenttypes", "django.contrib.auth", "rest_framework", "conjure"],
    DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
    REST_FRAMEWORK={},
    CONJURE=json.loads(os.environ["CONJURE_JSON"]),
    DEFAULT_AUTO_FIELD="django.db.models.BigAutoField",
)
django.setup()
from conjure.registry import registry
print("RESULT:" + json.dumps({k: list(v.exclude) for k, v in registry.items()}))
"""


def _registry_after_setup(conjure_settings: dict) -> dict:
    """Return {model_key: [excluded fields]} for the registry after a fresh django.setup()."""
    env = {
        **os.environ,
        "PYTHONPATH": os.pathsep.join(p for p in sys.path if p),
        "CONJURE_JSON": json.dumps(conjure_settings),
    }
    r = subprocess.run([sys.executable, "-c", _SNIPPET], capture_output=True, text=True, env=env)
    assert r.returncode == 0, f"django.setup() failed:\n{r.stdout}\n{r.stderr}"
    line = next(line for line in r.stdout.splitlines() if line.startswith("RESULT:"))
    return json.loads(line[len("RESULT:") :])


def test_auto_register_off_by_default():
    reg = _registry_after_setup({})
    assert "auth.User" not in reg
    assert "auth.Group" not in reg


def test_auto_register_registers_and_redacts_secrets():
    reg = _registry_after_setup({"AUTO_REGISTER": True})
    assert "auth.User" in reg
    assert "auth.Group" in reg
    # secret-looking fields are excluded from an auto-registered model
    assert "password" in reg["auth.User"]
    # framework/internal models are skipped
    assert "auth.Permission" not in reg
    assert "contenttypes.ContentType" not in reg


def test_auto_register_exclude_by_app_label():
    reg = _registry_after_setup({"AUTO_REGISTER": True, "AUTO_REGISTER_EXCLUDE": ["auth"]})
    assert "auth.User" not in reg
    assert "auth.Group" not in reg


def test_auto_register_exclude_by_model_key():
    reg = _registry_after_setup({"AUTO_REGISTER": True, "AUTO_REGISTER_EXCLUDE": ["auth.User"]})
    assert "auth.User" not in reg
    assert "auth.Group" in reg  # only the named model is excluded
