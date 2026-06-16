"""Conjure — conjure your Django admin.

Public API:
    from conjure import register, AdminConfig
    from conjure import register_widget
"""

from importlib.metadata import PackageNotFoundError, version

from conjure.registry import AdminConfig, admin_register, register, registry

__all__ = ["AdminConfig", "registry", "register", "admin_register", "register_widget"]


def __getattr__(name):
    # Lazily expose `register_widget`. Importing it pulls in `conjure.widgets`, which imports
    # `rest_framework.views`; DRF resolves `DEFAULT_AUTHENTICATION_CLASSES` at class-definition
    # time. When a project sets that to an auth class that imports `django.contrib.auth.models`
    # (e.g. SimpleJWT), doing so while Django is still populating apps — which happens when this
    # package is imported to read its AppConfig — raises AppRegistryNotReady. Deferring the import
    # to first access keeps `import conjure` free of any rest_framework / models import.
    # `conjure.widgets` is still imported (eagerly, safely) from ConjureConfig.ready().
    if name == "register_widget":
        from conjure.widgets import register_widget

        return register_widget
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


try:
    # Single source of truth = the installed package metadata (pyproject version).
    __version__ = version("django-conjure")
except PackageNotFoundError:  # running from source without an install
    __version__ = "0.0.0+local"
