"""
@Domain: conjure / dashboard widgets
@BusinessLogic: A dashboard widget = a frontend component + a data endpoint here. Register a
    function under a name and it's served at /widgets/{name}/.
@Context: DECOUPLING — ships only project-agnostic widgets (recent audit, model counts). Domain
    widgets (signup trends, revenue, etc.) are registered by the project via @register_widget, so
    the package never imports project models. See examples/demo-shop for domain widgets.
@Connection: packages/web/src/pages/dashboard, conjure/registry.py, conjure/models.py
"""

from django.http import Http404
from rest_framework.response import Response
from rest_framework.views import APIView

from conjure.mixins import ConjureAuthMixin
from conjure.permissions import IsStaffUser

WIDGETS = {}


def register_widget(name):
    """``@register_widget("name")`` — register a ``fn(request) -> dict`` widget endpoint."""

    def wrapper(fn):
        WIDGETS[name] = fn
        return fn

    return wrapper


@register_widget("recent-audit")
def recent_audit_widget(request):
    """Last 10 admin writes — empty when the audit table isn't migrated yet."""
    from conjure.models import AdminAuditLog

    try:
        rows = list(AdminAuditLog.objects.select_related("actor")[:10])
    except Exception:
        return {"rows": [], "unavailable": True}
    return {
        "rows": [
            {
                "id": row.id,
                "actor": str(row.actor) if row.actor else None,
                "action": row.action,
                "action_display": row.get_action_display(),
                "model_label": row.model_label,
                "object_pk": row.object_pk,
                "object_repr": row.object_repr,
                "created_at": row.created_at.isoformat(),
            }
            for row in rows
        ]
    }


@register_widget("model-counts")
def model_counts_widget(request):
    """Row counts for the registered models — a generic, zero-config overview card set."""
    from conjure.registry import registry

    cards = []
    for key, config in registry.items():
        try:
            count = config.model.objects.count()
        except Exception:
            continue
        cards.append({"key": key, "label": str(config.model._meta.verbose_name_plural), "value": count})
    cards.sort(key=lambda c: c["value"], reverse=True)
    return {"cards": cards[:8]}


class WidgetView(ConjureAuthMixin, APIView):
    permission_classes = [IsStaffUser]
    swagger_schema = None

    def get(self, request, name):
        handler = WIDGETS.get(name)
        if handler is None:
            raise Http404
        return Response(handler(request))
