import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const viteCli = resolve(repositoryRoot, 'node_modules/vite/bin/vite.js');
const cypressCli = resolve(repositoryRoot, 'node_modules/cypress/bin/cypress');
const serverDefinitions = [
  { port: 3000, mockApi: true, name: 'business mock API' },
  { port: 3001, mockApi: false, name: 'design HTTP fixtures' },
];

const servers = [];
let activeCypress;
let interrupted = false;

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    interrupted = true;
    activeCypress?.kill(signal);
  });
}

function startVite({ port, mockApi }) {
  const server = spawn(
    process.execPath,
    [viteCli, '--host', 'localhost', '--port', String(port), '--strictPort'],
    {
      cwd: repositoryRoot,
      env: {
        ...process.env,
        VITE_ENABLE_MOCK_API: String(mockApi),
        VITE_PORT: String(port),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    },
  );
  server.viteReady = false;
  for (const stream of [server.stdout, server.stderr]) {
    stream?.on('data', (chunk) => {
      const output = chunk.toString();
      process.stdout.write(output);
      if (output.includes('Local:')) server.viteReady = true;
    });
  }
  server.on('error', (error) => {
    console.error(`Failed to start Vite on port ${port}:`, error);
  });
  servers.push(server);
  return server;
}

async function waitForVite(server, port, name) {
  const deadline = Date.now() + 120_000;
  const url = `http://localhost:${port}/`;

  while (Date.now() < deadline) {
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error(`Vite server for ${name} exited before becoming ready (port ${port}).`);
    }

    // Vite prints its Local URL only after the HTTP listener is accepting work.
    // Prefer that signal so a cold dependency-optimizer response is not repeatedly
    // aborted by the readiness probe on slower CI runners.
    if (server.viteReady) return;

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (response.ok) return;
    } catch {
      // The server is still starting; poll its readiness endpoint again.
    }

    await delay(500);
  }

  throw new Error(`Vite server for ${name} was not ready at ${url} within 120 seconds.`);
}

function runCypress(args, environment) {
  return new Promise((resolveExit, reject) => {
    const processHandle = spawn(process.execPath, [cypressCli, ...args], {
      cwd: repositoryRoot,
      env: environment,
      stdio: 'inherit',
      windowsHide: true,
    });
    activeCypress = processHandle;
    processHandle.once('error', reject);
    processHandle.once('close', (code) => {
      if (activeCypress === processHandle) activeCypress = undefined;
      resolveExit(code ?? 1);
    });
  });
}

async function stopServers() {
  await Promise.all(servers.map((server) => {
    if (server.exitCode !== null || server.signalCode !== null) return Promise.resolve();
    return new Promise((resolveExit) => {
      server.once('close', resolveExit);
      server.kill();
    });
  }));
}

let exitCode = 0;
try {
  for (const definition of serverDefinitions) {
    console.log(`[e2e] Starting ${definition.name} on port ${definition.port}.`);
    const server = startVite(definition);
    await waitForVite(server, definition.port, definition.name);
  }

  console.log('[e2e] Running business specs with the mock API server on port 3000.');
  exitCode = await runCypress(
    ['run', '--config', 'excludeSpecPattern=**/design/**'],
    { ...process.env, VITE_ENABLE_MOCK_API: 'true', VITE_PORT: '3000' },
  );

  if (exitCode === 0 && !interrupted) {
    console.log('[e2e] Running HTTP-fixture design specs against port 3001.');
    exitCode = await runCypress(
      ['run', '--spec', 'cypress/e2e/design/**/*.cy.ts', '--config', 'baseUrl=http://localhost:3001'],
      { ...process.env, VITE_ENABLE_MOCK_API: 'false', VITE_PORT: '3001' },
    );
  }
} catch (error) {
  console.error('[e2e] Full Cypress regression could not run:', error);
  exitCode = 1;
} finally {
  await stopServers();
}

process.exitCode = interrupted ? 130 : exitCode;
