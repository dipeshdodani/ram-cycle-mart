# Ram Cycle Mart - Self-Hosting Guide

## 📦 What's Included in This Export

This package contains the complete Ram Cycle Mart application ready for deployment on your own web hosting server.

### Application Features
- Complete cycle shop management system
- Customer management with Gujarati transliteration
- Work order tracking and technician assignment
- Inventory management with stock alerts
- Dual billing system (Service & New Sale invoices)
- GST calculations with manual B2B entry
- Professional PDF invoice generation
- Excel export functionality
- Dark/light theme toggle
- Role-based user access control

### Technical Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with sessions
- **PDF Generation**: jsPDF with professional templates
- **UI Components**: shadcn/ui + Radix UI

## 🖥️ Server Requirements

### Minimum Requirements
- **Operating System**: Linux (Ubuntu 20.04+ recommended)
- **Node.js**: Version 18.0 or higher
- **Database**: PostgreSQL 13+
- **Memory**: 1GB RAM minimum (2GB recommended)
- **Storage**: 10GB available space
- **Network**: Port 80/443 access for web traffic

### Hosting Provider Compatibility
✅ **VPS Providers**: DigitalOcean, Linode, Vultr, AWS EC2, Google Cloud
✅ **Cloud Hosting**: Hostinger Cloud, Cloudways, SiteGround Cloud
✅ **Dedicated Servers**: Any Linux-based dedicated server
❌ **Shared Hosting**: Will NOT work (requires Node.js support)

## 🚀 Quick Deployment Guide

### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx (recommended)
sudo apt install nginx -y
```

### Step 2: Database Setup
```bash
# Create database user and database
sudo -u postgres psql

-- In PostgreSQL shell:
CREATE USER ramcyclemart WITH PASSWORD 'your_secure_password';
CREATE DATABASE ramcyclemart OWNER ramcyclemart;
GRANT ALL PRIVILEGES ON DATABASE ramcyclemart TO ramcyclemart;
\q
```

### Step 3: Application Deployment
```bash
# Upload and extract your code package
# Navigate to your project directory
cd /var/www/ramcyclemart

# Install dependencies
npm install --production

# Create production environment file
cp .env.production.example .env.production
nano .env.production
```

### Step 4: Environment Configuration
Edit `.env.production`:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://ramcyclemart:your_secure_password@localhost:5432/ramcyclemart
SESSION_SECRET=your_very_secure_random_session_secret_here
```

### Step 5: Build and Start
```bash
# Build the application
npm run build

# Run database migrations
npm run db:push

# Start with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### Step 6: Nginx Configuration
Create `/etc/nginx/sites-available/ramcyclemart`:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/ramcyclemart /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 🔧 Alternative Database Options

### Option 1: Managed Database (Recommended)
Use a managed PostgreSQL service:
- **Neon** (free tier available): https://neon.tech
- **Supabase** (free tier available): https://supabase.com
- **DigitalOcean Managed Database**
- **AWS RDS PostgreSQL**

Update `DATABASE_URL` in `.env.production` with the provided connection string.

### Option 2: Docker PostgreSQL
```bash
# Run PostgreSQL in Docker
docker run --name ramcyclemart-db \
  -e POSTGRES_DB=ramcyclemart \
  -e POSTGRES_USER=ramcyclemart \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 \
  -v ramcyclemart_data:/var/lib/postgresql/data \
  -d postgres:15
```

## 📁 Project Structure
```
ramcyclemart/
├── client/                 # React frontend source
├── server/                 # Express backend source
├── shared/                 # Shared schemas and types
├── dist/                   # Built application (generated)
├── .env.production         # Production environment variables
├── ecosystem.config.js     # PM2 configuration
├── deploy.sh              # Deployment script
├── package.json           # Dependencies and scripts
└── README files           # Documentation
```

## 🔐 Security Checklist

- [ ] Change default session secret in `.env.production`
- [ ] Use strong database passwords
- [ ] Enable firewall (ufw) and only open necessary ports
- [ ] Keep system and dependencies updated
- [ ] Regular database backups
- [ ] Monitor application logs
- [ ] Use SSL/TLS certificates

## 🛠️ Maintenance Commands

```bash
# View application logs
pm2 logs ramcyclemart

# Restart application
pm2 restart ramcyclemart

# Update application
git pull origin main  # if using git
npm run build
pm2 restart ramcyclemart

# Database backup
pg_dump -U ramcyclemart -h localhost ramcyclemart > backup_$(date +%Y%m%d).sql

# Database restore
psql -U ramcyclemart -h localhost ramcyclemart < backup_file.sql
```

## 🆘 Troubleshooting

### Common Issues

**Port 3000 already in use:**
```bash
sudo lsof -i :3000
sudo kill -9 PID_NUMBER
```

**Database connection failed:**
- Check PostgreSQL service: `sudo systemctl status postgresql`
- Verify credentials in `.env.production`
- Test connection: `psql -U ramcyclemart -h localhost ramcyclemart`

**Application not accessible:**
- Check PM2 status: `pm2 status`
- Check Nginx status: `sudo systemctl status nginx`
- Check firewall: `sudo ufw status`

**Build errors:**
- Ensure Node.js version 18+: `node --version`
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

## 📞 Support

For technical issues with deployment:
1. Check the troubleshooting section above
2. Review application logs with `pm2 logs`
3. Check server logs in `/var/log/`

## 🎉 Success!

Once deployed successfully:
- Your app will be live at `https://your-domain.com`
- Access admin features through the login system
- All data is stored in your PostgreSQL database
- Application automatically handles user sessions and authentication

**Default Admin Account:**
You'll need to create your first user account through the registration form on the website.