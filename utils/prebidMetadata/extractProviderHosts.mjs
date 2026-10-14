// Extracts moduleName -> endpoint hostname[] for prebid's user id and RTD modules, so network
// requests can be attributed to the provider that made them.
//
// Joins metadata/modules/*.json (authoritative componentName + vendor disclosureURL) with every URL
// literal in the module source and the libraries it imports.
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), 'node_modules/prebid.js');
const MODULES = path.join(ROOT, 'modules');
const META = path.join(ROOT, 'metadata/modules');
const WANTED = new Set(['rtd', 'userId', 'bidder', 'analytics']);

// Hosts that appear in module source but are never the provider's own endpoint: documentation links
// in comments, and shared infrastructure that many unrelated requests also use. A missing
// attribution is better than a wrong one, so anything ambiguous is dropped.
const IGNORED = [
  // docs / comments
  'prebid.org', 'github.com', 'githubusercontent.com', 'w3.org', 'schema.org', 'iabtechlab.com',
  'iabeurope.eu', 'example.com', 'localhost', 'npmjs.com', 'unpkg.com', 'creativecommons.org',
  'mozilla.org', 'microsoft.com', 'mathiasbynens.be', 'stackoverflow.com', 'wikipedia.org',
  'developer.mozilla.org', 'medium.com', 'json.org', 'ietf.org', 'rfc-editor.org',
  // shared infrastructure - too generic to attribute
  'amazonaws.com', 'cloudfront.net', 'googleapis.com', 'gstatic.com', 'google.com', 'doubleclick.net',
  'googletagservices.com', 'googlesyndication.com', 'akamaihd.net', 'azureedge.net', 'cloudflare.com',
  'jsdelivr.net', 'herokuapp.com', 'vercel.app', 'netlify.app', 'blob.core.windows.net',
];

const readSafe = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } };

const hostsIn = (code) => {
  const out = [];
  // protocol-relative and absolute urls, stopping before any template interpolation
  for (const m of code.matchAll(/(?:https?:)?\/\/([a-z0-9.-]*[a-z0-9-]\.[a-z]{2,})(?=[/'"`\s?:)]|$)/gi)) {
    out.push(m[1].toLowerCase());
  }
  return out;
};

const importedFiles = (code, fromFile) =>
  Array.from(code.matchAll(/(?:from\s+|require\()\s*'([^']+)'/g))
    .map((m) => m[1])
    .filter((spec) => spec.startsWith('.') && !spec.includes('/src/'))
    .map((spec) => {
      const resolved = path.resolve(path.dirname(fromFile), spec);
      for (const c of [resolved, resolved.replace(/\.js$/, '.ts'), resolved.replace(/\.ts$/, '.js')]) {
        if (fs.existsSync(c)) return c;
      }
      return null;
    })
    .filter(Boolean);

const collectHosts = (file, depth = 2, seen = new Set()) => {
  if (!file || seen.has(file) || depth < 0) return [];
  seen.add(file);
  const code = readSafe(file);
  return [...hostsIn(code), ...importedFiles(code, file).flatMap((n) => collectHosts(n, depth - 1, seen))];
};

/** example.co.uk -> example.co.uk ; a.b.example.com -> example.com */
const registrable = (host) => {
  const parts = host.split('.');
  const twoLevelTld = /^(co|com|org|net|gov|ac)\.[a-z]{2}$/.test(parts.slice(-2).join('.'));
  return parts.slice(twoLevelTld ? -3 : -2).join('.');
};

const result = {};

for (const metaFile of fs.readdirSync(META).filter((f) => f.endsWith('.json'))) {
  const meta = JSON.parse(readSafe(path.join(META, metaFile)) || '{}');
  const components = (meta.components || []).filter((c) => WANTED.has(c.componentType));
  if (!components.length) continue;

  const base = metaFile.replace(/\.json$/, '');
  const moduleFile = [path.join(MODULES, `${base}.js`), path.join(MODULES, `${base}.ts`)].find((f) => fs.existsSync(f));
  if (!moduleFile) continue;

  const hosts = new Set(collectHosts(moduleFile));
  // the vendor's own disclosure endpoint is a reliable extra signal
  for (const url of Object.keys(meta.disclosures || {})) hostsIn(url).forEach((h) => hosts.add(h));
  for (const c of components) if (c.disclosureURL) hostsIn(c.disclosureURL).forEach((h) => hosts.add(h));

  const domains = Array.from(new Set(Array.from(hosts).map(registrable))).filter((d) => !IGNORED.some((ig) => d === ig || ig.startsWith(d + '/')));

  for (const component of components) {
    if (!domains.length) continue;
    const key = `${component.componentType}:${component.componentName}`;
    result[key] = Array.from(new Set([...(result[key] || []), ...domains])).sort();
  }
}

const OUT = path.resolve(process.cwd(), 'src/pages/Shared/components/preAuction/providerHosts.ts');

const entries = Object.entries(result).sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

const file = `/**
 * Endpoint domains each prebid user id / RTD module calls, used to attribute network requests to the
 * provider that made them.
 *
 * GENERATED - do not edit by hand.
 * Run \`node utils/prebidMetadata/extractProviderHosts.mjs\` after bumping prebid.js.
 *
 * Keys are \`<componentType>:<componentName>\`, matching the names used in
 * \`realTimeData.dataProviders[].name\` and \`userSync.userIds[].name\`.
 *
 * Documentation links and shared infrastructure (amazonaws, gstatic, doubleclick...) are excluded: a
 * missing attribution is better than a wrong one. Modules whose endpoint comes from publisher config
 * are absent on purpose - those hosts are read from the live config instead.
 */
export const PROVIDER_HOSTS: { [typeAndName: string]: string[] } = {
${entries.map(([name, hosts]) => `  '${name}': [${hosts.map((h) => `'${h}'`).join(', ')}],`).join('\n')}
};
`;

fs.writeFileSync(OUT, file);
console.log(`wrote ${path.relative(process.cwd(), OUT)}: ${entries.length} components, ${entries.reduce((n, [, h]) => n + h.length, 0)} domains`);
