import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import ChatMessage, Notification, EmergencyAlert
from django.contrib.auth import get_user_model

User = get_user_model()

class TranslationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = "translation_stream"
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def translation_update(self, event):
        await self.send(text_data=json.dumps(event['data']))


class EmergencyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        # Only Staff/Admins can join the central emergency alert group
        if self.user.is_authenticated and (self.user.role in ['ADMIN', 'EMERGENCY_STAFF']):
            self.room_name = "emergency_alerts"
            await self.channel_layer.group_add(self.room_name, self.channel_name)
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_name'):
            await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def emergency_alert(self, event):
        await self.send(text_data=json.dumps(event['data']))


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return

        # Room name is unique to the user-staff pair or a global staff channel
        self.room_name = f"chat_{self.user.id}"
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message')
        receiver_id = data.get('receiver_id')

        if not message or not receiver_id:
            return

        # Save message to DB
        saved_msg = await self.save_message(self.user.id, receiver_id, message)

        # Broadcast to receiver's group
        receiver_group = f"chat_{receiver_id}"
        await self.channel_layer.group_send(
            receiver_group,
            {
                "type": "chat_message",
                "message": message,
                "sender_id": str(self.user.id),
                "sender_name": self.user.username,
                "timestamp": saved_msg.timestamp.isoformat()
            }
        )
        
        # Also ACK to sender
        await self.send(text_data=json.dumps({
            "type": "chat_ack",
            "message": "Message sent",
            "timestamp": saved_msg.timestamp.isoformat()
        }))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, message):
        receiver = User.objects.get(id=receiver_id)
        sender = User.objects.get(id=sender_id)
        return ChatMessage.objects.create(sender=sender, receiver=receiver, message=message)


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return

        self.room_name = f"notify_{self.user.id}"
        # Staff also join a global group for emergency broadcast notifications
        if self.user.role in ['ADMIN', 'EMERGENCY_STAFF']:
            await self.channel_layer.group_add("notify_staff", self.channel_name)

        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_name, self.channel_name)
        if self.user.role in ['ADMIN', 'EMERGENCY_STAFF']:
            await self.channel_layer.group_discard("notify_staff", self.channel_name)

    async def send_notification(self, event):
        await self.send(text_data=json.dumps(event))
