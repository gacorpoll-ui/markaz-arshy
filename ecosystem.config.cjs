module.exports = {
  apps: [
    {
      name: '9router-gateway',
      script: 'C:/Users/Riri/AppData/Roaming/npm/node_modules/9router/app/custom-server.js',
      cwd: 'C:/Users/Riri/AppData/Roaming/npm/node_modules/9router/app',
      node_args: '--max-old-space-size=6144',
      env: {
        PORT: '20128',
        HOSTNAME: '0.0.0.0',
        NODE_ENV: 'production'
      }
    },
    {
      name: 'markaz-backend',
      script: 'src/index.js',
      cwd: 'D:/follower-store/backend',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'markaz-frontend',
      script: 'D:/follower-store/backend/serve-frontend.cjs',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
