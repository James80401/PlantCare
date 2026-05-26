/**
 * Start API (:3001) and web (:5173) together for local development.
 */
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(name, script) {
  const child = spawn('npm', ['run', script], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[dev] ${name} exited with code ${code}`);
    }
  });
  return child;
}

console.log('Starting Plant Care dev servers…');
console.log('  API  → http://localhost:3001/api/v1');
console.log('  Web  → http://localhost:5173');
console.log('  Demo → demo@plantcare.local / DemoPlant1! (after db:seed)\n');

const api = run('api', 'dev:api');
const web = run('web', 'dev:web');

function shutdown() {
  api.kill('SIGTERM');
  web.kill('SIGTERM');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
