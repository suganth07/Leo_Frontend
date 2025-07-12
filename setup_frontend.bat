@echo off
REM Leo Photography Platform - Frontend Optimization Setup Script (Windows)
REM This script sets up the optimized frontend with performance enhancements

echo 🚀 Setting up Leo Photography Platform Frontend with Optimizations...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Install dependencies
echo 📥 Installing dependencies...
npm install

REM Create environment file if it doesn't exist
if not exist ".env.local" (
    echo 🔧 Setting up environment configuration...
    (
        echo # API Configuration
        echo NEXT_PUBLIC_BACKEND_URL=http://localhost:10001
        echo NEXT_PUBLIC_ENVIRONMENT=development
        echo.
        echo # Performance
        echo NEXT_PUBLIC_CACHE_TTL=300000
        echo NEXT_PUBLIC_IMAGE_QUALITY=75
        echo.
        echo # Your existing environment variables
        echo # NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
        echo # NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
        echo # NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
        echo # NEXT_PUBLIC_PHOTOS_FOLDER_ID=your-photos-folder-id
    ) > .env.local
    echo ⚠️  Please update .env.local file with your configuration
)

REM Build the application
echo 🔨 Building optimized application...
npm run build

REM Create startup scripts
(
    echo @echo off
    echo echo 🚀 Starting Leo Photography Platform Frontend ^(Development^)...
    echo npm run dev
) > start_dev.bat

(
    echo @echo off
    echo echo 🚀 Starting Leo Photography Platform Frontend ^(Production^)...
    echo npm start
) > start_production.bat

REM Create optimization script
(
    echo @echo off
    echo echo ⚡ Running performance optimizations...
    echo.
    echo REM Clear Next.js cache
    echo if exist ".next\cache" rmdir /s /q ".next\cache"
    echo.
    echo REM Rebuild with optimizations
    echo npm run build
    echo.
    echo echo ✅ Performance optimization complete!
    echo pause
) > optimize_performance.bat

echo ✅ Frontend setup complete!
echo.
echo 📋 Next steps:
echo 1. Update .env.local file with your configuration
echo 2. Run: start_dev.bat ^(for development^)
echo 3. Run: start_production.bat ^(for production^)
echo 4. Run: optimize_performance.bat ^(for performance analysis^)
echo.
echo 🔗 Frontend will be available at: http://localhost:3000
echo 📊 Performance monitor: Available in the app ^(bottom-right^)
echo.
echo 🎯 Performance Features Enabled:
echo   • Multi-layer caching
echo   • Optimized images with lazy loading
echo   • Code splitting and tree shaking
echo   • Progressive web app features
echo   • Real-time performance monitoring

pause
