# Hostinger Deployment Guide for Ram Cycle Mart

## Prerequisites
- Hostinger VPS or Cloud Hosting plan with Node.js support
- Domain name (can be purchased through Hostinger)
- PostgreSQL database access

## Step 1: Database Setup

### Option A: Hostinger Database
1. Create PostgreSQL database in Hostinger control panel
2. Note down: host, port, database name, username, password

### Option B: External Database (Recommended)
1. Create free database on Supabase or Neon
2. Copy connection string

## Step 2: Environment Configuration
Create `.env.production` file with:
```
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-secure-session-secret
PORT=3000
```

## Step 3: Code Modifications Made

### Files Modified for Production:
- `package.json` - Added production scripts
- `server/index.ts` - Production configuration
- `vite.config.ts` - Production build settings
- `.htaccess` - Apache configuration for SPA routing

### Database Migration:
Run these commands on your server:
```bash
npm install
npm run db:push
```

## Step 4: Upload to Hostinger

### Via FTP/SFTP:
1. Upload all files except `node_modules/`
2. SSH into your server
3. Run: `npm install --production`
4. Run: `npm run build`
5. Start: `npm run start`

### Via Git (Recommended):
1. Push code to GitHub repository
2. Clone on server: `git clone your-repo-url`
3. Install and build as above

## Step 5: Web Server Configuration

### For Apache (.htaccess included):
- Ensure mod_rewrite is enabled
- Point document root to `/dist` folder

### For Nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        try_files $uri $uri/ @fallback;
    }
    
    location @fallback {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Step 6: Process Management
Install PM2 for process management:
```bash
npm install -g pm2
pm2 start npm --name "ram-cycle-mart" -- run start
pm2 startup
pm2 save
```

## Step 7: Domain & SSL
1. Point your domain A record to your server IP
2. Install SSL certificate (Let's Encrypt recommended)
3. Update any hardcoded URLs to use your domain

## Backup Information
This Replit project remains as your development environment and backup.
All data and functionality is preserved here.