module.exports = {
  apps: [
    {
      name: "energdive-web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        TENDER_API_INTERNAL_URL: "http://127.0.0.1:8000",
      },
    },
    {
      name: "tender-api",
      script: "tender-service/venv/bin/python",
      args: "tender-service/app.py serve",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        API_HOST: "127.0.0.1",
        API_PORT: 8000,
      },
    },
  ],
};
