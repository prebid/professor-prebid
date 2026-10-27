// Discovers the ortb2 paths a vendor payload script writes - the ones absent from prebid's source.
//
// Some RTD modules hardcode a payload url, load it, and merge whatever it returns. The namespace key
// in that response is not in prebid, but usually survives minification in the payload, because the
// literal handed back has to be in the shape prebid expects. Where a payload builds the path
// dynamically this finds nothing; confirm on a live auction and use MANUAL_ORTB2 instead.
//
// NETWORK ACCESS, and third party scripts change without notice: a discovery aid run by hand, never
// part of the build. Prints suggestions only, writes no file, never executes what it downloads.
//
//   node utils/prebidMetadata/scanVendorPayloads.mjs
import fs from 'fs';
import path from 'path';

const MODULES = path.resolve(process.cwd(), 'node_modules/prebid.js/modules');

/** ortb2 structure rather than a vendor namespace. */
const STRUCTURAL = new Set(['ext', 'data', 'user', 'site', 'device', 'app', 'imp', 'id', 'name', 'segment', 'keywords', 'content', 'ortb2', 'global', 'bidder']);

const readSafe = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } };

/** Modules that load an external script from a hardcoded url. */
const payloadUrls = () => {
  const out = [];
  for (const file of fs.readdirSync(MODULES).filter((f) => /RtdProvider\.(js|ts)$/.test(f))) {
    const code = readSafe(path.join(MODULES, file));
    if (!/loadExternalScript/.test(code)) continue;
    const url = /['"`](https?:\/\/[^'"`\s${}]+\.js)['"`]/.exec(code);
    if (url) out.push({ name: file.replace(/RtdProvider\.(js|ts)$/, ''), url: url[1] });
  }
  return out;
};

/**
 * Full ortb2 paths a payload writes. Report the section as well as the key: a bare key says a vendor
 * writes something somewhere, the section is what makes it checkable against an auction.
 */
const vendorPaths = (code) => {
  const found = new Map();
  const record = (path, index) => {
    const key = path.split('.').pop();
    if (STRUCTURAL.has(key) || key.length < 3 || key.length > 24) return;
    if (!found.has(path)) found.set(path, code.slice(Math.max(0, index - 30), index + 70).replace(/\s+/g, ' '));
  };
  // <section>:{ext:{<key>:  and  <section>:{ext:{data:{<key>:
  for (const m of code.matchAll(/\b(device|site|user|app)\s*:\s*\{\s*ext\s*:\s*\{\s*(?:(data)\s*:\s*\{\s*)?['"]?(\w+)['"]?\s*:/g)) {
    record([m[1], 'ext', m[2], m[3]].filter(Boolean).join('.'), m.index);
  }
  // ortb2:{<section>:{ext:{<key>:  and  ortb2:{ext:{<key>:  (no section - kept visible)
  for (const m of code.matchAll(/\bortb2\s*:\s*\{\s*(?:(device|site|user|app)\s*:\s*\{\s*)?ext\s*:\s*\{\s*['"]?(\w+)['"]?\s*:/g)) {
    record([m[1], 'ext', m[2]].filter(Boolean).join('.'), m.index);
  }
  return found;
};

const modules = payloadUrls();
console.log(`${modules.length} RTD modules load a vendor payload from a hardcoded url\n`);

for (const { name, url } of modules) {
  let body = '';
  try {
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(25000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    body = await response.text();
  } catch (error) {
    console.log(`${name.padEnd(16)} ${url}\n  could not fetch: ${error.message}\n`);
    continue;
  }

  const keys = vendorPaths(body);
  console.log(`${name.padEnd(16)} ${url}  (${body.length} bytes)`);
  if (!keys.size) {
    console.log('  no ortb2 path found - it may build the path dynamically, or write nothing to ortb2\n');
    continue;
  }
  for (const [path, context] of keys) console.log(`  ${path}\n      …${context}…`);
  console.log(`  → confirm against a live auction, then add to MANUAL_ORTB2 as 'rtd:${name}' if the extractor misses it\n`);
}

console.log('These are candidates, not facts: a payload can also build a path dynamically, and this only');
console.log('sees literals. Only an auction proves what landed. See step 5 of the prebid-upgrade skill.');
