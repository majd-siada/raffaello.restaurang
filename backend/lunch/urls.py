from django.urls import path

from .views import LunchCurrentView, LunchImportStatusView

urlpatterns = [
    path('', LunchCurrentView.as_view(), name='lunch-current'),
    path('import-status/', LunchImportStatusView.as_view(), name='lunch-import-status'),
]
