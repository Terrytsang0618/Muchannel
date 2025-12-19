from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django_ckeditor_5.fields import CKEditor5Field


# Dynamic upload path functions
def category_image_path(instance, filename):
    """Upload path: categories/{category_slug}/{filename}"""
    return f'categories/{instance.slug}/{filename}'


def artist_profile_path(instance, filename):
    """Upload path: artists/{artist_slug}/profile/{filename}"""
    return f'artists/{instance.slug}/profile/{filename}'


def artist_banner_path(instance, filename):
    """Upload path: artists/{artist_slug}/banner/{filename}"""
    return f'artists/{instance.slug}/banner/{filename}'


def product_image_path(instance, filename):
    """Upload path: products/{artist_slug}/{filename} or products/no-artist/{filename}
    DEPRECATED: Kept for migration compatibility. Use ProductImage model instead."""
    if instance.artist:
        return f'products/{instance.artist.slug}/{filename}'
    return f'products/no-artist/{filename}'


def product_gallery_image_path(instance, filename):
    """Upload path for product gallery images: products/{artist_slug}/gallery/{filename}"""
    if instance.product.artist:
        return f'products/{instance.product.artist.slug}/gallery/{filename}'
    return f'products/no-artist/gallery/{filename}'


class Category(models.Model):
    """Product/NFT Category"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = CKEditor5Field(blank=True, config_name='default')
    icon = models.CharField(max_length=50, blank=True, help_text="Font Awesome icon class")

    # Hierarchy support
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories')

    # Display and organization
    display_order = models.IntegerField(default=0, help_text="Order to display categories")
    image = models.ImageField(upload_to=category_image_path, blank=True, null=True, help_text="Category banner/thumbnail image")
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['display_order', 'name']

    def __str__(self):
        return self.name

    @property
    def full_path(self):
        """Returns the full category path (e.g., 'MUSIC > CD & DVD')"""
        if self.parent:
            return f"{self.parent.full_path} > {self.name}"
        return self.name


class Artist(models.Model):
    """K-pop Artist/Group Model"""
    ARTIST_TYPES = [
        ('solo', 'Solo Artist'),
        ('group', 'Group'),
        ('band', 'Band'),
    ]

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    description = CKEditor5Field(config_name='default')
    profile_image = models.ImageField(upload_to=artist_profile_path, blank=True, null=True)
    banner_image = models.ImageField(upload_to=artist_banner_path, blank=True, null=True, help_text="Artist banner image")

    # Basic info
    artist_type = models.CharField(max_length=20, choices=ARTIST_TYPES, default='group')
    debut_date = models.DateField(null=True, blank=True)
    company = models.CharField(max_length=100, blank=True)
    member_count = models.IntegerField(null=True, blank=True, help_text="Number of members (for groups)")

    # Branding
    fandom_name = models.CharField(max_length=100, blank=True, help_text="Official fandom name")
    official_colors = models.CharField(max_length=100, blank=True, help_text="Official brand colors (hex codes)")

    # Social media
    instagram_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    youtube_url = models.URLField(blank=True)
    weverse_url = models.URLField(blank=True)
    official_website = models.URLField(blank=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    """K-pop Product Model (Albums, Merchandise, etc.)"""
    PRODUCT_TYPES = [
        ('album', 'Album'),
        ('photocard', 'Photocard'),
        ('lightstick', 'Lightstick'),
        ('clothing', 'Clothing'),
        ('poster', 'Poster'),
        ('seasongreeting', 'Season\'s Greeting'),
        ('dvd', 'DVD/Blu-ray'),
        ('kithno', 'KiT/Kihno'),
        ('other', 'Other Merchandise'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    description = CKEditor5Field(config_name='extends')
    product_type = models.CharField(max_length=20, choices=PRODUCT_TYPES, default='album')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    item_code = models.CharField(max_length=50, unique=True, help_text="SKU/Barcode")

    # Pricing
    original_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], help_text="Original price before discount")
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], help_text="Current selling price")

    # Product details
    stock = models.IntegerField(default=0, validators=[MinValueValidator(0)])

    # Status flags
    is_featured = models.BooleanField(default=False)
    is_trending = models.BooleanField(default=False)
    is_new = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    # Pre-order
    is_pre_order = models.BooleanField(default=False, help_text="Is this a pre-order item?")
    pre_order_start_date = models.DateTimeField(null=True, blank=True)
    pre_order_end_date = models.DateTimeField(null=True, blank=True)
    expected_ship_date = models.DateField(null=True, blank=True, help_text="Expected shipping date for pre-orders")

    # K-pop specific fields
    artist = models.ForeignKey(Artist, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    release_date = models.DateField(null=True, blank=True)
    label = models.CharField(max_length=100, blank=True, help_text="Record label/publisher")
    version = models.CharField(max_length=100, blank=True, help_text="Album version (e.g., Member Ver., Limited Ed.)")

    # Special features
    includes_random_item = models.BooleanField(default=False, help_text="Contains random photocard or item")
    random_options = models.CharField(max_length=200, blank=True, help_text="e.g., '1 of 5 random photocards'")
    bonus_items = models.TextField(blank=True, help_text="Bonus/gift items included (e.g., 'Unreleased photocard')")

    # Physical attributes (for shipping)
    weight_grams = models.IntegerField(null=True, blank=True, help_text="Product weight in grams")
    dimensions = models.CharField(max_length=100, blank=True, help_text="Dimensions (L x W x H in cm)")

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='products')

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_featured', 'is_active']),
            models.Index(fields=['is_trending', 'is_active']),
            models.Index(fields=['is_pre_order', 'is_active']),
            models.Index(fields=['artist', 'is_active']),
        ]

    def __str__(self):
        return self.title

    @property
    def in_stock(self):
        return self.stock > 0

    @property
    def is_on_sale(self):
        """Check if product is currently on sale"""
        return self.original_price > self.price

    @property
    def discount_percentage(self):
        """Calculate discount percentage"""
        if self.original_price > 0 and self.is_on_sale:
            return int(((self.original_price - self.price) / self.original_price) * 100)
        return 0


class ProductImage(models.Model):
    """Product Gallery Images - Multiple images per product"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to=product_gallery_image_path, help_text="Product image")
    alt_text = models.CharField(max_length=200, blank=True, help_text="Alternative text for accessibility")
    display_order = models.IntegerField(default=0, help_text="Order to display images (lower numbers first)")
    is_primary = models.BooleanField(default=False, help_text="Set as primary/main product image")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'created_at']
        verbose_name = "Product Image"
        verbose_name_plural = "Product Images"

    def __str__(self):
        return f"{self.product.title} - Image {self.display_order}"

    def save(self, *args, **kwargs):
        """If this is set as primary, remove primary flag from other images"""
        if self.is_primary:
            # Remove primary flag from all other images for this product
            ProductImage.objects.filter(product=self.product, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)


class Review(models.Model):
    """Product Review"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['product', 'user']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.product.title} ({self.rating}★)"
