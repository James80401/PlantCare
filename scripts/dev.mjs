/**
 * Start API (:3001) and web (:5173) together for local development.
 */
import { spawn, spawnSync } from 'child_process';
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

console.log('Starting Dr. Plant dev servers…');
console.log('  API  → http://localhost:3001/api/v1');
console.log('  Web  → http://localhost:5173');
console.log('  Demo → demo@plantcare.local / DemoPlant1! (after db:seed)\n');

// Build @plant-care/shared once up front. The API resolves it from its built package
// (packages/shared/dist), so the declarations must exist before the API watcher
// type-checks — otherwise a fresh clone fails on the first compile. The shared watcher
// below then keeps it rebuilt as its source changes.
console.log('Building @plant-care/shared…');
const sharedBuild = spawnSync('npm', ['run', 'build', '-w', '@plant-care/shared'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});
if (sharedBuild.status !== 0) {
  console.error('[dev] failed to build @plant-care/shared');
  process.exit(sharedBuild.status ?? 1);
}

const shared = run('shared', 'dev:shared');
const api = run('api', 'dev:api');
const web = run('web', 'dev:web');

function shutdown() {
  shared.kill('SIGTERM');
  api.kill('SIGTERM');
  web.kill('SIGTERM');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
