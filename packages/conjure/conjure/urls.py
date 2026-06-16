"""
URL contract — 1:1 with the frontend (packages/web/src/lib/api.ts). Do not change shapes.
Mount anywhere, e.g. ``path("conjure/", include("conjure.urls"))``.
"""

from django.urls import path

from conjure.auth import LoginView, LogoutView, MeView, RefreshView
from conjure.schema import SchemaDetailView, SchemaListView
from conjure.viewsets import AdminModelViewSet
from conjure.widgets import WidgetView

app_name = "conjure"

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", RefreshView.as_view(), name="refresh"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("schema/", SchemaListView.as_view(), name="schema-list"),
    path("schema/<str:model_key>/", SchemaDetailView.as_view(), name="schema-detail"),
    path("widgets/<str:name>/", WidgetView.as_view(), name="widget"),
    # Declare autocomplete/bulk before <str:pk> so they match first. pk is str for UUID-pk models.
    path("r/<str:model_key>/autocomplete/", AdminModelViewSet.as_view({"get": "autocomplete"}), name="autocomplete"),
    path("r/<str:model_key>/bulk/", AdminModelViewSet.as_view({"post": "bulk"}), name="bulk"),
    path("r/<str:model_key>/<str:pk>/related/", AdminModelViewSet.as_view({"get": "related"}), name="related"),
    path(
        "r/<str:model_key>/<str:pk>/",
        AdminModelViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="detail",
    ),
    path("r/<str:model_key>/", AdminModelViewSet.as_view({"get": "list", "post": "create"}), name="list"),
]
