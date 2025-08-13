#!/bin/bash

# Create deployment package for Ram Cycle Mart
echo "🚀 Creating deployment package for Ram Cycle Mart..."

# Create temporary directory for clean export
EXPORT_DIR="ram-cycle-mart-export"
mkdir -p $EXPORT_DIR

# Copy essential files and directories
echo "📁 Copying application files..."

# Copy main directories
cp -r client $EXPORT_DIR/
cp -r server $EXPORT_DIR/
cp -r shared $EXPORT_DIR/

# Copy configuration files
cp package.json $EXPORT_DIR/
cp package-lock.json $EXPORT_DIR/
cp tsconfig.json $EXPORT_DIR/
cp vite.config.ts $EXPORT_DIR/
cp tailwind.config.ts $EXPORT_DIR/
cp postcss.config.js $EXPORT_DIR/
cp components.json $EXPORT_DIR/
cp drizzle.config.ts $EXPORT_DIR/

# Copy deployment files
cp ecosystem.config.js $EXPORT_DIR/
cp .htaccess $EXPORT_DIR/
cp .env.production.example $EXPORT_DIR/
cp deploy.sh $EXPORT_DIR/

# Copy documentation
cp EXPORT_README.md $EXPORT_DIR/README.md
cp HOSTING_PROVIDERS_GUIDE.md $EXPORT_DIR/
cp DEPLOYMENT_CHECKLIST.md $EXPORT_DIR/
cp deployment-guide.md $EXPORT_DIR/

# Create .gitignore for the export
cat > $EXPORT_DIR/.gitignore << 'EOF'
node_modules/
dist/
.env
.env.production
.env.local
.env.development.local
.env.test.local
.env.production.local
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
.vscode/
.idea/
*.tsbuildinfo
.cache/
EOF

# Create installation script
cat > $EXPORT_DIR/install.sh << 'EOF'
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
EOF

chmod +x $EXPORT_DIR/install.sh
chmod +x $EXPORT_DIR/deploy.sh

# Create simple package.json with production scripts
cat > $EXPORT_DIR/package-production.json << 'EOF'
{
  "name": "ram-cycle-mart",
  "version": "1.0.0",
  "description": "Ram Cycle Mart - Cycle Shop Management System",
  "type": "module",
  "scripts": {
    "install:prod": "npm install --production",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "start:pm2": "pm2 start ecosystem.config.js",
    "db:push": "drizzle-kit push",
    "postinstall": "echo 'Run npm run build to build the application'"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@neondatabase/serverless": "^0.10.4",
    "@radix-ui/react-accordion": "^1.2.4",
    "@radix-ui/react-alert-dialog": "^1.1.7",
    "@radix-ui/react-aspect-ratio": "^1.1.3",
    "@radix-ui/react-avatar": "^1.1.4",
    "@radix-ui/react-checkbox": "^1.1.5",
    "@radix-ui/react-collapsible": "^1.1.4",
    "@radix-ui/react-context-menu": "^2.2.7",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-hover-card": "^1.1.7",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-menubar": "^1.1.7",
    "@radix-ui/react-navigation-menu": "^1.2.6",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-progress": "^1.1.3",
    "@radix-ui/react-radio-group": "^1.2.4",
    "@radix-ui/react-scroll-area": "^1.2.4",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-separator": "^1.1.3",
    "@radix-ui/react-slider": "^1.2.4",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.4",
    "@radix-ui/react-tabs": "^1.1.4",
    "@radix-ui/react-toast": "^1.2.7",
    "@radix-ui/react-toggle": "^1.1.3",
    "@radix-ui/react-toggle-group": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.2.0",
    "@tanstack/react-query": "^5.60.5",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "connect-pg-simple": "^10.0.0",
    "date-fns": "^3.6.0",
    "drizzle-orm": "^0.39.1",
    "drizzle-zod": "^0.7.0",
    "embla-carousel-react": "^8.6.0",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "framer-motion": "^11.13.1",
    "html2canvas": "^1.4.1",
    "input-otp": "^1.6.0",
    "jspdf": "^2.5.2",
    "jspdf-autotable": "^3.8.4",
    "lucide-react": "^0.468.0",
    "memorystore": "^1.6.7",
    "next-themes": "^0.4.4",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "react": "^18.3.1",
    "react-day-picker": "^9.5.0",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.54.2",
    "react-icons": "^5.4.0",
    "react-resizable-panels": "^2.1.7",
    "recharts": "^2.13.3",
    "tailwind-merge": "^2.5.4",
    "tailwindcss": "^3.4.17",
    "tailwindcss-animate": "^1.0.7",
    "transliteration": "^2.3.5",
    "tw-animate-css": "^1.0.1",
    "vaul": "^1.2.0",
    "wouter": "^3.3.5",
    "ws": "^8.18.0",
    "xlsx": "^0.18.5",
    "zod": "^3.24.1",
    "zod-validation-error": "^4.0.1"
  },
  "devDependencies": {
    "@types/connect-pg-simple": "^7.0.3",
    "@types/express": "^5.0.0",
    "@types/express-session": "^1.18.0",
    "@types/node": "^22.10.5",
    "@types/passport": "^1.0.16",
    "@types/passport-local": "^1.0.38",
    "@types/react": "^18.3.17",
    "@types/react-dom": "^18.3.5",
    "@types/ws": "^8.5.13",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "drizzle-kit": "^0.31.2",
    "esbuild": "^0.24.2",
    "postcss": "^8.5.11",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vite": "^6.0.7"
  }
}
EOF

echo "📦 Creating zip archive..."
zip -r ram-cycle-mart-export.zip $EXPORT_DIR/

echo "🧹 Cleaning up..."
rm -rf $EXPORT_DIR

echo ""
echo "✅ Export package created: ram-cycle-mart-export.zip"
echo ""
echo "📋 Package Contents:"
echo "   - Complete application source code"
echo "   - Production configuration files"
echo "   - Deployment scripts and guides"
echo "   - Database schema and migrations"
echo "   - Documentation and hosting guides"
echo ""
echo "📤 To deploy:"
echo "   1. Download ram-cycle-mart-export.zip"
echo "   2. Extract on your server"
echo "   3. Follow README.md instructions"
echo "   4. Run ./install.sh to get started"
EOF

chmod +x create-export-package.sh