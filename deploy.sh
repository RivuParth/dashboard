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
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/payment-dashboard
sudo chown -R $USER:$USER /var/www/payment-dashboard

# Copy application files (assuming this script is run from the project directory)
echo "📋 Copying application files..."
cp -r . /var/www/payment-dashboard/
cd /var/www/payment-dashboard

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build the frontend
echo "🔨 Building frontend..."
npm run build

# Create ecosystem file for PM2
echo "⚙️ Creating PM2 ecosystem file..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'payment-dashboard-server',
    script: 'server/server.ts',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }, {
    name: 'payment-dashboard-frontend',
    script: 'serve',
    args: 'dist -s -l 3000',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# Install serve globally for serving the built frontend
echo "📦 Installing serve for frontend..."
sudo npm install -g serve

# Install nginx (if not already installed)
echo "📦 Installing nginx..."
sudo apt install -y nginx

# Create nginx configuration
echo "⚙️ Creating nginx configuration..."
sudo tee /etc/nginx/sites-available/payment-dashboard << EOF
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
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