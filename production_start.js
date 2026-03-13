// Force production mode for CAREN server
process.env.NODE_ENV = 'production';
process.env.FORCE_PRODUCTION = 'true';

console.log('[PRODUCTION_START] Setting NODE_ENV=production');
console.log('[PRODUCTION_START] Setting FORCE_PRODUCTION=true');

// Import and start the server
import('./server/index.ts')
  .then(() => {
    console.log('[PRODUCTION_START] Server started in production mode');
  })
  .catch((error) => {
    console.error('[PRODUCTION_START] Failed to start server:', error);
  });