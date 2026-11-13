/**
 * Inkloom AI - Cross-Platform Backend Runner
 * Automatically detects the virtual environment and launches the backend server.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

// Candidate python interpreter paths in priority order
const candidates = [
  path.join(repoRoot, 'backend', '.venv', isWindows ? 'Scripts/python.exe' : 'bin/python'),
  path.join(repoRoot, '.venv', isWindows ? 'Scripts/python.exe' : 'bin/python'),
  path.join(repoRoot, 'backend', 'venv', isWindows ? 'Scripts/python.exe' : 'bin/python'),
  path.join(repoRoot, 'venv', isWindows ? 'Scripts/python.exe' : 'bin/python'),
  isWindows ? 'python' : 'python3',
];

let pythonExecutable = candidates.find(c => {
  if (c === 'python' || c === 'python3') return true;
  return fs.existsSync(c);
}) || (isWindows ? 'python' : 'python3');

console.log(`[Inkloom AI] Using Python interpreter: ${pythonExecutable}`);

const launcherScript = path.join(repoRoot, 'run_backend.py');

const child = spawn(pythonExecutable, [launcherScript], {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: false,
  env: {
    ...process.env,
    PYTHONUNBUFFERED: '1',
  },
});

child.on('error', (err) => {
  console.error('[Inkloom AI] Failed to start backend server:', err.message);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (code !== null) {
    process.exit(code);
  } else if (signal) {
    process.kill(process.pid, signal);
  }
});
