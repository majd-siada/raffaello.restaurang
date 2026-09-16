from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from bookings.models import Booking
from content.models import FaqItem, LegalPage
from events.models import EventInquiry
from gallery.models import GalleryPhoto
from lunch.models import LunchDish, LunchImportRun, LunchWeek
from menu.models import Category, MenuItem
from offers.models import OfferDish, WeeklyOffer
from reviews.models import CuratedReview


def _join_csv(value):
    if value is None:
        return ''
    if isinstance(value, list):
        return ','.join(str(v).strip() for v in value if str(v).strip())
    return str(value).strip()


class OpsCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'parent', 'description', 'order']


class OpsMenuItemSerializer(serializers.ModelSerializer):
    allergens = serializers.CharField(required=False, allow_blank=True)
    tags = serializers.CharField(required=False, allow_blank=True)
    image_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            'id',
            'category',
            'name',
            'description',
            'price',
            'is_available',
            'order',
            'allergens',
            'tags',
            'image',
            'image_url',
            'is_featured',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'image_url']
        extra_kwargs = {'image': {'required': False, 'allow_null': True}}

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        url = obj.image.url
        if request:
            return request.build_absolute_uri(url)
        return url

    def to_internal_value(self, data):
        # Accept list allergens/tags from JSON clients
        mutable = data
        if hasattr(data, 'copy'):
            mutable = data.copy()
        if isinstance(mutable, dict):
            if isinstance(mutable.get('allergens'), list):
                mutable['allergens'] = _join_csv(mutable['allergens'])
            if isinstance(mutable.get('tags'), list):
                mutable['tags'] = _join_csv(mutable['tags'])
        return super().to_internal_value(mutable)


class OpsLunchDishSerializer(serializers.ModelSerializer):
    class Meta:
        model = LunchDish
        fields = [
            'id',
            'lunch_week',
            'weekday',
            'name',
            'description',
            'price',
            'is_available',
            'order',
        ]
        read_only_fields = ['lunch_week']


class OpsLunchWeekSerializer(serializers.ModelSerializer):
    dishes = OpsLunchDishSerializer(many=True, read_only=True)
    manual_override = serializers.BooleanField(read_only=True)

    class Meta:
        model = LunchWeek
        fields = [
            'id',
            'week_start',
            'year',
            'week_number',
            'intro_text',
            'notes',
            'lunch_hours_text',
            'is_published',
            'skip_auto_sync',
            'manual_override',
            'source_type',
            'source_url',
            'source_hash',
            'fetched_at',
            'published_at',
            'source_last_updated',
            'parser_version',
            'last_import_status',
            'dishes',
        ]
        read_only_fields = [
            'year',
            'week_number',
            'source_type',
            'source_url',
            'source_hash',
            'fetched_at',
            'published_at',
            'source_last_updated',
            'parser_version',
            'last_import_status',
            'manual_override',
        ]


class OpsLunchImportRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = LunchImportRun
        fields = [
            'id',
            'started_at',
            'finished_at',
            'status',
            'source_url',
            'source_hash',
            'parser_version',
            'service_date',
            'year',
            'week_number',
            'item_count',
            'changed',
            'message',
        ]


class OpsOfferDishSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfferDish
        fields = [
            'id',
            'offer',
            'name',
            'description',
            'price',
            'is_available',
            'order',
        ]


class OpsWeeklyOfferSerializer(serializers.ModelSerializer):
    dishes = OpsOfferDishSerializer(many=True, read_only=True)

    class Meta:
        model = WeeklyOffer
        fields = [
            'id',
            'week_start',
            'year',
            'week_number',
            'intro_text',
            'is_published',
            'dishes',
        ]
        read_only_fields = ['year', 'week_number']


class OpsBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            'id',
            'first_name',
            'last_name',
            'phone',
            'email',
            'date',
            'time',
            'guests',
            'message',
            'whatsapp_sent',
            'is_test',
            'created_at',
        ]


class OpsEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventInquiry
        fields = [
            'id',
            'first_name',
            'last_name',
            'phone',
            'email',
            'preferred_date',
            'guests',
            'occasion',
            'message',
            'notify_sent',
            'created_at',
        ]


class OpsGallerySerializer(serializers.ModelSerializer):
    src = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = GalleryPhoto
        fields = ['id', 'image', 'src', 'alt_text', 'order', 'is_published']
        extra_kwargs = {'image': {'required': False}}

    def get_src(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        url = obj.image.url
        if request:
            return request.build_absolute_uri(url)
        return url

    def create(self, validated_data):
        instance = GalleryPhoto(**validated_data)
        try:
            instance.full_clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict or exc.messages) from exc
        instance.save()
        return instance

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        try:
            instance.full_clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict or exc.messages) from exc
        instance.save()
        return instance


class OpsReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuratedReview
        fields = [
            'id',
            'quote',
            'author_name',
            'source',
            'rating',
            'is_published',
            'order',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        instance = CuratedReview(**validated_data)
        try:
            instance.full_clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict or exc.messages) from exc
        instance.save()
        return instance

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        try:
            instance.full_clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict or exc.messages) from exc
        instance.save()
        return instance


class OpsFaqSerializer(serializers.ModelSerializer):
    class Meta:
        model = FaqItem
        fields = [
            'id',
            'question',
            'answer',
            'order',
            'is_published',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        instance = FaqItem(**validated_data)
        try:
            instance.full_clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict or exc.messages) from exc
        instance.save()
        return instance

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        try:
            instance.full_clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict or exc.messages) from exc
        instance.save()
        return instance


class OpsLegalSerializer(serializers.ModelSerializer):
    paragraphs = serializers.SerializerMethodField(read_only=True)
    canonical = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = LegalPage
        fields = [
            'id',
            'key',
            'title',
            'description',
            'body',
            'paragraphs',
            'canonical',
            'is_published',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'paragraphs', 'canonical']

    def get_paragraphs(self, obj):
        return obj.paragraphs()

    def get_canonical(self, obj):
        return obj.canonical

    def create(self, validated_data):
        instance = LegalPage(**validated_data)
        try:
            instance.full_clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict or exc.messages) from exc
        instance.save()
        return instance

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        try:
            instance.full_clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict or exc.messages) from exc
        instance.save()
        return instance
