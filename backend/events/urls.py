from django.urls import path

from .views import EventInquiryCreateView

urlpatterns = [
    path('', EventInquiryCreateView.as_view(), name='event-inquiry-create'),
]
