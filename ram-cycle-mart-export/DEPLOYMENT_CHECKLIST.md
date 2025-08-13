# 🚀 Hostinger Deployment Checklist for Ram Cycle Mart

## ✅ Pre-Deployment (Complete)
- [x] Created production configuration files
- [x] Added Apache .htaccess for URL routing
- [x] Created PM2 ecosystem configuration
- [x] Added environment variables template
- [x] Modified server for production static file serving
- [x] Created deployment scripts

## 📋 Hostinger Setup Requirements

### 1. Hosting Plan Requirements
- ✅ VPS or Cloud Hosting (NOT shared hosting)
- ✅ Node.js support (version 18+)
- ✅ SSH access
- ✅ PostgreSQL database access

### 2. Domain Configuration
- 🔲 Purchase domain through Hostinger or external registrar
- 🔲 Point A record to your server IP address
- 🔲 Set up SSL certificate (Let's Encrypt recommended)

## 🗄️ Database Setup Options

### Option A: Hostinger Database
1. 🔲 Create PostgreSQL database in Hostinger control panel
2. 🔲 Note: host, port, username, password, database name
3. 🔲 Update `.env.production` with these credentials

### Option B: External Database (Recommended)
1. 🔲 Create free database on [Neon](https://neon.tech) or [Supabase](https://supabase.com)
2. 🔲 Copy connection string to `.env.production`

## 📤 File Upload Process

### Method 1: FTP/SFTP Upload
1. 🔲 Run `bash deploy.sh` locally to build
2. 🔲 Upload all files EXCEPT `node_modules/` folder
3. 🔲 SSH into server: `ssh username@your-server-ip`
4. 🔲 Navigate to your domain folder: `cd /public_html/your-domain.com`
5. 🔲 Install dependencies: `npm install --production`

### Method 2: Git Deployment (Recommended)
1. 🔲 Push this code to GitHub repository
2. 🔲 SSH into your server
3. 🔲 Clone repository: `git clone https://github.com/yourusername/your-repo.git`
4. 🔲 Navigate to project: `cd your-repo`
5. 🔲 Install dependencies: `npm install --production`

## ⚙️ Server Configuration

### 1. Environment Variables
```bash
# Edit .env.production with your actual credentials
nano .env.production
```

Required variables:
- `DATABASE_URL` - Your PostgreSQL connection string
- `SESSION_SECRET` - Generate a secure random string
- `PORT` - Usually 3000

### 2. Database Migration
```bash
npm run db:push
```

### 3. Build Application
```bash
npm run build
```

## 🎯 Launch Application

### Option 1: Direct Start
```bash
npm start
```

### Option 2: PM2 (Recommended for production)
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Setup auto-restart on server reboot
pm2 startup
pm2 save
```

## 🌐 Web Server Configuration

### For Apache (Included)
- ✅ `.htaccess` file included for URL routing
- 🔲 Ensure mod_rewrite is enabled on your server

### For Nginx (if using)
Create nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    location / {
        try_files $uri $uri/ @fallback;
    }
    
    location @fallback {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔒 Security & SSL
1. 🔲 Install SSL certificate (Let's Encrypt)
2. 🔲 Redirect HTTP to HTTPS
3. 🔲 Update environment variables if needed
4. 🔲 Test all functionality after SSL setup

## ✅ Post-Deployment Testing
- 🔲 Test user registration/login
- 🔲 Test customer management
- 🔲 Test inventory management
- 🔲 Test work order creation
- 🔲 Test invoice generation and PDF download
- 🔲 Test GST calculations
- 🔲 Test Excel export functionality
- 🔲 Test dark/light theme toggle

## 🔧 Troubleshooting Common Issues

### Database Connection Errors
- Verify DATABASE_URL format: `postgresql://user:pass@host:port/dbname`
- Check firewall settings for database port
- Ensure PostgreSQL service is running

### File Permission Issues
```bash
chmod +x deploy.sh
chmod 755 dist/
```

### Node.js Version Issues
```bash
# Check Node.js version
node --version

# Update if needed (using nvm)
nvm install 18
nvm use 18
```

## 📞 Support
- Hostinger Support: For server/hosting issues
- Database Provider Support: For database connectivity
- This Replit project: Remains as development environment and backup

## 🎉 Success!
Once everything is working:
- Your app will be live at `https://your-domain.com`
- Admin access through the same login system
- All data and functionality preserved
- This Replit remains as your development backup