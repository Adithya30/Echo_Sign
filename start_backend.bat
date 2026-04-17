@echo off
cd /d "%~dp0backend"
if not exist "venv" (
    echo ❌ Virtual environment not found. Please create it manually or run set_up_env.bat.
    pause
    exit /b
)
echo 🚀 Activating EchoSign Venv...
call venv\Scripts\activate
echo 🚀 Starting EchoSign Django Backend...
python run_server.py
pause
