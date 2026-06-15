from django.urls import include, path

urlpatterns = [
    path("conjure/", include("conjure.urls")),
]
