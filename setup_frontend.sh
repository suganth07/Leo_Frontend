#!/bin/bash

# Leo Photography Platform - Frontend Optimization Setup Script
# This script sets up the optimized frontend with performance enhancements

echo "🚀 Setting up Leo Photography Platform Frontend with Optimizations..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "🔧 Setting up environment configuration..."
    cat > .env.local << EOL
# API Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:10001
NEXT_PUBLIC_ENVIRONMENT=development

# Performance
NEXT_PUBLIC_CACHE_TTL=300000
NEXT_PUBLIC_IMAGE_QUALITY=75

# Your existing environment variables
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
# NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
# NEXT_PUBLIC_PHOTOS_FOLDER_ID=your-photos-folder-id
EOL
    echo "⚠️  Please update .env.local file with your configuration"
fi

# Build the application
echo "🔨 Building optimized application..."
npm run build

# Create startup scripts
cat > start_dev.sh << 'EOL'
#!/bin/bash
echo "🚀 Starting Leo Photography Platform Frontend (Development)..."
npm run dev
EOL

cat > start_production.sh << 'EOL'
#!/bin/bash
echo "🚀 Starting Leo Photography Platform Frontend (Production)..."
npm start
EOL

chmod +x start_dev.sh start_production.sh

# Create optimization script
cat > optimize_performance.sh << 'EOL'
#!/bin/bash
echo "⚡ Running performance optimizations..."

# Clear Next.js cache
rm -rf .next/cache

# Rebuild with optimizations
npm run build

# Analyze bundle
npm run build -- --analyze

echo "✅ Performance optimization complete!"
EOL

chmod +x optimize_performance.sh

echo "✅ Frontend setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env.local file with your configuration"
echo "2. Run: ./start_dev.sh (for development)"
echo "3. Run: ./start_production.sh (for production)"
echo "4. Run: ./optimize_performance.sh (for performance analysis)"
echo ""
echo "🔗 Frontend will be available at: http://localhost:3000"
echo "📊 Performance monitor: Available in the app (bottom-right)"
echo ""
echo "🎯 Performance Features Enabled:"
echo "  • Multi-layer caching"
echo "  • Optimized images with lazy loading"
echo "  • Code splitting and tree shaking"
echo "  • Progressive web app features"
echo "  • Real-time performance monitoring"
