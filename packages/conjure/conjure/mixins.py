"""
@Domain: conjure / auth wiring
@BusinessLogic: Make Conjure's endpoints authenticate themselves based on CONJURE["AUTH"], so the
    package works out of the box without the project editing REST_FRAMEWORK's global
    DEFAULT_AUTHENTICATION_CLASSES. Session mode -> SessionAuthentication; JWT mode ->
    JWTAuthentication (from the [jwt] extra) plus a session fallback.
@Context: DECOUPLING — a project that uses JWT only for Conjure shouldn't have to change its
    global DRF auth (which would affect its other APIs).
@Connection: conjure/viewsets.py, conjure/schema.py, conjure/widgets.py, conjure/auth.py
"""

from rest_framework.authentication import SessionAuthentication

from conjure.conf import conjure_settings


def get_conjure_authenticators():
    classes = []
    if conjure_settings.AUTH == "jwt":
        try:
            from rest_framework_simplejwt.authentication import JWTAuthentication

            classes.append(JWTAuthentication)
        except ImportError:  # pragma: no cover - guarded; [jwt] extra not installed
            pass
    # Session is always allowed (works for same-origin admin; harmless JWT fallback).
    classes.append(SessionAuthentication)
    return [cls() for cls in classes]


class ConjureAuthMixin:
    """Resolve authenticators from CONJURE["AUTH"] at request time (honors override_settings)."""

    def get_authenticators(self):
        return get_conjure_authenticators()
