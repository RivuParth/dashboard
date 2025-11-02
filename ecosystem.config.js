export default {
  apps: [{
    name: 'payment-dashboard-server',
    script: 'npx',
    args: 'tsx server/server.ts',
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