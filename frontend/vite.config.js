import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, frontendRoot, '');
  const certificatePath = path.join(frontendRoot, '.local-https', 'localhost.pfx');
  const passphrase = env.LOCAL_HTTPS_PASSPHRASE;
  const https = fs.existsSync(certificatePath) && passphrase
    ? { pfx: fs.readFileSync(certificatePath), passphrase }
    : undefined;

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      https,
      proxy: {
        // Proxy browser requests through Vite so they remain same-origin.
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});
