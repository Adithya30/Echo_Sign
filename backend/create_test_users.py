import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'echosign.settings')
django.setup()

from users.models import CustomUser

def create_user(username, password, role, email):
    if not CustomUser.objects.filter(username=username).exists():
        user = CustomUser.objects.create_user(
            username=username,
            password=password,
            email=email,
            role=role,
            is_staff=(role == 'ADMIN'),
            is_superuser=(role == 'ADMIN')
        )
        print(f"[+] Created {role}: {username}")
    else:
        print(f"[!] {username} already exists")

# Create the 3 roles
create_user('admin', 'admin123', 'ADMIN', 'admin@echosign.com')
create_user('staff', 'staff123', 'EMERGENCY_STAFF', 'staff@echosign.com')
create_user('user', 'user123', 'USER', 'user@echosign.com')

print("\n[✓] User initialization complete.")
