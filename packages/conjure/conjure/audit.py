"""
@Domain: conjure / audit log
@BusinessLogic: Helper to record an audit entry for each write. CRUD must keep working even when
    the AdminAuditLog table hasn't been migrated yet, so write failures are swallowed and logged.
@Context: DECOUPLING — uses the standard library ``logging`` (logger name from settings) instead
    of any project-specific logger. Honors CONJURE["AUDIT"] (off => no-op).
@Connection: conjure/viewsets.py, conjure/models.py, conjure/conf.py
"""

import logging

from conjure.conf import conjure_settings

logger = logging.getLogger(conjure_settings.LOGGER_NAME)


def get_client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def build_diff(before, after):
    """Compare before/after serializer dicts -> {field: [old, new]}. Skips internal fields."""
    diff = {}
    keys = set(before.keys()) | set(after.keys())
    for key in keys:
        if key.startswith("_") or key.endswith("_label") or key.endswith("_display"):
            continue
        b, a = before.get(key), after.get(key)
        if b != a:
            diff[key] = [b, a]
    return diff


def record(request, model_label, object_pk, action, object_repr="", diff=None):
    """Record one audit entry — failure here never blocks the underlying write."""
    if not conjure_settings.AUDIT:
        return

    from conjure.models import AdminAuditLog

    try:
        AdminAuditLog.objects.create(
            actor=request.user if request.user.is_authenticated else None,
            model_label=model_label,
            object_pk=str(object_pk),
            object_repr=str(object_repr)[:200],
            action=action,
            diff=diff or None,
            ip=get_client_ip(request),
        )
    except Exception:  # table not migrated yet, etc. — auditing must not break CRUD
        logger.exception("[conjure] failed to write audit log")
