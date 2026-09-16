from django.urls import path

from .views import OffersWindowView

urlpatterns = [
    path('', OffersWindowView.as_view(), name='offers-window'),
]
