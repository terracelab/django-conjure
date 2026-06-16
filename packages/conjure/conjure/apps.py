from django.apps import AppConfig


class ConjureConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "conjure"
    verbose_name = "Conjure"

    def ready(self):
        # Register built-in widgets.
        from conjure import widgets  # noqa: F401
        from conjure.conf import conjure_settings

        # Discover each app's admin_config module (like admin.autodiscover()).
        if conjure_settings.AUTODISCOVER:
            from conjure.discovery import autodiscover

            autodiscover()

        # Optionally register every remaining project model (install-and-go). Runs after
        # autodiscover so explicit @register configs always take precedence.
        if conjure_settings.AUTO_REGISTER:
            from conjure.registry import autoregister

            autoregister()
