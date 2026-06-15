from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=50)
    display_name = models.CharField(max_length=50)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.display_name


class Product(models.Model):
    name = models.CharField(max_length=120)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="products")
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    caption = models.CharField(max_length=120, blank=True, default="")
    order = models.IntegerField(default=0)

    def __str__(self):
        return self.caption or f"image #{self.pk}"


class ActivityLog(models.Model):
    LEVELS = [("info", "info"), ("warn", "warn"), ("error", "error")]

    message = models.CharField(max_length=200)
    level = models.CharField(max_length=10, choices=LEVELS, default="info")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.message
