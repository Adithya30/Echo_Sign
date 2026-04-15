from django.db import models
from django.conf import settings
import uuid


class TranslationHistory(models.Model):
    """Stores every recognized gesture/sign translation."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='translations')
    session_id = models.CharField(max_length=100, blank=True)
    word = models.CharField(max_length=200)
    confidence = models.FloatField(default=0.0)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_emergency = models.BooleanField(default=False)
    audio_generated = models.BooleanField(default=False)
    whatsapp_sent = models.BooleanField(default=False)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Translation History'
        verbose_name_plural = 'Translation Histories'

    def __str__(self):
        return f"{self.word} ({self.confidence:.1%}) - {self.timestamp:%Y-%m-%d %H:%M}"


class EmergencyAlert(models.Model):
    """Logs emergency events triggered by emergency sign words."""
    ALERT_TYPES = [
        ('HELP', 'Help Required'),
        ('DOCTOR', 'Doctor Needed'),
        ('EMERGENCY', 'Emergency'),
        ('DANGER', 'Danger'),
        ('POLICE', 'Police'),
        ('FIRE', 'Fire'),
        ('AMBULANCE', 'Ambulance'),
        ('OTHER', 'Other'),
    ]

    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('ACKNOWLEDGED', 'Acknowledged'),
        ('RESOLVED', 'Resolved'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='emergency_alerts')
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES, default='OTHER')
    message = models.TextField()
    confidence = models.FloatField(default=0.0)
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    whatsapp_sent = models.BooleanField(default=False)
    acknowledged_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Emergency Alert'
        verbose_name_plural = 'Emergency Alerts'

    def __str__(self):
        return f"[{self.alert_type}] {self.message[:50]} - {self.timestamp:%Y-%m-%d %H:%M}"


class WhatsAppContact(models.Model):
    """WhatsApp contacts for sending translation messages."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='contacts')
    name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20, help_text="Include country code e.g. +919876543210")
    is_active = models.BooleanField(default=True)
    is_emergency_contact = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    last_messaged = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'WhatsApp Contact'
        verbose_name_plural = 'WhatsApp Contacts'

    def __str__(self):
        return f"{self.name} ({self.phone_number})"


class UserSession(models.Model):
    """Tracks translator usage sessions."""
    session_id = models.CharField(max_length=100, unique=True)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    total_translations = models.IntegerField(default=0)
    emergency_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['-start_time']

    def __str__(self):
        return f"Session {self.session_id} - {self.start_time:%Y-%m-%d %H:%M}"


class ChatMessage(models.Model):
    """Real-time chat messages between users and staff."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_messages')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"From {self.sender.username} to {self.receiver.username}"


class Notification(models.Model):
    """System notifications for users and staff."""
    TYPES = [
        ('ALERT', 'Emergency Alert'),
        ('INFO', 'Information'),
        ('SYSTEM', 'System Message'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPES, default='INFO')
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.title} for {self.user.username}"


class ContactMessage(models.Model):
    """Messages from the contact/support form."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Message from {self.name} - {self.email}"
