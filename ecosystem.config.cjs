module.exports = {
  apps: [
    {
      name: "open-prompt-gallery",
      cwd: __dirname,
      script: "scripts/start.mjs",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "750M",
      env: {
        NODE_ENV: "production",
        HOSTNAME: "127.0.0.1",
        PORT: process.env.PORT || 3000,
      },
      time: true,
    },
  ],
};
