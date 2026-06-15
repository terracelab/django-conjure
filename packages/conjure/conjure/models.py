"""
@Domain: conjure / audit log
@BusinessLogic: Record every write (create/update/delete/bulk) made through the Conjure admin,
    with a before/after diff. Replaces django.contrib.admin's LogEntry.
@Context: DECOUPLING — the actor FK points at ``settings.AUTH_USER_MODEL``, so this attaches to
    any project regardless of its user model. The table is optional: until ``migrate conjure`` is
    run, audit.record() silently skips (see audit.py).
@Connection: conjure/audit.py (write logic), conjure/viewsets.py (callers)
"""

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class AdminAuditLog(models.Model):
    """actor (staff user) · target model · object pk · action · diff (JSON) · IP."""

    ACTION_CHOICES = [
        ("create", _("create")),
        ("update", _("update")),
        ("delete", _("delete")),
        ("bulk_update", _("bulk update")),
        ("bulk_delete", _("bulk delete")),
    ]

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="conjure_audit_logs",
        verbose_name=_("actor"),
    )
    model_label = models.CharField(max_length=100, verbose_name=_("target model"))  # e.g. "shop.Product"
    object_pk = models.CharField(max_length=64, verbose_name=_("target pk"))
    object_repr = models.CharField(max_length=200, blank=True, default="", verbose_name=_("target repr"))
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name=_("action"))
    diff = models.JSONField(null=True, blank=True, default=None, verbose_name=_("changes"))  # {"field": [before, after]}
    ip = models.GenericIPAddressField(null=True, blank=True, default=None, verbose_name=_("IP"))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("recorded at"))

    class Meta:
        db_table = "conjure_audit_log"
        ordering = ["-created_at"]
        verbose_name = _("admin audit log")
        verbose_name_plural = _("admin audit logs")
        indexes = [
            models.Index(fields=["model_label", "object_pk"], name="conjure_audit_target_idx"),
            models.Index(fields=["-created_at"], name="conjure_audit_created_idx"),
        ]

    def __str__(self):
        return f"{self.actor} {self.get_action_display()} {self.model_label}#{self.object_pk}"
