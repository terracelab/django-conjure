"""
@Domain: conjure / settings
@BusinessLogic: Single accessor for all Conjure settings. Project overrides live under the
    ``CONJURE`` dict in Django settings and are merged over DEFAULTS. This is the decoupling
    layer — every project-specific knob (auth mode, brand, user payload, page size, audit) is
    read through ``conjure_settings`` instead of being hardcoded, so the app attaches to any
    project without edits.
@Connection: conjure/auth.py (AUTH, USER_PAYLOAD), conjure/audit.py (AUDIT, LOGGER_NAME),
    conjure/viewsets.py (PAGE_SIZE), conjure/apps.py (AUTODISCOVER)
"""

from __future__ import annotations

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils.module_loading import import_string

DEFAULTS = {
    # "session" (reuse Django login, works anywhere) or "jwt" (SimpleJWT — requires the [jwt] extra)
    "AUTH": "session",
    # Header / login title + accent color surfaced to the frontend config endpoint.
    "BRAND": {"name": "Conjure", "accent": "#4f46e5"},
    # Dotted path or callable -> dict, used as the login/me response. None = built-in default
    # (id / username / name via get_username()/get_full_name() — works with any AUTH_USER_MODEL).
    "USER_PAYLOAD": None,
    # List pagination.
    "PAGE_SIZE": 50,
    "MAX_PAGE_SIZE": 200,
    # Write the audit log (requires `migrate conjure`). When False, writes are skipped entirely.
    "AUDIT": True,
    # Auto-import every installed app's ``admin_config`` module on ready() (like admin.autodiscover).
    "AUTODISCOVER": True,
    # Register every concrete project model not already registered (opt-in, install-and-go). Explicit
    # @register wins; framework/internal models + secret-looking fields are skipped/redacted.
    "AUTO_REGISTER": False,
    # app_labels or "app_label.Model" strings to skip when AUTO_REGISTER is on.
    "AUTO_REGISTER_EXCLUDE": [],
    # Sidebar grouping: app_label -> group label. Apps sharing a label merge into one group;
    # group order follows this dict's insertion order; unlisted apps group by app_label, last.
    "APP_GROUPS": {},
    # Section tabs: list of model-key lists. The first model is the section "main" (the only one
    # shown in the sidebar); the rest become tabs on the main's page. Models in no section stand
    # alone. e.g. [["user.User", "user.SocialAccount", "user.UserConsent"]].
    "SECTIONS": [],
    # Logger used for non-fatal internal errors (e.g. audit write failures).
    "LOGGER_NAME": "conjure",
}

# Keys whose value is a dotted import path that should be resolved to the referenced object.
_IMPORT_STRINGS = {"USER_PAYLOAD"}


class ConjureSettings:
    """Lazy, cached accessor over ``settings.CONJURE`` merged onto DEFAULTS."""

    def __init__(self):
        self._cache: dict = {}

    @property
    def _user(self) -> dict:
        user = getattr(settings, "CONJURE", {})
        if not isinstance(user, dict):
            raise ImproperlyConfigured("settings.CONJURE must be a dict.")
        return user

    def __getattr__(self, name: str):
        if name.startswith("_"):
            raise AttributeError(name)
        if name not in DEFAULTS:
            raise AttributeError(f"Unknown Conjure setting: {name!r}")
        if name in self._cache:
            return self._cache[name]

        default = DEFAULTS[name]
        value = self._user.get(name, default)
        # Shallow-merge dict defaults (e.g. BRAND) so a partial override keeps the rest.
        if isinstance(default, dict) and isinstance(value, dict):
            value = {**default, **value}
        if name in _IMPORT_STRINGS and isinstance(value, str):
            value = import_string(value)

        self._cache[name] = value
        return value

    def reload(self):
        """Drop the cache — used by tests that override settings."""
        self._cache.clear()


conjure_settings = ConjureSettings()


# Keep settings live under override_settings(CONJURE=...) (same pattern DRF uses for its own settings).
from django.test.signals import setting_changed  # noqa: E402


def _reload_conjure_settings(*, setting, **kwargs):
    if setting == "CONJURE":
        conjure_settings.reload()


setting_changed.connect(_reload_conjure_settings)
