@echo off
REM Leo Photography Platform - Backend Optimization Setup Script (Windows)
REM This script sets up the optimized backend with security and caching

echo 🚀 Setting up Leo Photography Platform Backend with Optimizations...

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Generate security keys if not present
if not exist ".env" (
    echo 🔐 Setting up security configuration...
    (
        echo # Security Configuration
        echo SECURITY_SECRET_KEY=%RANDOM%%RANDOM%%RANDOM%
        echo JWT_SECRET_KEY=%RANDOM%%RANDOM%%RANDOM%
        echo ENCRYPTION_SALT=%RANDOM%%RANDOM%
        echo.
        echo # Environment
        echo ENVIRONMENT=development
        echo ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
        echo.
        echo # Cache Configuration ^(Optional - Redis^)
        echo # REDIS_URL=redis://localhost:6379
        echo.
        echo # Your existing environment variables
        echo # GOOGLE_SERVICE_ACCOUNT_BASE64=your-credentials-here
        echo # PHOTOS_FOLDER_ID=your-folder-id-here
        echo # SUPABASE_URL=your-supabase-url
        echo # SUPABASE_SERVICE_KEY=your-supabase-key
    ) > .env
    echo ⚠️  Please update .env file with your Google Drive and Supabase credentials
)

REM Create startup script
(
    echo @echo off
    echo echo 🚀 Starting Leo Photography Platform Backend...
    echo call venv\Scripts\activate.bat
    echo set PYTHONPATH=%%PYTHONPATH%%;%%cd%%
    echo uvicorn insight:app --host 0.0.0.0 --port 10001 --reload
) > start_backend.bat

REM Create production startup script
(
    echo @echo off
    echo echo 🚀 Starting Leo Photography Platform Backend ^(Production^)...
    echo call venv\Scripts\activate.bat
    echo set PYTHONPATH=%%PYTHONPATH%%;%%cd%%
    echo set ENVIRONMENT=production
    echo uvicorn insight:app --host 0.0.0.0 --port 10001 --workers 4
) > start_production.bat

echo ✅ Backend setup complete!
echo.
echo 📋 Next steps:
echo 1. Update .env file with your credentials
echo 2. Run: start_backend.bat ^(for development^)
echo 3. Run: start_production.bat ^(for production^)
echo.
echo 🔗 Backend will be available at: http://localhost:10001
echo 📊 Health check: http://localhost:10001/health
echo 📖 API docs: http://localhost:10001/docs

pause
