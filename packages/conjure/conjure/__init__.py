"""Conjure — conjure your Django admin.

Public API:
    from conjure import register, AdminConfig
    from conjure import register_widget
"""

from importlib.metadata import PackageNotFoundError, version

from conjure.registry import AdminConfig, admin_register, register, registry
from conjure.widgets import register_widget

__all__ = ["AdminConfig", "registry", "register", "admin_register", "register_widget"]

try:
    # Single source of truth = the installed package metadata (pyproject version).
    __version__ = version("django-conjure")
except PackageNotFoundError:  # running from source without an install
    __version__ = "0.0.0+local"
