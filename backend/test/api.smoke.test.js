import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { after, test } from 'node:test';

const backendDirectory = new URL('../', import.meta.url);
const port = await getFreePort();
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['src/index.js'], {
  cwd: backendDirectory,
  env: {
    ...process.env,
    PORT: String(port),
    JWT_SECRET: 'smoke-test-secret-not-for-production'
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverOutput = '';
server.stdout.setEncoding('utf8').on('data', (chunk) => { serverOutput += chunk; });
server.stderr.setEncoding('utf8').on('data', (chunk) => { serverOutput += chunk; });

after(async () => {
  if (server.exitCode === null) {
    server.kill('SIGTERM');
    await Promise.race([once(server, 'exit'), delay(2000)]);
  }
});

test('health, auth, geo-tagged publishing, and keyword/radius search', async () => {
  await waitForServer();

  const healthResponse = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthResponse.status, 200);
  assert.equal((await healthResponse.json()).ok, true);

  const unauthenticatedPost = await fetch(`${baseUrl}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Unauthorized', content: 'Must not publish' })
  });
  assert.equal(unauthenticatedPost.status, 401);

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const credentials = {
    username: `smoke-${suffix}`,
    password: 'smoke-test-password',
    displayName: 'Smoke Test'
  };

  const registerResponse = await fetch(`${baseUrl}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  assert.equal(registerResponse.status, 201);
  const registration = await registerResponse.json();
  assert.ok(registration.token);

  const loginResponse = await fetch(`${baseUrl}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: credentials.username, password: credentials.password })
  });
  assert.equal(loginResponse.status, 200);
  const login = await loginResponse.json();
  assert.ok(login.token);

  const title = `smoke-geo-${suffix}`;
  const publishResponse = await fetch(`${baseUrl}/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${login.token}`
    },
    body: JSON.stringify({
      title,
      content: 'End-to-end smoke test post',
      latitude: 31.2304,
      longitude: 121.4737
    })
  });
  assert.equal(publishResponse.status, 201);
  const published = await publishResponse.json();
  assert.equal(published.post.title, title);
  assert.equal(published.post.latitude, 31.2304);
  assert.equal(published.post.longitude, 121.4737);

  const searchParams = new URLSearchParams({
    keyword: title,
    latitude: '31.2304',
    longitude: '121.4737',
    radius: '1'
  });
  const searchResponse = await fetch(`${baseUrl}/api/search?${searchParams}`);
  assert.equal(searchResponse.status, 200);
  const search = await searchResponse.json();
  assert.ok(search.posts.some((post) => post.id === published.post.id));
});

async function getFreePort() {
  const socketServer = createServer();
  socketServer.listen(0, '127.0.0.1');
  await once(socketServer, 'listening');
  const { port: freePort } = socketServer.address();
  await new Promise((resolve, reject) => socketServer.close((error) => error ? reject(error) : resolve()));
  return freePort;
}

async function waitForServer() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Backend exited before becoming ready. Output:\n${serverOutput}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // The backend may still be starting.
    }
    await delay(100);
  }
  throw new Error(`Backend did not become ready in time. Output:\n${serverOutput}`);
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
