from django.urls import path
from ecommerce.views.views import HomeView, ProductsListView

urlpatterns = [
    path('', HomeView.as_view(), name='home'),
    path('products/', ProductsListView.as_view(), name='products_list'),
]
