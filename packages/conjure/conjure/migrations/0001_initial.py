import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
from django.utils.translation import gettext_lazy as _


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AdminAuditLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("model_label", models.CharField(max_length=100, verbose_name=_("target model"))),
                ("object_pk", models.CharField(max_length=64, verbose_name=_("target pk"))),
                ("object_repr", models.CharField(blank=True, default="", max_length=200, verbose_name=_("target repr"))),
                (
                    "action",
                    models.CharField(
                        choices=[
                            ("create", _("create")),
                            ("update", _("update")),
                            ("delete", _("delete")),
                            ("bulk_update", _("bulk update")),
                            ("bulk_delete", _("bulk delete")),
                        ],
                        max_length=20,
                        verbose_name=_("action"),
                    ),
                ),
                ("diff", models.JSONField(blank=True, default=None, null=True, verbose_name=_("changes"))),
                ("ip", models.GenericIPAddressField(blank=True, default=None, null=True, verbose_name=_("IP"))),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name=_("recorded at"))),
                (
                    "actor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="conjure_audit_logs",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name=_("actor"),
                    ),
                ),
            ],
            options={
                "verbose_name": _("admin audit log"),
                "verbose_name_plural": _("admin audit logs"),
                "db_table": "conjure_audit_log",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="adminauditlog",
            index=models.Index(fields=["model_label", "object_pk"], name="conjure_audit_target_idx"),
        ),
        migrations.AddIndex(
            model_name="adminauditlog",
            index=models.Index(fields=["-created_at"], name="conjure_audit_created_idx"),
        ),
    ]
