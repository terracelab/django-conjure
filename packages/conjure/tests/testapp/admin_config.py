from conjure import AdminConfig, register
from tests.testapp.models import ActivityLog, Category, Product, ProductImage


@register(Category)
class CategoryConfig(AdminConfig):
    list_display = ["id", "name", "display_name", "order"]
    search_fields = ["name", "display_name"]


@register(Product)
class ProductConfig(AdminConfig):
    list_display = ["id", "name", "price", "category", "is_active"]
    search_fields = ["name"]
    list_filter = ["is_active", "category"]
    inlines = [(ProductImage, "product")]


@register(ProductImage)
class ProductImageConfig(AdminConfig):
    pass


@register(ActivityLog)
class ActivityLogConfig(AdminConfig):
    is_readonly = True
