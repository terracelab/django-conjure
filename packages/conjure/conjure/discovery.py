"""
@Domain: conjure / discovery
@BusinessLogic: Auto-import each installed app's ``admin_config`` module on startup, exactly like
    Django's ``admin.autodiscover()`` does for ``admin``. This is what lets a project register
    models by dropping an ``admin_config.py`` into any app — no central import list.
@Context: DECOUPLING — replaces the old hardcoded ``registrations.py`` single-file import.
@Connection: conjure/apps.py
"""

from django.utils.module_loading import autodiscover_modules


def autodiscover():
    autodiscover_modules("admin_config")
