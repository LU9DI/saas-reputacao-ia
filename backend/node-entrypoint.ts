// Entry point for the backend container
// This script ensures the environment is validated before starting the server.
// It can be extended to run database migrations or other one‑time setup tasks.

import { spawn } from 'child_process';
import { validateEnv } from './lib/env';

// Validate environment variables (throws if invalid)
validateEnv();

// Start the application using npm start
const child = spawn('npm', ['start'], {
  stdio: 'inherit',
  env: process.env,
});

child.on('close', (code) => {
  console.log(`npm start exited with code ${code}`);
  process.exit(code ?? 0);
});
