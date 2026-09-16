from django.urls import path

from .views import FaqListView, LegalPageDetailView

urlpatterns = [
    path('faq/', FaqListView.as_view(), name='faq-list'),
    path('legal/<slug:key>/', LegalPageDetailView.as_view(), name='legal-detail'),
]
