from django.urls import path

from .views import LunchCurrentView

urlpatterns = [
    path('', LunchCurrentView.as_view(), name='lunch-current'),
]
