import { app } from './app.js';
import { initializeDatabase } from './db/schema.js';
import { seedDatabase } from './db/seed.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('[MadrasaOS AI] Initializing Relational Database Schema...');
    await initializeDatabase();
    
    console.log('[MadrasaOS AI] Seeding Demo Madrasa Data (100+ students, realistic records)...');
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`[MadrasaOS AI] Server running smoothly at http://localhost:${PORT}`);
      console.log(`[MadrasaOS AI] Health Check: http://localhost:${PORT}/health`);
      console.log(`[MadrasaOS AI] API Endpoint: http://localhost:${PORT}/api/v1`);
    });
  } catch (err) {
    console.error('[MadrasaOS AI] Fatal Error during server bootstrap:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
