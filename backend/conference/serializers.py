"""
Serializers for the Conference Management System API.
"""
import json
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import serializers
from .models import (
    Venue, TechnicalService, SupportService, Booking, 
    SystemUser, UserRoleChoices, TaskAllocation, 
    MaintenanceUpdate, EmailTemplate, BookingStatus, AuditLog,
    SystemSettings, Notification
)

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.system_profile.name', read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'

class DailySchedulesField(serializers.JSONField):
    def to_internal_value(self, data):
        if isinstance(data, str):
            try: 
                data = json.loads(data)
            except: 
                raise serializers.ValidationError('Invalid JSON.')
        return super().to_internal_value(data)

class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    role = serializers.ChoiceField(choices=UserRoleChoices.choices, default='organizer')

    def validate_email(self, value):
        if User.objects.filter(username=value).exists(): 
            raise serializers.ValidationError('Email exists.')
        return value.lower().strip()

    @transaction.atomic
    def create(self, validated_data):
        email = validated_data['email']
        name = validated_data['name']
        password = validated_data['password']
        
        name_parts = name.split(' ')
        first_name = name_parts[0]
        last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
        
        django_user = User.objects.create_user(
            username=email, email=email, password=password, 
            first_name=first_name, last_name=last_name
        )
        return SystemUser.objects.create(
            user=django_user, name=name, email=email, 
            role=validated_data.get('role', 'organizer')
        )

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class SystemUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, required=False)
    has_login = serializers.SerializerMethodField()

    class Meta: 
        model = SystemUser
        fields = ['id', 'name', 'email', 'role', 'created_at', 'password', 'has_login']
        read_only_fields = ['id', 'created_at', 'has_login']

    def get_has_login(self, obj): 
        return obj.user_id is not None

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        name = validated_data.get('name', '')
        email = validated_data.get('email', '')
        
        django_user = None
        if password:
            name_parts = name.split(' ')
            first_name = name_parts[0]
            last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
            
            django_user = User.objects.create_user(
                username=email, 
                email=email, 
                password=password, 
                first_name=first_name,
                last_name=last_name
            )
        validated_data['user'] = django_user
        return SystemUser.objects.create(**validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        new_email = validated_data.get('email', instance.email)
        new_name = validated_data.get('name', instance.name)
        
        # Update SystemUser instance
        for attr, value in validated_data.items(): 
            setattr(instance, attr, value)
        instance.save()
        
        # Sync with Django User if linked
        if instance.user:
            try:
                instance.user.username = new_email
                instance.user.email = new_email
                
                # Sync Name components
                if 'name' in validated_data:
                    name_parts = new_name.split(' ')
                    instance.user.first_name = name_parts[0]
                    instance.user.last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
                
                if password: 
                    instance.user.set_password(password)
                
                instance.user.save()
            except Exception as e:
                # If username is already taken, this might throw IntegrityError
                raise serializers.ValidationError({'error': f"Failed to update linked login account: {str(e)}"})
                
        return instance

class VenueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venue
        fields = '__all__'

    def to_internal_value(self, data):
        if hasattr(data, 'dict'):
            data_dict = data.dict()
        else:
            data_dict = data.copy() if hasattr(data, 'copy') else dict(data)
            
        included = data_dict.get('included_services')
        
        if isinstance(included, str) and included.strip():
            try:
                data_dict['included_services'] = json.loads(included)
            except json.JSONDecodeError:
                data_dict['included_services'] = []
        elif not included:
            data_dict['included_services'] = []
            
        return super().to_internal_value(data_dict)

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['cleaning_exceptions'] = {
            str(m.date): {'start': str(m.start_time)[:5], 'end': str(m.end_time)[:5]} 
            for m in instance.maintenance_updates.all()
        }
        return rep

    def update(self, instance, validated_data):
        exceptions = validated_data.pop('cleaning_exceptions', None)
        instance = super().update(instance, validated_data)
        if exceptions is not None:
            MaintenanceUpdate.objects.filter(venue=instance).delete()
            for date_str, times in exceptions.items():
                MaintenanceUpdate.objects.create(
                    venue=instance, date=date_str, 
                    start_time=times['start'], end_time=times['end']
                )
        return instance

class TechnicalServiceSerializer(serializers.ModelSerializer):
    class Meta: 
        model = TechnicalService
        fields = '__all__'

class SupportServiceSerializer(serializers.ModelSerializer):
    class Meta: 
        model = SupportService
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    venue_capacity = serializers.IntegerField(source='venue.capacity', read_only=True)
    booked_by_name = serializers.SerializerMethodField()
    management_approved_by_name = serializers.CharField(source='management_approved_by.system_profile.name', read_only=True)
    daily_schedules = DailySchedulesField(required=False, default=list)
    
    assigned_tech = serializers.JSONField(required=False, write_only=True)
    technical_services = serializers.PrimaryKeyRelatedField(many=True, queryset=TechnicalService.objects.all(), required=False)
    support_services = serializers.PrimaryKeyRelatedField(many=True, queryset=SupportService.objects.all(), required=False)
    unavailable_technical_services = serializers.PrimaryKeyRelatedField(many=True, queryset=TechnicalService.objects.all(), required=False)
    unavailable_support_services = serializers.PrimaryKeyRelatedField(many=True, queryset=SupportService.objects.all(), required=False)

    class Meta:
        model = Booking
        fields = '__all__'

    def get_booked_by_name(self, obj):
        try: 
            return obj.user.system_profile.name if obj.user else None
        except: 
            return None

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['assigned_tech'] = {str(alloc.date): str(alloc.staff_id) for alloc in instance.allocations.all()}
        return rep

    def update(self, instance, validated_data):
        tech = validated_data.pop('technical_services', None)
        supp = validated_data.pop('support_services', None)
        unavailable_tech = validated_data.pop('unavailable_technical_services', None)
        unavailable_supp = validated_data.pop('unavailable_support_services', None)
        assigned_tech = validated_data.pop('assigned_tech', None)
        
        for attr, value in validated_data.items(): 
            setattr(instance, attr, value)
        instance.save()
        
        if tech is not None: instance.technical_services.set(tech)
        if supp is not None: instance.support_services.set(supp)
        if unavailable_tech is not None: instance.unavailable_technical_services.set(unavailable_tech)
        if unavailable_supp is not None: instance.unavailable_support_services.set(unavailable_supp)
        
        if assigned_tech is not None:
            TaskAllocation.objects.filter(booking=instance).delete()
            for date_str, staff_id in assigned_tech.items():
                if staff_id: 
                    TaskAllocation.objects.create(booking=instance, date=date_str, staff_id=staff_id)
        return instance

# =======================================================
# FIXED: Syncing Status choices with the Model
# =======================================================
class BookingStatusSerializer(serializers.Serializer):
    # Using BookingStatus.values ensures 'partial_paid' and 'pending' are allowed!
    status = serializers.ChoiceField(choices=BookingStatus.choices)
    rejection_reason = serializers.CharField(required=False, allow_blank=True, default='')

class TaskAllocationSerializer(serializers.ModelSerializer):
    class Meta: 
        model = TaskAllocation
        fields = '__all__'

class MaintenanceUpdateSerializer(serializers.ModelSerializer):
    class Meta: 
        model = MaintenanceUpdate
        fields = '__all__'

class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = '__all__'

class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = '__all__'