#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
const args = process.argv.slice(2);
let targetUrl: string | undefined;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) {
    targetUrl = args[i + 1];
    break;
  }
}
const env = { ...process.env };
if (targetUrl) {
  env.AUDIT_URL = targetUrl;
} else {
}
const testPath = path.resolve(__dirname, '../../e2e/specs/09_prebid_surface_audit.spec.ts');
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(npxCmd, ['playwright', 'test', testPath, '--reporter=list'], {
  env,
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '../..'),
});
child.on('exit', (code) => {
  process.exit(code || 0);
});
