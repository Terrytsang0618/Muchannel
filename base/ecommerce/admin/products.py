from django.contrib import admin
from django.utils.html import format_html
from django import forms
from ecommerce.models import Category, Product, ProductImage, Artist, Review


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    class Media:
        css = {
            'all': ('css/ckeditor5-custom.css',)
        }
    list_display = ['name', 'parent', 'image_thumbnail', 'display_order', 'is_active', 'created_at']
    list_filter = ['is_active', 'parent']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name', 'description']
    list_editable = ['display_order', 'is_active']
    ordering = ['display_order', 'name']

    def image_thumbnail(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="50" height="50" style="object-fit: cover;" />', obj.image.url)
        return "No Image"
    image_thumbnail.short_description = 'Image'


@admin.register(Artist)
class ArtistAdmin(admin.ModelAdmin):
    class Media:
        css = {
            'all': ('css/ckeditor5-custom.css',)
        }
    list_display = ['name', 'profile_thumbnail', 'artist_type', 'company', 'debut_date', 'member_count', 'is_active', 'created_at']
    list_filter = ['is_active', 'artist_type', 'company']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name', 'company', 'fandom_name']
    list_editable = ['is_active']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'artist_type', 'company', 'member_count', 'debut_date')
        }),
        ('Images', {
            'fields': ('profile_image', 'banner_image')
        }),
        ('Branding', {
            'fields': ('fandom_name', 'official_colors')
        }),
        ('Social Media', {
            'fields': ('instagram_url', 'twitter_url', 'youtube_url', 'weverse_url', 'official_website'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )

    def profile_thumbnail(self, obj):
        if obj.profile_image:
            return format_html('<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 50%;" />', obj.profile_image.url)
        return "No Image"
    profile_thumbnail.short_description = 'Profile'


class ProductImageInline(admin.TabularInline):
    """Inline admin for Product Images - allows adding multiple images on product edit page"""
    model = ProductImage
    extra = 1  # Show 1 empty form by default
    fields = ['image_preview', 'image', 'alt_text', 'display_order', 'is_primary']
    readonly_fields = ['image_preview']
    ordering = ['display_order']

    def image_preview(self, obj):
        """Show image preview in the inline"""
        if obj.image:
            return format_html(
                '<img src="{}" width="80" height="80" style="object-fit: cover; border-radius: 4px;" />',
                obj.image.url
            )
        return "No Image"
    image_preview.short_description = 'Preview'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    class Media:
        css = {
            'all': ('css/ckeditor5-custom.css',)
        }

    inlines = [ProductImageInline]  # Add inline image editor

    list_display = ['image_thumbnail', 'title', 'artist', 'product_type', 'category', 'price', 'original_price', 'stock', 'is_pre_order', 'is_featured', 'is_active', 'created_at']
    list_filter = ['product_type', 'is_featured', 'is_trending', 'is_new', 'is_pre_order', 'is_active', 'category', 'artist']
    search_fields = ['title', 'description', 'item_code', 'artist__name']
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ['is_featured', 'is_active']
    date_hierarchy = 'created_at'
    autocomplete_fields = ['artist', 'category']
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'description', 'product_type', 'category', 'item_code')
        }),
        ('Pricing', {
            'fields': ('original_price', 'price')
        }),
        ('Product Details', {
            'fields': ('stock', 'artist', 'release_date', 'label', 'version'),
            'description': 'Note: Use the "Product Images" section below to add multiple images. Mark one as primary for thumbnails.'
        }),
        ('Status Flags', {
            'fields': ('is_featured', 'is_trending', 'is_new', 'is_active')
        }),
        ('Pre-order Information', {
            'fields': ('is_pre_order', 'pre_order_start_date', 'pre_order_end_date', 'expected_ship_date'),
            'classes': ('collapse',)
        }),
        ('Special Features', {
            'fields': ('includes_random_item', 'random_options', 'bonus_items'),
            'classes': ('collapse',)
        }),
        ('Physical Attributes', {
            'fields': ('weight_grams', 'dimensions'),
            'classes': ('collapse',)
        }),
    )

    def image_thumbnail(self, obj):
        """Show primary image from gallery"""
        # Get primary image from gallery
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return format_html('<img src="{}" width="50" height="50" style="object-fit: cover;" />', primary_image.image.url)
        # If no primary, show first image
        first_image = obj.images.first()
        if first_image:
            return format_html('<img src="{}" width="50" height="50" style="object-fit: cover;" />', first_image.image.url)
        return "No Image"
    image_thumbnail.short_description = 'Image'


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['user', 'product', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['user__username', 'product__title', 'comment']
    autocomplete_fields = ['product', 'user']
    readonly_fields = ['created_at', 'updated_at']
