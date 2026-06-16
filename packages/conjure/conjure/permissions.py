"""
@Domain: conjure / permissions
@BusinessLogic: Every endpoint is gated on is_staff; model CRUD maps to Django's built-in model
    permissions (view/add/change/delete). Superusers pass has_perm always.
    ``AdminConfig.is_readonly`` models block all write actions.
@Context: The frontend uses the schema's 4 permission flags for button visibility only — the
    backend is the real gate.
@Connection: conjure/viewsets.py, conjure/schema.py
"""

from rest_framework.permissions import BasePermission

ACTION_PERM_MAP = {
    "list": "view",
    "retrieve": "view",
    "autocomplete": "view",
    "related": "view",
    "create": "add",
    "partial_update": "change",
    "destroy": "delete",
}

WRITE_ACTIONS = {"create", "partial_update", "destroy", "bulk"}


def get_model_permissions(user, model):
    """Current user's 4 model permissions — for the schema response."""
    opts = model._meta
    return {
        codename: user.has_perm(f"{opts.app_label}.{codename}_{opts.model_name}")
        for codename in ("view", "add", "change", "delete")
    }


class IsStaffUser(BasePermission):
    """Common gate — active staff only."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_active and user.is_staff)


class AdminModelPermission(IsStaffUser):
    """Maps CRUD actions to Django model permissions. bulk is checked per-operation in the handler."""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        config = view.get_config_or_none()
        if config is None:
            return True  # 404 handled in the view
        action = getattr(view, "action", None)
        if config.is_readonly and action in WRITE_ACTIONS:
            return False
        if action == "bulk":
            return True  # per-op permission checked in viewsets.bulk
        codename = ACTION_PERM_MAP.get(action, "change")
        opts = config.model._meta
        return request.user.has_perm(f"{opts.app_label}.{codename}_{opts.model_name}")
