from rest_framework import serializers

from .models import FaqItem, LegalPage


class PublicFaqSerializer(serializers.ModelSerializer):
    class Meta:
        model = FaqItem
        fields = ['id', 'question', 'answer', 'order']


class PublicLegalSerializer(serializers.ModelSerializer):
    paragraphs = serializers.SerializerMethodField()
    canonical = serializers.SerializerMethodField()

    class Meta:
        model = LegalPage
        fields = [
            'key',
            'title',
            'description',
            'paragraphs',
            'canonical',
            'updated_at',
        ]

    def get_paragraphs(self, obj):
        return obj.paragraphs()

    def get_canonical(self, obj):
        return obj.canonical
