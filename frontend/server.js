// Custom server setup for WebContainer compatibility
import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the equivalent of __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startServer() {
  const server = await createServer({
    // The Vite config will be automatically loaded from vite.config.js
    configFile: resolve(__dirname, 'vite.config.js'),
    server: {
      port: 5173,
      strictPort: true,
      headers: {
        // These headers are required for SharedArrayBuffer to work
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
  });

  await server.listen();
  
  const info = server.config.server;
  console.log(`Server running at http://localhost:${info.port}`);
  console.log('COOP and COEP headers are enabled for WebContainer compatibility');
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
}); 