#!/bin/bash
echo "🚀 Installing Ram Cycle Mart..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f .env.production ]; then
    echo "📝 Creating .env.production..."
    cp .env.production.example .env.production
    echo "⚠️  Please edit .env.production with your database credentials!"
fi

echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.production with your database URL and secrets"
echo "2. Run: npm run build"
echo "3. Run: npm run db:push"
echo "4. Run: npm start"
echo ""
echo "For detailed instructions, see README.md"