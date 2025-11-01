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