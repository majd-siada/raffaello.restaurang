from rest_framework import serializers

from .models import GalleryPhoto


class GalleryPhotoSerializer(serializers.ModelSerializer):
    src = serializers.SerializerMethodField()
    alt = serializers.CharField(source='alt_text', allow_blank=True)

    class Meta:
        model = GalleryPhoto
        fields = ['id', 'src', 'alt', 'order']

    def get_src(self, obj):
        if not obj.image:
            return ''
        return obj.image.url
