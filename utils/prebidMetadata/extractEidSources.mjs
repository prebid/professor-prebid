// Extracts a moduleName -> eid source[] map from prebid.js's own sources.
// Joins metadata/modules/<X>IdSystem.json (authoritative componentName) with the `source: '...'`
// literals declared in modules/<X>IdSystem.js and any libraries/ files it imports.
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), 'node_modules/prebid.js');
const MODULES = path.join(ROOT, 'modules');
const META = path.join(ROOT, 'metadata/modules');

const OUT = path.resolve(process.cwd(), 'src/pages/Shared/components/preAuction/eidSources.ts');

/**
 * Modules that build their EID source from a constant instead of a `source: '...'` literal, which the
 * scan below cannot see.
 *
 * Re-check these when bumping prebid.js: grep the module for `source:` and follow the constant.
 */
const MANUAL = {
  id5Id: ['id5-sync.com', 'true-link-id5-sync.com'],
  merkleId: ['merkleinc.com'],
  parrableId: ['parrable.com'],
};

const readSafe = (file) => {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
};

const sourcesIn = (code) => Array.from(code.matchAll(/source:\s*'([^']+)'/g)).map((m) => m[1]);

// resolve `from '../libraries/x/y.js'` and `require('../libraries/x/y.js')` relative to the file
const importedFiles = (code, fromFile) =>
  Array.from(code.matchAll(/(?:from\s+|require\()\s*'([^']+)'/g))
    .map((m) => m[1])
    // follow relative imports within the prebid tree, but not core `src/` or npm packages
    .filter((spec) => spec.startsWith('.') && !spec.includes('/src/'))
    .map((spec) => {
      const resolved = path.resolve(path.dirname(fromFile), spec);
      for (const candidate of [resolved, resolved.replace(/\.js$/, '.ts'), resolved.replace(/\.ts$/, '.js')]) {
        if (fs.existsSync(candidate)) return candidate;
      }
      return null;
    })
    .filter(Boolean);

/** Library files re-export each other (liveIntentId/idSystem -> shared), so follow a couple of hops. */
const collectSources = (file, depth = 2, seen = new Set()) => {
  if (!file || seen.has(file) || depth < 0) return [];
  seen.add(file);
  const code = readSafe(file);
  return [...sourcesIn(code), ...importedFiles(code, file).flatMap((next) => collectSources(next, depth - 1, seen))];
};

const result = {};

for (const metaFile of fs.readdirSync(META).filter((f) => f.endsWith('.json'))) {
  const meta = JSON.parse(readSafe(path.join(META, metaFile)) || '{}');
  const userIdComponents = (meta.components || []).filter((c) => c.componentType === 'userId');
  if (userIdComponents.length === 0) continue;

  const base = metaFile.replace(/\.json$/, '');
  const moduleFile = [path.join(MODULES, `${base}.js`), path.join(MODULES, `${base}.ts`)].find((f) => fs.existsSync(f));
  if (!moduleFile) continue;

  const all = new Set(collectSources(moduleFile));

  for (const component of userIdComponents) {
    const sources = Array.from(all).filter((s) => s.includes('.'));
    if (sources.length) result[component.componentName] = sources.sort();
  }
}

for (const [moduleName, sources] of Object.entries(MANUAL)) {
  result[moduleName] = Array.from(new Set([...(result[moduleName] || []), ...sources])).sort();
}

const entries = Object.entries(result).sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
const key = (name) => (/^[A-Za-z][A-Za-z0-9_]*$/.test(name) ? name : `'${name}'`);

const file = `/**
 * Maps each prebid user id module to the EID \`source\` values it can emit.
 *
 * GENERATED - do not edit by hand.
 * Run \`node utils/prebidMetadata/extractEidSources.mjs\` after bumping prebid.js.
 *
 * A module can own several sources, so this is deliberately one to many.
 */
export const EID_SOURCES_BY_MODULE: { [moduleName: string]: string[] } = {
${entries.map(([name, sources]) => `  ${key(name)}: [${sources.map((s) => `'${s}'`).join(', ')}],`).join('\n')}
};
`;

fs.writeFileSync(OUT, file);
console.log(`wrote ${path.relative(process.cwd(), OUT)}: ${entries.length} modules, ${entries.reduce((n, [, s]) => n + s.length, 0)} sources`);
console.log(`(${Object.keys(MANUAL).length} filled in by hand: ${Object.keys(MANUAL).join(', ')})`);
