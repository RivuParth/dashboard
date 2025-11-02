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