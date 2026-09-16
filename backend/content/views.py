"""Public FAQ/Legal.

FAQ: published FaqItem rows are always the public CMS source (authorized restaurant FAQ).
Legal: gated by TRUST_CONTENT_SOURCE — keep frontend until approved policy bodies exist.
"""

from django.conf import settings
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FaqItem, LegalPage
from .serializers import PublicFaqSerializer, PublicLegalSerializer


def trust_content_source():
    raw = getattr(settings, 'TRUST_CONTENT_SOURCE', 'frontend') or 'frontend'
    return raw if raw in ('frontend', 'db') else 'frontend'


class FaqListView(APIView):
    """
    Public FAQ list — published FaqItem only.
    Empty when nothing is published (FE shows honest empty / noindex).
    Independent of TRUST_CONTENT_SOURCE so legal can stay on frontend fallback.
    """

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        qs = FaqItem.objects.filter(is_published=True).order_by('order', 'id')
        return Response(PublicFaqSerializer(qs, many=True).data)


class LegalPageDetailView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, key):
        source = trust_content_source()
        if source != 'db':
            return Response({'detail': 'Not found.', 'source': 'frontend'}, status=404)
        page = LegalPage.objects.filter(key=key, is_published=True).first()
        if not page or not page.paragraphs():
            return Response({'detail': 'Not found.', 'source': 'db'}, status=404)
        data = PublicLegalSerializer(page).data
        data['source'] = 'db'
        return Response(data)
