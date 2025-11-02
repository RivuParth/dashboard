#!/bin/bash

# Payment Dashboard Deployment Script for Ubuntu
# This script sets up the application on an Ubuntu server

set -e

echo "🚀 Starting Payment Dashboard Deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm (if not already installed)
echo "📦 Installing Node.js and npm..."
if ! command -v node &> /dev/null || [[ "$(node --version)" != v20* ]]; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install build tools for better-sqlite3
echo "📦 Installing build tools..."
sudo apt-get install -y build-essential python3 python3-dev

# Install PM2 for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Add swap memory to prevent OOM issues
echo "💾 Adding swap memory..."
if [ -f /swapfile ]; then
    echo "Swap file already exists, removing it..."
    sudo swapoff /swapfile 2>/dev/null || true
    sudo rm -f /swapfile
fi
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
swapon --show
free -h

# Check if we're already in the dashboard directory
if [ "$(basename "$PWD")" != "dashboard" ]; then
    echo "📁 Navigating to dashboard directory..."
    if [ -d "dashboard" ]; then
        cd dashboard
    else
        echo "❌ Error: dashboard directory not found. Please run this script from the parent directory or ensure the repository is cloned as 'dashboard'."
        exit 1
    fi
else
    echo "📁 Already in dashboard directory"
fi

# Install dependencies with npm ci for better memory usage
echo "📦 Installing dependencies..."
npm ci --no-audit --no-fund

# Create ecosystem file for PM2
echo "⚙️ Creating PM2 ecosystem file..."
cat > ecosystem.config.js << EOF
export default {
  apps: [{
    name: 'payment-dashboard-server',
    script: 'server/server.ts',
    interpreter: 'tsx',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    }
  }, {
    name: 'payment-dashboard-frontend',
    script: 'npm',
    args: 'run dev',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development'
    }
  }]
};
EOF

# Note: No need to install serve since we're running dev:full

# Install nginx (if not already installed)
echo "📦 Installing nginx..."
sudo apt install -y nginx

# Create nginx configuration
echo "⚙️ Creating nginx configuration..."
sudo tee /etc/nginx/sites-available/payment-dashboard << EOF
server {
    listen 80;
    server_name _;

    # Frontend (Vite dev server)
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
echo "🔗 Enabling nginx site..."
sudo ln -sf /etc/nginx/sites-available/payment-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Set proper permissions for database
echo "🔒 Setting database permissions..."
touch database.sqlite
chmod 664 database.sqlite

# Create symlink for easier access (optional)
echo "🔗 Creating symlink..."
sudo ln -sf $(pwd) /var/www/payment-dashboard

# Start the application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Enable firewall (optional)
echo "🔥 Configuring firewall..."
sudo ufw allow 80
sudo ufw allow 22
sudo ufw --force enable

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your application should now be accessible at:"
echo "   Frontend: http://your-server-ip"
echo "   API: http://your-server-ip/api"
echo ""
echo "📊 PM2 commands:"
echo "   pm2 status          - Check application status"
echo "   pm2 logs            - View application logs"
echo "   pm2 restart all     - Restart all applications"
echo "   pm2 stop all        - Stop all applications"
echo ""
echo "🔧 Useful commands:"
echo "   sudo systemctl status nginx    - Check nginx status"
echo "   sudo systemctl reload nginx    - Reload nginx config"
echo "   sudo ufw status                - Check firewall status"