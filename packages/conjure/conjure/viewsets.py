"""
@Domain: conjure / CRUD API
@BusinessLogic: A single generic ViewSet provides CRUD for every registered model. The URL's
    model_key resolves the AdminConfig. The query-param contract (page/page_size/ordering/search/
    {field}__lookup) is a 1:1 match with the frontend codegen — do not change. Every write is
    audited.
@Context: Inline-edit atomicity is guaranteed by the bulk endpoint (operations) running in a
    single transaction.
@Connection: conjure/registry.py, conjure/serializers.py, conjure/audit.py, conjure/permissions.py
"""

from django.contrib.admin.utils import NestedObjects
from django.db import models, transaction
from django.db.models import Q
from django.http import Http404

from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from conjure import audit
from conjure.conf import conjure_settings
from conjure.mixins import ConjureAuthMixin
from conjure.permissions import AdminModelPermission
from conjure.registry import registry
from conjure.serializers import build_serializer

RESERVED_PARAMS = {"page", "page_size", "ordering", "search", "format"}
ALLOWED_LOOKUPS = {"exact", "in", "gte", "lte", "gt", "lt", "isnull", "icontains", "date"}


class AdminPagination(PageNumberPagination):
    page_size_query_param = "page_size"

    @property
    def page_size(self):
        return conjure_settings.PAGE_SIZE

    @property
    def max_page_size(self):
        return conjure_settings.MAX_PAGE_SIZE


def _parse_bool(value):
    return str(value).lower() in ("true", "1", "yes")


class AdminModelViewSet(ConjureAuthMixin, viewsets.ViewSet):
    """
    list/create/retrieve/partial_update/destroy + autocomplete(FK search)/bulk(atomic inline ops)/
    related(delete-impact count). Filters are restricted to declared list_filter paths or local
    concrete fields to block arbitrary JOIN traversal.
    """

    permission_classes = [AdminModelPermission]
    swagger_schema = None  # admin-only API — kept out of any project's public schema

    # ── shared helpers ─────────────────────────────────────────

    def get_config_or_none(self):
        return registry.get(self.kwargs.get("model_key", ""))

    def get_config(self):
        config = self.get_config_or_none()
        if config is None:
            raise Http404("Unregistered model.")
        return config

    def get_serializer_class(self, config):
        return build_serializer(config)

    def get_object(self, config):
        try:
            return self._base_queryset(config).get(pk=self.kwargs["pk"])
        except config.model.DoesNotExist:
            raise Http404

    def _model_key(self, config):
        return f"{config.model._meta.app_label}.{config.model.__name__}"

    def _base_queryset(self, config):
        model = config.model
        fk_names = [f.name for f in model._meta.get_fields() if isinstance(f, (models.ForeignKey, models.OneToOneField))]
        qs = model.objects.all()
        if fk_names:
            qs = qs.select_related(*fk_names)
        return qs

    # ── list query contract (1:1 with codegen — do not change) ──

    def _terminal_field(self, model, field_path):
        """Resolve the terminal field object across relation spans (user__is_test) — for value coercion."""
        meta = model._meta
        field = None
        for part in field_path.split("__"):
            try:
                field = meta.get_field(part)
            except Exception:
                return None
            if field.is_relation and field.related_model:
                meta = field.related_model._meta
        return field

    def _apply_filters(self, qs, config, params):
        model = config.model
        local_fields = {f.name for f in model._meta.get_fields() if isinstance(f, models.Field)}
        declared = set(config.get_list_filter())
        for raw_key, value in params.items():
            if raw_key in RESERVED_PARAMS or value == "":
                continue
            parts = raw_key.split("__")
            lookup = parts[-1] if parts[-1] in ALLOWED_LOOKUPS else "exact"
            field_path = "__".join(parts[:-1]) if parts[-1] in ALLOWED_LOOKUPS else raw_key
            # allow only declared list_filter paths or local concrete fields
            if field_path not in declared and field_path not in local_fields:
                continue
            try:
                if lookup == "in":
                    qs = qs.filter(**{f"{field_path}__in": [v for v in value.split(",") if v]})
                elif lookup == "isnull":
                    qs = qs.filter(**{f"{field_path}__isnull": _parse_bool(value)})
                else:
                    if lookup == "exact" and isinstance(self._terminal_field(model, field_path), models.BooleanField):
                        value = _parse_bool(value)
                    qs = qs.filter(**{f"{field_path}__{lookup}": value})
            except (ValueError, TypeError) as e:
                raise ValidationError({raw_key: [f"Invalid filter value: {e}"]})
        return qs

    def _apply_search(self, qs, config, params):
        term = params.get("search", "").strip()
        search_fields = config.get_search_fields()
        if not term or not search_fields:
            return qs
        condition = Q()
        for path in search_fields:
            condition |= Q(**{f"{path}__icontains": term})
        return qs.filter(condition)

    def _apply_ordering(self, qs, config, params):
        ordering = params.get("ordering", "").strip()
        if ordering:
            local_fields = {f.name for f in config.model._meta.get_fields() if isinstance(f, models.Field)}
            requested = [o for o in ordering.split(",") if o.lstrip("-") in local_fields]
            if requested:
                return qs.order_by(*requested)
        return qs.order_by(*config.get_ordering())

    # ── CRUD actions ───────────────────────────────────────────

    def list(self, request, model_key=None):
        config = self.get_config()
        qs = self._base_queryset(config)
        qs = self._apply_filters(qs, config, request.query_params)
        qs = self._apply_search(qs, config, request.query_params)
        qs = self._apply_ordering(qs, config, request.query_params)
        paginator = AdminPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = self.get_serializer_class(config)(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    def create(self, request, model_key=None):
        config = self.get_config()
        serializer = self.get_serializer_class(config)(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            obj = serializer.save()
        audit.record(request, self._model_key(config), obj.pk, "create", object_repr=obj)
        return Response(self.get_serializer_class(config)(obj, context={"request": request}).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, model_key=None, pk=None):
        config = self.get_config()
        obj = self.get_object(config)
        return Response(self.get_serializer_class(config)(obj, context={"request": request}).data)

    def partial_update(self, request, model_key=None, pk=None):
        config = self.get_config()
        obj = self.get_object(config)
        serializer_cls = self.get_serializer_class(config)
        before = serializer_cls(obj, context={"request": request}).data
        serializer = serializer_cls(obj, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            obj = serializer.save()
        after = serializer_cls(obj, context={"request": request}).data
        audit.record(request, self._model_key(config), obj.pk, "update", object_repr=obj, diff=audit.build_diff(before, after))
        return Response(after)

    def destroy(self, request, model_key=None, pk=None):
        config = self.get_config()
        obj = self.get_object(config)
        object_repr, object_pk = str(obj), obj.pk
        with transaction.atomic():
            obj.delete()
        audit.record(request, self._model_key(config), object_pk, "delete", object_repr=object_repr)
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── extra actions ──────────────────────────────────────────

    def autocomplete(self, request, model_key=None):
        """Lightweight search for FK Combobox — fixed page_size 20, {results, has_more}."""
        config = self.get_config()
        term = request.query_params.get("q", "").strip()
        try:
            page = max(int(request.query_params.get("page", 1)), 1)
        except ValueError:
            page = 1
        qs = config.model.objects.all()
        if term:
            condition = Q()
            for path in config.get_autocomplete_search_fields():
                condition |= Q(**{f"{path}__icontains": term})
            if str(term).isdigit():
                condition |= Q(pk=term)
            qs = qs.filter(condition)
        qs = qs.order_by(*config.get_ordering())
        page_size = 20
        offset = (page - 1) * page_size
        rows = list(qs[offset : offset + page_size + 1])
        has_more = len(rows) > page_size
        return Response({"results": [{"value": obj.pk, "label": str(obj)} for obj in rows[:page_size]], "has_more": has_more})

    def related(self, request, model_key=None, pk=None):
        """For the delete-confirm dialog — count objects that CASCADE-delete with this one."""
        config = self.get_config()
        obj = self.get_object(config)
        collector = NestedObjects(using="default")
        collector.collect([obj])
        summary = []
        for model, instances in collector.model_objs.items():
            if model is config.model:
                count = sum(1 for i in instances if i.pk != obj.pk)
                if count == 0:
                    continue
            else:
                count = len(instances)
            summary.append({"model": f"{model._meta.app_label}.{model.__name__}", "verbose_name": str(model._meta.verbose_name), "count": count})
        return Response({"related": summary})

    def bulk(self, request, model_key=None):
        """
        Bulk actions + atomic inline ops.
        - {"action": "delete", "ids": [...]} / {"action": "update", "ids": [...], "data": {...}}
        - {"operations": [{"op": "create"|"update"|"delete", "pk"?, "data"?}, ...]} — single transaction
        """
        config = self.get_config()
        if config.is_readonly:
            raise PermissionDenied("Read-only model.")
        user = request.user
        opts = config.model._meta
        serializer_cls = self.get_serializer_class(config)
        key = self._model_key(config)

        def require_perm(codename):
            if not user.has_perm(f"{opts.app_label}.{codename}_{opts.model_name}"):
                raise PermissionDenied(f"Missing {codename} permission.")

        operations = request.data.get("operations")
        if operations is not None:
            results = []
            with transaction.atomic():
                for op in operations:
                    op_type = op.get("op")
                    if op_type == "create":
                        require_perm("add")
                        serializer = serializer_cls(data=op.get("data", {}), context={"request": request})
                        serializer.is_valid(raise_exception=True)
                        obj = serializer.save()
                        audit.record(request, key, obj.pk, "create", object_repr=obj)
                        results.append({"op": "create", "pk": obj.pk})
                    elif op_type == "update":
                        require_perm("change")
                        obj = config.model.objects.get(pk=op.get("pk"))
                        before = serializer_cls(obj, context={"request": request}).data
                        serializer = serializer_cls(obj, data=op.get("data", {}), partial=True, context={"request": request})
                        serializer.is_valid(raise_exception=True)
                        obj = serializer.save()
                        after = serializer_cls(obj, context={"request": request}).data
                        audit.record(request, key, obj.pk, "update", object_repr=obj, diff=audit.build_diff(before, after))
                        results.append({"op": "update", "pk": obj.pk})
                    elif op_type == "delete":
                        require_perm("delete")
                        obj = config.model.objects.get(pk=op.get("pk"))
                        object_repr, object_pk = str(obj), obj.pk
                        obj.delete()
                        audit.record(request, key, object_pk, "delete", object_repr=object_repr)
                        results.append({"op": "delete", "pk": object_pk})
                    else:
                        raise ValidationError({"operations": [f"Unsupported op: {op_type}"]})
            return Response({"results": results})

        action = request.data.get("action")
        ids = request.data.get("ids") or []
        if not ids:
            raise ValidationError({"ids": ["No target ids."]})
        qs = config.model.objects.filter(pk__in=ids)
        if action == "delete":
            require_perm("delete")
            count = qs.count()
            with transaction.atomic():
                qs.delete()
            audit.record(request, key, ",".join(str(i) for i in ids[:50]), "bulk_delete", object_repr=f"{count} deleted")
            return Response({"deleted": count})
        if action == "update":
            require_perm("change")
            data = request.data.get("data") or {}
            editable = {f.name for f in opts.get_fields() if isinstance(f, models.Field) and f.editable and not f.primary_key}
            invalid = [k for k in data.keys() if k not in editable]
            if invalid:
                raise ValidationError({"data": [f"Non-editable fields: {', '.join(invalid)}"]})
            with transaction.atomic():
                count = qs.update(**data)
            audit.record(request, key, ",".join(str(i) for i in ids[:50]), "bulk_update", object_repr=f"{count} updated", diff={k: [None, v] for k, v in data.items()})
            return Response({"updated": count})
        raise ValidationError({"action": ["Unsupported action (delete|update)."]})
