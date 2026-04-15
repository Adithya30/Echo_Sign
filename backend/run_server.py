"""
EchoSign Server Runner
Run this file with: python run_server.py
It handles setup, migration, and server startup.
"""
import sys
import os

# Add backend to path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BACKEND_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'echosign.settings')

import django
django.setup()

from django.core.management import call_command

print("[*] Running database migrations...")
call_command('makemigrations')
call_command('migrate')
print("[+] Migrations done!")

print("[*] Pre-loading AI models to prevent first-request latency...")
try:
    from translator.views import get_gesture_recognizer
    get_gesture_recognizer()
    print("[+] Models loaded successfully!")
except Exception as e:
    print(f"[-] Model pre-loading failed (will retry on first request): {e}")

print("\n[>] Starting Django server at http://127.0.0.1:8000 ...")
print("[>] API base URL: http://127.0.0.1:8000/api/")
print("[>] Admin panel: http://127.0.0.1:8000/admin/\n")

call_command('runserver', '0.0.0.0:8000')
