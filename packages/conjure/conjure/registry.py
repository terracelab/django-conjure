"""
@Domain: conjure / registry
@BusinessLogic: Register an AdminConfig per model via a decorator, forming the single source of
    truth for the schema / CRUD / autocomplete endpoints. Coexists independently with Django's
    own admin.py.
@Context: Unspecified options (list_display, etc.) are inferred from model meta — string fields
    become search, choices/FK/Bool become filters.
@Connection: conjure/schema.py, conjure/viewsets.py, conjure/discovery.py
"""

from django.db import models


class AdminConfig:
    """
    ModelAdmin-like declaration. Anything left unset is inferred from the model's fields by the
    ``get_*`` helpers (string -> search, choices/FK/Bool -> filter).
    """

    model = None

    # ModelAdmin-like declarations — inferred when unset.
    list_display = None  # list columns
    search_fields = None  # targets of ?search=
    list_filter = None  # targets of ?{field}= exact-match filters
    ordering = None  # default ordering
    readonly_fields = ()  # fields not editable in the form
    exclude = ()  # fields hidden from form/schema
    autocomplete_search_fields = None  # FK autocomplete search targets (on the related model)
    inlines = ()  # [(child_model, parent_fk_name)] — inline editing on the detail page
    is_readonly = False  # read-only model (log/history) — blocks add/change/delete entirely

    def __init__(self, model):
        self.model = model

    # ── inference helpers ──────────────────────────────────────

    def _concrete_fields(self):
        return [f for f in self.model._meta.get_fields() if isinstance(f, models.Field) and not isinstance(f, models.ManyToManyField)]

    def _editable_fields(self):
        return [f for f in self._concrete_fields() if f.editable and not f.primary_key]

    def get_list_display(self):
        if self.list_display:
            return list(self.list_display)
        # default: pk + up to 6 leading editable fields (long text excluded)
        names = [self.model._meta.pk.name]
        for f in self._editable_fields():
            if isinstance(f, (models.TextField, models.JSONField)):
                continue
            names.append(f.name)
            if len(names) >= 7:
                break
        return names

    def get_search_fields(self):
        if self.search_fields is not None:
            return list(self.search_fields)
        return [f.name for f in self._editable_fields() if isinstance(f, models.CharField) and not f.choices][:3]

    def get_list_filter(self):
        if self.list_filter is not None:
            return list(self.list_filter)
        names = []
        for f in self._editable_fields():
            if f.choices or isinstance(f, (models.BooleanField, models.ForeignKey)):
                names.append(f.name)
        return names[:6]

    def get_ordering(self):
        if self.ordering:
            return list(self.ordering)
        if self.model._meta.ordering:
            return list(self.model._meta.ordering)
        return [f"-{self.model._meta.pk.name}"]

    def get_autocomplete_search_fields(self):
        if self.autocomplete_search_fields:
            return list(self.autocomplete_search_fields)
        return self.get_search_fields() or [self.model._meta.pk.name]


class AdminRegistry:
    """Holds AdminConfig instances keyed by ``{app_label}.{ModelName}``."""

    def __init__(self):
        self._registry = {}

    def register(self, model, config_cls=None):
        key = f"{model._meta.app_label}.{model.__name__}"
        cls = config_cls or AdminConfig
        instance = cls(model)
        instance.model = model
        self._registry[key] = instance
        return instance

    def get(self, key):
        # URL keys are case-insensitive ("board.boardpost" == "board.BoardPost").
        if key in self._registry:
            return self._registry[key]
        lowered = key.lower()
        for k, v in self._registry.items():
            if k.lower() == lowered:
                return v
        return None

    def items(self):
        return self._registry.items()


registry = AdminRegistry()


def register(model):
    """``@register(Product)`` decorator — attach to an AdminConfig subclass."""

    def wrapper(config_cls):
        registry.register(model, config_cls)
        return config_cls

    return wrapper


# Backwards-friendly alias mirroring Django's naming.
admin_register = register
