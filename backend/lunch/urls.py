from django.urls import path

from .views import LunchWindowView

urlpatterns = [
    path('', LunchWindowView.as_view(), name='lunch-window'),
]
