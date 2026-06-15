"""
@Domain: conjure / CRUD API
@BusinessLogic: Build a ModelSerializer dynamically from an AdminConfig. Every object response
    gets _label (str(obj)), {fk}_label per FK, and {field}_display per choices field, so the
    frontend can render display strings without extra requests.
@Connection: conjure/viewsets.py
"""

from django.db import models

from rest_framework import serializers


def _make_label_method(field_name):
    def method(self, obj):
        value = getattr(obj, field_name, None)
        return str(value) if value is not None else None

    return method


def _make_display_method(field_name):
    def method(self, obj):
        getter = getattr(obj, f"get_{field_name}_display", None)
        return getter() if getter else None

    return method


_serializer_cache = {}


def build_serializer(config):
    """AdminConfig -> ModelSerializer class (cached by model key)."""
    model = config.model
    cache_key = f"{model._meta.app_label}.{model.__name__}"
    if cache_key in _serializer_cache:
        return _serializer_cache[cache_key]

    attrs = {
        "_label": serializers.SerializerMethodField(),
        "get__label": lambda self, obj: str(obj),
    }

    excluded = set(config.exclude or ())
    for f in model._meta.get_fields():
        if not isinstance(f, models.Field) or f.name in excluded:
            continue
        if isinstance(f, (models.ForeignKey, models.OneToOneField)):
            attrs[f"{f.name}_label"] = serializers.SerializerMethodField()
            attrs[f"get_{f.name}_label"] = _make_label_method(f.name)
        elif f.choices:
            attrs[f"{f.name}_display"] = serializers.SerializerMethodField()
            attrs[f"get_{f.name}_display"] = _make_display_method(f.name)

    meta_attrs = {"model": model, "ref_name": cache_key.replace(".", "_")}
    if config.exclude:
        meta_attrs["exclude"] = tuple(config.exclude)
    else:
        meta_attrs["fields"] = "__all__"
    # Only real model fields among readonly_fields become read_only (ignore display-only names).
    model_field_names = {f.name for f in model._meta.get_fields() if isinstance(f, models.Field)}
    readonly = tuple(name for name in (config.readonly_fields or ()) if name in model_field_names and name not in excluded)
    if readonly:
        meta_attrs["read_only_fields"] = readonly
    attrs["Meta"] = type("Meta", (), meta_attrs)

    serializer_cls = type(f"{model.__name__}AdminSerializer", (serializers.ModelSerializer,), attrs)
    _serializer_cache[cache_key] = serializer_cls
    return serializer_cls
