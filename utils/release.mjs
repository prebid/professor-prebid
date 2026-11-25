// Uploads the extension to the Chrome Web Store and submits it for review, signed in as you.
//
// Each run opens your browser for a Google login. The access token stays in memory, is revoked when
// the script ends, and no refresh token is requested, so nothing that can publish is ever stored.
//
//   npm run release                    checks, build, upload, submit - staged: goes live when you publish it
//   npm run release -- --publish       publish as soon as the review approves it
//   npm run release -- --dry-run       everything up to the upload, including the login and the version check
//   npm run release -- --zip <file>    release a zip built elsewhere (e.g. the CI artifact) instead of building
//
// One-time setup (see https://developer.chrome.com/docs/webstore/using-api):
//   1. In a Google Cloud project you own, enable the Chrome Web Store API.
//   2. OAuth consent screen: External, add your own account as a test user. Testing mode is fine - the
//      7-day expiry it imposes applies to refresh tokens, which this script never asks for.
//   3. Credentials > OAuth client ID > Desktop app. Google does not treat a desktop client secret as
//      confidential; it grants nothing without your login.
//   4. Export these outside the repo (never commit them):
//        CWS_CLIENT_ID, CWS_CLIENT_SECRET   the desktop OAuth client
//        CWS_PUBLISHER_ID                   Developer Dashboard > Account
//        CWS_ITEM_ID                        optional, defaults to the Professor Prebid listing
//
// The account you sign in with must own the item and have 2-step verification on.
import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import path from 'path';
import readline from 'readline/promises';
import { execFileSync, spawnSync } from 'child_process';

const API = 'https://chromewebstore.googleapis.com';
const SCOPE = 'https://www.googleapis.com/auth/chromewebstore';
const DEFAULT_ITEM_ID = 'kdnllijdimhbledmfdbljampcdphcbdc';
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;
const UPLOAD_TIMEOUT_MS = 2 * 60 * 1000;

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};
const dryRun = flag('--dry-run');
const publishType = flag('--publish') ? 'DEFAULT_PUBLISH' : 'STAGED_PUBLISH';
const givenZip = option('--zip');

const fail = (message) => {
  console.error(`\n✖ ${message}`);
  process.exit(1);
};
const step = (message) => console.log(`\n▸ ${message}`);
/** Once signed in, errors are thrown rather than exiting, so the token is still revoked. */
const abort = (message) => {
  throw new Error(message);
};

const env = {
  clientId: process.env.CWS_CLIENT_ID,
  clientSecret: process.env.CWS_CLIENT_SECRET,
  publisherId: process.env.CWS_PUBLISHER_ID,
  itemId: process.env.CWS_ITEM_ID || DEFAULT_ITEM_ID,
};
const missing = Object.entries({ CWS_CLIENT_ID: env.clientId, CWS_CLIENT_SECRET: env.clientSecret, CWS_PUBLISHER_ID: env.publisherId })
  .filter(([, value]) => !value)
  .map(([name]) => name);
if (missing.length) fail(`Set ${missing.join(', ')} - see the setup notes at the top of utils/release.mjs`);

const itemName = `publishers/${env.publisherId}/items/${env.itemId}`;

/** 1.10.0 > 1.9.3; the store requires each upload to raise the manifest version. */
const compareVersions = (a, b) => {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (left[i] || 0) - (right[i] || 0);
    if (diff !== 0) return Math.sign(diff);
  }
  return 0;
};

const run = (script) => {
  const result = spawnSync('npm', ['run', script], { stdio: 'inherit' });
  if (result.status !== 0) fail(`npm run ${script} failed`);
};

/** The zip to release, after the checks and a build when it is not given. */
const preparePackage = () => {
  if (givenZip) {
    if (!fs.existsSync(givenZip)) fail(`${givenZip} does not exist`);
    return path.resolve(givenZip);
  }
  // A release is built from a commit, so it can be traced back to one.
  if (execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()) fail('The working tree has changes - commit or stash them first');
  for (const script of ['typecheck', 'test', 'build']) {
    step(`npm run ${script}`);
    run(script);
  }
  const { name, version } = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return path.resolve('zip', `${name}-${version}.zip`);
};

const manifestVersion = (zip) => {
  try {
    return JSON.parse(execFileSync('unzip', ['-p', zip, 'manifest.json'], { encoding: 'utf8' })).version;
  } catch (error) {
    fail(`Could not read manifest.json from ${zip}: ${error.message}`);
  }
};

const base64url = (buffer) => buffer.toString('base64url');

const openBrowser = (url) => {
  const [command, ...prefix] = process.platform === 'darwin' ? ['open'] : process.platform === 'win32' ? ['cmd', '/c', 'start', '""'] : ['xdg-open'];
  spawnSync(command, [...prefix, url], { stdio: 'ignore' });
};

/** OAuth for installed apps: loopback redirect with PKCE. Online access only, so no refresh token is issued. */
const login = async () => {
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
  const state = base64url(crypto.randomBytes(16));

  let redirectUri;
  const code = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      server.close();
      reject(new Error('No login within 5 minutes'));
    }, LOGIN_TIMEOUT_MS);
    const server = http.createServer((request, response) => {
      const params = new URL(request.url, redirectUri).searchParams;
      if (!params.has('code') && !params.has('error')) {
        response.writeHead(404).end();
        return;
      }
      const ok = params.get('state') === state && params.has('code');
      response.writeHead(ok ? 200 : 400, { 'Content-Type': 'text/plain' }).end(ok ? 'Signed in. You can close this tab and return to the terminal.' : 'Login failed. Check the terminal.');
      clearTimeout(timer);
      server.close();
      if (ok) resolve(params.get('code'));
      else reject(new Error(params.get('error') || 'The login response did not match this request'));
    });
    server.listen(0, '127.0.0.1', () => {
      redirectUri = `http://127.0.0.1:${server.address().port}`;
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      url.search = new URLSearchParams({
        client_id: env.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: SCOPE,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state,
        prompt: 'select_account consent',
      }).toString();
      console.log(`Opening your browser for the Google login. If it does not open, visit:\n${url}`);
      openBrowser(url.toString());
    });
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({ code, client_id: env.clientId, client_secret: env.clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code', code_verifier: verifier }),
  });
  const token = await response.json();
  if (!response.ok) throw new Error(`Token exchange failed: ${token.error_description || token.error || response.status}`);
  if (!token.scope?.split(' ').includes(SCOPE)) throw new Error('Chrome Web Store access was not granted');
  return token.access_token;
};

const revoke = (accessToken) => fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`, { method: 'POST' }).catch(() => undefined);

const api = async (accessToken, method, url, body, contentType = 'application/json') => {
  const response = await fetch(url, { method, headers: { Authorization: `Bearer ${accessToken}`, ...(body ? { 'Content-Type': contentType } : {}) }, body });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${method} ${url.replace(API, '')} failed (${response.status}): ${json.error?.message || JSON.stringify(json)}`);
  return json;
};

const fetchStatus = (accessToken) => api(accessToken, 'GET', `${API}/v2/${itemName}:fetchStatus`);
const versionsOf = (revision) => (revision?.distributionChannels || []).map((channel) => channel.crxVersion).filter(Boolean);

const confirm = async (question) => {
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await prompt.question(`${question} [y/N] `);
  prompt.close();
  return /^y(es)?$/i.test(answer.trim());
};

const zip = preparePackage();
const version = manifestVersion(zip);
step(`Package ${path.relative(process.cwd(), zip)}, version ${version}`);

step('Signing in to Google');
const accessToken = await login().catch((error) => fail(error.message));

try {
  step(`Reading the store status of ${env.itemId}`);
  const status = await fetchStatus(accessToken);
  const published = versionsOf(status.publishedItemRevisionStatus);
  const submitted = status.submittedItemRevisionStatus;
  console.log(`Published: ${published.join(', ') || 'none'} (${status.publishedItemRevisionStatus?.state || 'not published'})`);
  if (submitted) console.log(`Submitted: ${versionsOf(submitted).join(', ') || '?'} (${submitted.state})`);
  if (status.takenDown) console.warn('⚠ The item is taken down for a policy violation.');
  if (status.warned) console.warn('⚠ The item has a policy warning and will be taken down if it is not resolved.');

  if (submitted?.state === 'PENDING_REVIEW') abort('A submission is already in review. Cancel it in the Developer Dashboard first, or wait for the result.');
  const newest = [...published, ...versionsOf(submitted)].sort(compareVersions).pop();
  if (newest && compareVersions(version, newest) <= 0) abort(`Version ${version} is not higher than ${newest} in the store - raise "version" in package.json`);

  const plan = `upload ${version} and submit it for review, ${publishType === 'STAGED_PUBLISH' ? 'staged - it goes live only when you publish it' : 'published as soon as it is approved'}`;
  if (dryRun) {
    step(`Dry run: would ${plan}. Stopping here.`);
  } else {
    if (!(await confirm(`\nAbout to ${plan}. Continue?`))) abort('Cancelled');

    step('Uploading');
    const upload = await api(accessToken, 'POST', `${API}/upload/v2/${itemName}:upload?uploadType=media`, fs.readFileSync(zip), 'application/zip');
    const deadline = Date.now() + UPLOAD_TIMEOUT_MS;
    let uploadState = upload.uploadState;
    while (uploadState === 'IN_PROGRESS' || uploadState === 'UPLOAD_IN_PROGRESS') {
      if (Date.now() > deadline) abort('The upload is still processing after 2 minutes - check the Developer Dashboard');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      uploadState = (await fetchStatus(accessToken)).lastAsyncUploadState;
    }
    if (uploadState !== 'SUCCEEDED' && !(uploadState === undefined && upload.crxVersion)) abort(`Upload ${uploadState || 'failed'}: ${JSON.stringify(upload)}`);
    if (upload.crxVersion && upload.crxVersion !== version) abort(`The store read version ${upload.crxVersion} from the package, expected ${version}`);
    console.log(`Uploaded ${version}`);

    step('Submitting for review');
    const result = await api(accessToken, 'POST', `${API}/v2/${itemName}:publish`, JSON.stringify({ publishType }));
    for (const warning of result.warningInfo?.warnings || []) console.warn(`⚠ ${warning.reason}: ${warning.description}`);
    console.log(`Submitted - state ${result.state}.`);
    if (publishType === 'STAGED_PUBLISH') console.log('Once approved it is staged; publish it from the Developer Dashboard.');
  }
} catch (error) {
  console.error(`\n✖ ${error.message}`);
  process.exitCode = 1;
} finally {
  await revoke(accessToken);
}
