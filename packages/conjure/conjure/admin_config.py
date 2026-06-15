"""Conjure registers its own audit-log model (read-only) so the dashboard's audit page works."""

from conjure import AdminConfig, register
from conjure.models import AdminAuditLog


@register(AdminAuditLog)
class AdminAuditLogConfig(AdminConfig):
    is_readonly = True
    list_display = ["id", "created_at", "actor", "action", "model_label", "object_pk", "object_repr"]
    search_fields = ["model_label", "object_repr", "object_pk"]
    list_filter = ["action"]
