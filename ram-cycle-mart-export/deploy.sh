#!/bin/bash

# Deployment script for Hostinger
echo "🚀 Starting deployment to Hostinger..."

# Build the application
echo "📦 Building application..."
npm run build

# Create production environment file if it doesn't exist
if [ ! -f .env.production ]; then
    echo "📝 Creating .env.production from example..."
    cp .env.production.example .env.production
    echo "⚠️  Please edit .env.production with your actual database credentials!"
fi

# Run database migrations
echo "🗄️  Running database migrations..."
npm run db:push

echo "✅ Build complete!"
echo ""
echo "📋 Next steps for Hostinger deployment:"
echo "1. Upload all files to your server (except node_modules/)"
echo "2. SSH into your server and run:"
echo "   npm install --production"
echo "3. Edit .env.production with your database credentials"
echo "4. Start the application:"
echo "   npm start"
echo "   OR use PM2: npm run start:pm2"
echo ""
echo "🌐 Your app will be available at http://your-domain.com"