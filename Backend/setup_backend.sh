#!/bin/bash

# Leo Photography Platform - Backend Optimization Setup Script
# This script sets up the optimized backend with security and caching

echo "🚀 Setting up Leo Photography Platform Backend with Optimizations..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Generate security keys if not present
if [ ! -f ".env" ]; then
    echo "🔐 Setting up security configuration..."
    cat > .env << EOL
# Security Configuration
SECURITY_SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
JWT_SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
ENCRYPTION_SALT=$(python -c "import secrets; print(secrets.token_hex(16))")

# Environment
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Cache Configuration (Optional - Redis)
# REDIS_URL=redis://localhost:6379

# Your existing environment variables
# GOOGLE_SERVICE_ACCOUNT_BASE64=your-credentials-here
# PHOTOS_FOLDER_ID=your-folder-id-here
# SUPABASE_URL=your-supabase-url
# SUPABASE_SERVICE_KEY=your-supabase-key
EOL
    echo "⚠️  Please update .env file with your Google Drive and Supabase credentials"
fi

# Create startup script
cat > start_backend.sh << 'EOL'
#!/bin/bash
echo "🚀 Starting Leo Photography Platform Backend..."
source venv/bin/activate
export PYTHONPATH=$PYTHONPATH:$(pwd)
uvicorn insight:app --host 0.0.0.0 --port 10001 --reload
EOL

chmod +x start_backend.sh

# Create production startup script
cat > start_production.sh << 'EOL'
#!/bin/bash
echo "🚀 Starting Leo Photography Platform Backend (Production)..."
source venv/bin/activate
export PYTHONPATH=$PYTHONPATH:$(pwd)
export ENVIRONMENT=production
uvicorn insight:app --host 0.0.0.0 --port 10001 --workers 4
EOL

chmod +x start_production.sh

echo "✅ Backend setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your credentials"
echo "2. Run: ./start_backend.sh (for development)"
echo "3. Run: ./start_production.sh (for production)"
echo ""
echo "🔗 Backend will be available at: http://localhost:10001"
echo "📊 Health check: http://localhost:10001/health"
echo "📖 API docs: http://localhost:10001/docs"
