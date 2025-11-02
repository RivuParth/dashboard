export default {
  apps: [{
    name: 'payment-dashboard',
    script: 'npm',
    args: 'run dev:full',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development'
    }
  }]
};