"""
@Domain: conjure / schema introspection
@BusinessLogic: Expose registered models' metadata (fields/types/choices/FK/search·filter config/
    4 permissions/inlines) as JSON. This is the source data for codegen and the reference for
    runtime form validation.
@Context: Query-param and response shapes are a 1:1 contract with the frontend codegen templates —
    do not change.
@Connection: conjure/registry.py, packages/web codegen
"""

from django.db import models
from django.http import Http404
from rest_framework.response import Response
from rest_framework.views import APIView

from conjure.mixins import ConjureAuthMixin
from conjure.permissions import IsStaffUser, get_model_permissions
from conjure.registry import registry


def _json_safe_default(field):
    if not field.has_default():
        return None
    default = field.get_default()
    if isinstance(default, (str, int, float, bool)) or default is None:
        return default
    return None


def field_schema(field, config):
    """One Django model field -> schema dict."""
    data = {
        "name": field.name,
        "type": type(field).__name__,
        "verbose_name": str(field.verbose_name),
        "required": bool(
            field.editable
            and not field.blank
            and not field.has_default()
            and not field.null
            and not isinstance(field, models.BooleanField)
        ),
        "editable": bool(field.editable and not field.primary_key and field.name not in (config.readonly_fields or ())),
        "null": field.null,
    }
    if getattr(field, "max_length", None):
        data["max_length"] = field.max_length
    if field.choices:
        data["choices"] = [[value, str(label)] for value, label in field.choices]
    if isinstance(field, (models.ForeignKey, models.OneToOneField, models.ManyToManyField)):
        related = field.related_model
        data["related_model"] = f"{related._meta.app_label}.{related.__name__}"
        related_config = registry.get(data["related_model"])
        data["related_search_fields"] = related_config.get_autocomplete_search_fields() if related_config else []
    if isinstance(field, models.ImageField):
        data["upload"] = "image"
    elif isinstance(field, models.FileField):
        data["upload"] = "file"
    if isinstance(field, models.DecimalField):
        data["max_digits"] = field.max_digits
        data["decimal_places"] = field.decimal_places
    if field.help_text:
        data["help_text"] = str(field.help_text)
    default = _json_safe_default(field)
    if default is not None:
        data["default"] = default
    return data


def model_schema(key, config, user):
    """Full schema for one model — shared by codegen and runtime."""
    model = config.model
    opts = model._meta
    excluded = set(config.exclude or ())
    fields = [
        field_schema(f, config) for f in opts.get_fields() if isinstance(f, models.Field) and f.name not in excluded
    ]
    return {
        "model": key,
        "app_label": opts.app_label,
        "model_name": model.__name__,
        "verbose_name": str(opts.verbose_name),
        "verbose_name_plural": str(opts.verbose_name_plural),
        "pk_field": opts.pk.name,
        "fields": fields,
        "list_display": config.get_list_display(),
        "search_fields": config.get_search_fields(),
        "list_filter": config.get_list_filter(),
        "ordering": config.get_ordering(),
        "readonly_fields": list(config.readonly_fields or ()),
        "is_readonly": config.is_readonly,
        "inlines": [
            {
                "model": f"{child._meta.app_label}.{child.__name__}",
                "fk_field": fk_field,
                "verbose_name": str(child._meta.verbose_name),
            }
            for child, fk_field in (config.inlines or ())
        ],
        "permissions": get_model_permissions(user, model),
    }


class SchemaListView(ConjureAuthMixin, APIView):
    """GET /schema/ — lightweight list of registered models for sidebar/codegen."""

    permission_classes = [IsStaffUser]
    swagger_schema = None

    def get(self, request):
        results = []
        for key, config in registry.items():
            opts = config.model._meta
            results.append(
                {
                    "model": key,
                    "app_label": opts.app_label,
                    "verbose_name": str(opts.verbose_name),
                    "verbose_name_plural": str(opts.verbose_name_plural),
                    "is_readonly": config.is_readonly,
                    "permissions": get_model_permissions(request.user, config.model),
                }
            )
        return Response({"models": results})


class SchemaDetailView(ConjureAuthMixin, APIView):
    """GET /schema/{app_label}.{ModelName}/ — full schema for one model."""

    permission_classes = [IsStaffUser]
    swagger_schema = None

    def get(self, request, model_key):
        config = registry.get(model_key)
        if config is None:
            raise Http404
        key = f"{config.model._meta.app_label}.{config.model.__name__}"
        return Response(model_schema(key, config, request.user))
