# Payment Dashboard

A bi-weekly payment tracking application with SQLite backend, built with React and Express.

## Features

- **Admin Dashboard**: Track and manage payment statuses
- **Client View**: Public interface for clients to view payment schedules
- **SQLite Database**: Persistent data storage
- **Session Authentication**: Secure login system
- **Real-time Updates**: Client view updates automatically

## Local Development

### Prerequisites
- Node.js 18+
- npm or bun

### Installation

```bash
# Install dependencies
npm install

# Start development servers (frontend + backend)
npm run dev:full

# Or run separately:
npm run server  # Backend on port 3001
npm run dev     # Frontend on port 8081
```

## Ubuntu Deployment

### Automated Deployment

1. **Copy files to Ubuntu server:**
   ```bash
   scp -r . ubuntu@your-server-ip:/tmp/payment-dashboard
   ```

2. **SSH into your server and run the deployment script:**
   ```bash
   ssh ubuntu@your-server-ip
   sudo mv /tmp/payment-dashboard /var/www/
   cd /var/www/payment-dashboard
   chmod +x deploy.sh
   ./deploy.sh
   ```

### Manual Deployment

If you prefer manual setup:

1. **Install dependencies:**
   ```bash
   sudo apt update
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs nginx
   sudo npm install -g pm2 serve
   ```

2. **Setup application:**
   ```bash
   cd /var/www/payment-dashboard
   npm install --production
   npm run build
   ```

3. **Configure PM2:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx:**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/payment-dashboard
   sudo ln -s /etc/nginx/sites-available/payment-dashboard /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## API Endpoints

- `POST /api/login` - User authentication
- `POST /api/logout` - User logout
- `GET /api/auth/status` - Check authentication status
- `GET /api/payments` - Get all payments
- `PUT /api/payments/:date` - Update payment status

## Database

The application uses SQLite with the following tables:
- `users` - User accounts
- `payments` - Payment records
- `sessions` - User sessions

Database file: `database.sqlite`

## Default Credentials

- Username: `admin`
- Password: `admin@partha`

## PM2 Commands

```bash
pm2 status          # Check status
pm2 logs            # View logs
pm2 restart all     # Restart apps
pm2 stop all        # Stop apps
```

## Security Notes

- Change default admin credentials in production
- Configure SSL/TLS for HTTPS
- Set up proper firewall rules
- Regularly backup the SQLite database

## License

MIT
