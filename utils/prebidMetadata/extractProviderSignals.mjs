// Extracts moduleName -> the ortb2 locations each RTD module writes, so an auction can be checked for
// a provider's contribution instead of guessing from the module name.
//
// Only writes count. Reading a path is not evidence that the module set it.
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), 'node_modules/prebid.js');
const MODULES = path.join(ROOT, 'modules');
const META = path.join(ROOT, 'metadata/modules');
const WANTED = new Set(['rtd']);

// Present on every adUnit once anything writes; matching these would mark every provider landed.
const CONTAINERS = new Set(['', 'ext', 'ext.data', 'ext.gpid', 'ext.tid']);

// Written by prebid itself on every page, so never evidence for a provider.
// Kept in step with CORE_IMP_PATHS / CORE_ORTB2_PATHS in providerDiagnostics.ts.
const CORE_PATHS = new Set([
  'ext.gpid', 'ext.tid', 'ext.ae', 'ext.data.adserver', 'ext.data.pbadslot',
  'site.ext.data.documentLang', 'device.ext.vpw', 'device.ext.vph', 'user.ext.eids',
]);

/** Drops paths already covered by a shorter one. */
const collapse = (paths) => paths.filter((p) => !paths.some((other) => other !== p && p.startsWith(`${other}.`)));

// Bare ortb2 branches - present on every page, so useless as evidence.
const ORTB2_CONTAINERS = new Set(['', 'site', 'device', 'user', 'app', 'site.ext', 'device.ext', 'user.ext', 'site.ext.data', 'user.data']);

/**
 * Global ortb2 paths that cannot be read from prebid's source, because the vendor payload decides the
 * key. Observed on a live auction (step 5 of the prebid-upgrade skill) and re-confirmed the same way.
 * Same contract as the MANUAL map in extractEidSources.mjs: add only what has actually been seen.
 */
const MANUAL_ORTB2 = {
  'rtd:wurfl': ['device.ext.wurfl'],
  'rtd:adagio': ['site.ext.data.adg_rtd'],
};

const readSafe = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } };

/** Comments carry stale and aspirational paths; only executable code is evidence. `//` after `:` is left so urls survive. */
const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

/** String constants, needed to resolve templated paths. */
const stringConsts = (code) => {
  const out = {};
  for (const m of code.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*['"]([^'"]+)['"]/g)) out[m[1]] = m[2];
  return out;
};

/** Resolves `${CONST}` and truncates at the first unresolvable placeholder; the prefix stays specific enough. */
const resolvePath = (raw, consts) => {
  const resolved = raw.replace(/\$\{([A-Za-z_$][\w$]*)\}/g, (match, name) => (consts[name] != null ? consts[name] : match));
  const cut = resolved.indexOf('${');
  const truncated = cut === -1 ? resolved : resolved.slice(0, cut);
  return truncated.replace(/\.+$/, '');
};

/**
 * Top level keys of the object literal at `open`. Only read at a `{` or `,` boundary - scanning every
 * offset matches inside a word and yields substrings of it.
 */
const literalKeys = (code, open) => {
  const keys = [];
  let depth = 0;
  let brackets = 0;
  let expectKey = false;
  for (let i = open; i < code.length; i++) {
    const char = code[i];
    if (char === '{') { depth++; if (depth === 1) expectKey = true; continue; }
    if (char === '}') { depth--; if (depth === 0) break; continue; }
    if (char === '[') { brackets++; continue; }
    if (char === ']') { brackets--; continue; }
    if (depth === 1 && brackets === 0 && char === ',') { expectKey = true; continue; }
    if (/\s/.test(char)) continue;
    if (depth === 1 && brackets === 0 && expectKey) {
      const key = /^['"]?([A-Za-z_$][\w$]*)['"]?\s*:/.exec(code.slice(i, i + 80));
      if (key) keys.push(key[1]);
      expectKey = false;
    }
  }
  return keys;
};

/** The ortb2Imp path a target expression addresses, or null. */
const impBase = (target) => {
  const match = /(?:^|[\s(,])(?:[\w$.[\]]*\.)?ortb2Imp((?:\.[\w$]+)*)\s*$/.exec(target);
  return match ? match[1].replace(/^\./, '') : null;
};

const join = (...parts) => parts.filter(Boolean).join('.');

const ortb2ImpWrites = (code) => {
  const consts = stringConsts(code);
  const found = new Set();

  // deepSetValue(target, 'path') - absolute, or relative to an ortb2Imp target
  for (const m of code.matchAll(/deepSetValue\(\s*([^,]+?)\s*,\s*(['"`])((?:(?!\2).)*)\2/g)) {
    const [, target, , rawPath] = m;
    const resolved = resolvePath(rawPath, consts);
    if (/^ortb2Imp(\.|$)/.test(resolved)) found.add(resolved.replace(/^ortb2Imp\.?/, ''));
    else {
      const base = impBase(target);
      if (base !== null) found.add(join(base, resolved));
    }
  }

  // mergeDeep(<ortb2Imp path>, { key: … })
  for (const m of code.matchAll(/mergeDeep\(\s*([^,]+?)\s*,\s*\{/g)) {
    const base = impBase(m[1]);
    if (base === null) continue;
    literalKeys(code, m.index + m[0].length - 1).forEach((key) => found.add(join(base, key)));
  }

  // assignment, excluding `= x || {}` initialisation guards
  for (const m of code.matchAll(/[\w$\]]\.ortb2Imp((?:\.[\w$]+)+)\s*=\s*([^=;\n]+)/g)) {
    if (/\|\|\s*\{\s*\}/.test(m[2])) continue;
    found.add(m[1].replace(/^\./, ''));
  }

  return Array.from(found).filter((p) => p && !CONTAINERS.has(p) && !CORE_PATHS.has(p));
};

/** Local names holding `ortb2Fragments.global` or `.bidder[x]`; writes go through these, not the literal. */
const fragmentAliases = (code) => {
  const aliases = new Set();
  for (const m of code.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*[^;\n]*ortb2Fragments[?.]*\.(?:global|bidder)/g)) aliases.add(m[1]);
  return aliases;
};

/** Literal global ortb2 paths. Most modules build the path from the vendor response instead. */
const ortb2Writes = (code) => {
  const consts = stringConsts(code);
  const aliases = fragmentAliases(code);
  const found = new Set();

  for (const m of code.matchAll(/deepSetValue\(\s*([^,]+?)\s*,\s*(['"`])((?:(?!\2).)*)\2/g)) {
    const target = m[1].trim();
    if (!/ortb2Fragments/.test(target) && !aliases.has(target)) continue;
    found.add(resolvePath(m[3], consts));
  }

  for (const m of code.matchAll(/mergeDeep\(\s*([^,]+?)\s*,\s*\{/g)) {
    const target = m[1].trim();
    if (!/ortb2Fragments\.global/.test(target) && !aliases.has(target)) continue;
    literalKeys(code, m.index + m[0].length - 1).forEach((key) => found.add(key));
  }

  return Array.from(found).filter((p) => p && !ORTB2_CONTAINERS.has(p) && !CORE_PATHS.has(p));
};

/** Filenames match the domain shape below and are not segment names. */
const FILENAME = /\.(json|jsonp|js|ts|html?|css|xml|txt|svg|png|jpe?g|gif|md|map)$/i;

/**
 * ortb2 data segment names, which identify a provider exactly rather than by name guess. Covers both
 * a literal and the same value via a string constant; the domain shape keeps submodule registrations out.
 */
const segmentNames = (code) => {
  const consts = stringConsts(code);
  const candidates = [
    ...Array.from(code.matchAll(/name:\s*['"]([^'"]+)['"]/g)).map((m) => m[1]),
    ...Array.from(code.matchAll(/name:\s*([A-Za-z_$][\w$]*)/g)).map((m) => consts[m[1]]),
  ];
  return candidates
    .filter(Boolean)
    .map((name) => name.toLowerCase())
    .filter((name) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(name) && !FILENAME.test(name));
};

/** EID sources an RTD module publishes; without these they read as an unconfigured identity module. */
const eidSources = (code) => {
  const consts = stringConsts(code);
  const found = [
    ...Array.from(code.matchAll(/source:\s*['"]([^'"]+)['"]/g)).map((m) => m[1]),
    ...Array.from(code.matchAll(/source:\s*([A-Za-z_$][\w$]*)/g)).map((m) => consts[m[1]]),
  ];
  return found.filter(Boolean).map((s) => s.toLowerCase()).filter((s) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(s) && !FILENAME.test(s));
};

/**
 * Paths a module documents in its own `.md`, which prebid ships in the package. Some submodules pass
 * the request straight to a vendor payload and hold no path, leaving the `.md` the only public source.
 * Documentation can be stale, so treat these as claims to confirm against a live auction.
 */
const documentedPaths = (docs) => {
  const ortb2 = new Set();
  const ortb2Imp = new Set();
  for (const m of docs.matchAll(/\bortb2\.((?:site|device|user|app)\.(?:ext|data)(?:\.[a-zA-Z0-9_]+)*)/g)) ortb2.add(m[1]);
  for (const m of docs.matchAll(/\bortb2Imp\.((?:ext|data)(?:\.[a-zA-Z0-9_]+)*)/g)) ortb2Imp.add(m[1]);
  return {
    ortb2: Array.from(ortb2).filter((path) => !ORTB2_CONTAINERS.has(path) && !CORE_PATHS.has(path)),
    ortb2Imp: Array.from(ortb2Imp).filter((path) => !CONTAINERS.has(path) && !CORE_PATHS.has(path)),
  };
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

const collect = (file, depth = 2, seen = new Set()) => {
  if (!file || seen.has(file) || depth < 0) return { ortb2Imp: [], ortb2: [], segments: [], eidSources: [] };
  seen.add(file);
  const code = stripComments(readSafe(file));
  const nested = importedFiles(code, file).map((n) => collect(n, depth - 1, seen));
  return {
    ortb2Imp: [...ortb2ImpWrites(code), ...nested.flatMap((n) => n.ortb2Imp)],
    ortb2: [...ortb2Writes(code), ...nested.flatMap((n) => n.ortb2)],
    segments: [...segmentNames(code), ...nested.flatMap((n) => n.segments)],
    eidSources: [...eidSources(code), ...nested.flatMap((n) => n.eidSources)],
  };
};

const result = {};

for (const metaFile of fs.readdirSync(META).filter((f) => f.endsWith('.json'))) {
  const meta = JSON.parse(readSafe(path.join(META, metaFile)) || '{}');
  const components = (meta.components || []).filter((c) => WANTED.has(c.componentType));
  if (!components.length) continue;

  const base = metaFile.replace(/\.json$/, '');
  const moduleFile = [path.join(MODULES, `${base}.js`), path.join(MODULES, `${base}.ts`)].find((f) => fs.existsSync(f));
  if (!moduleFile) continue;

  const { ortb2Imp, ortb2, segments, eidSources: eids } = collect(moduleFile);
  const documented = documentedPaths(readSafe(path.join(MODULES, `${base}.md`)));

  for (const component of components) {
    const key = `${component.componentType}:${component.componentName}`;
    const manual = MANUAL_ORTB2[key] || [];
    if (!ortb2Imp.length && !ortb2.length && !manual.length && !segments.length && !eids.length && !documented.ortb2.length && !documented.ortb2Imp.length) continue;
    const prev = result[key] || { ortb2Imp: [], ortb2: [], segments: [], eidSources: [] };
    result[key] = {
      ortb2Imp: collapse(Array.from(new Set([...prev.ortb2Imp, ...ortb2Imp, ...documented.ortb2Imp]))).sort(),
      ortb2: collapse(Array.from(new Set([...prev.ortb2, ...ortb2, ...manual, ...documented.ortb2]))).sort(),
      segments: Array.from(new Set([...prev.segments, ...segments])).sort(),
      eidSources: Array.from(new Set([...prev.eidSources, ...eids])).sort(),
    };
  }
}

const manualUsed = Object.keys(MANUAL_ORTB2).filter((key) => result[key]);
const manualMissing = Object.keys(MANUAL_ORTB2).filter((key) => !result[key]);

const OUT = path.resolve(process.cwd(), 'src/pages/Shared/components/preAuction/providerSignals.ts');
const entries = Object.entries(result).sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
const list = (values) => `[${values.map((v) => `'${v}'`).join(', ')}]`;

const file = `/**
 * Where each RTD module writes its contribution, used to check that a provider's data reached an
 * auction rather than inferring it from the module name.
 *
 * GENERATED - do not edit by hand.
 * Run \\\`node utils/prebidMetadata/extractProviderSignals.mjs\\\` after bumping prebid.js.
 *
 * Keys are \\\`<componentType>:<componentName>\\\`, matching \\\`realTimeData.dataProviders[].name\\\`.
 * Paths come from the module source, from its \\\`.md\\\`, and from a small curated map.
 * \\\`ortb2Imp\\\` paths are relative to a bid's \\\`ortb2Imp\\\`. Container paths are excluded.
 */
export interface IProviderSignal {
  /** Paths within a bid's \\\`ortb2Imp\\\` that this module writes. */
  ortb2Imp: string[];
  /** Paths within the bidder request's \\\`ortb2\\\` that this module writes. */
  ortb2: string[];
  /** ortb2 data segment names, matched exactly rather than by token. */
  segments: string[];
  /** EID sources this RTD module publishes. */
  eidSources: string[];
}

export const PROVIDER_SIGNALS: { [typeAndName: string]: IProviderSignal } = {
${entries.map(([name, s]) => `  '${name}': { ortb2Imp: ${list(s.ortb2Imp)}, ortb2: ${list(s.ortb2)}, segments: ${list(s.segments)}, eidSources: ${list(s.eidSources)} },`).join('\n')}
};
`;

fs.writeFileSync(OUT, file);
const impPaths = entries.reduce((n, [, s]) => n + s.ortb2Imp.length, 0);
const ortb2Paths = entries.reduce((n, [, s]) => n + s.ortb2.length, 0);
console.log(`wrote ${path.relative(process.cwd(), OUT)}: ${entries.length} modules, ${impPaths} ortb2Imp paths, ${ortb2Paths} ortb2 paths`);
console.log(`  manual ortb2 entries applied: ${manualUsed.join(', ') || 'none'}`);
if (manualMissing.length) console.log(`  WARNING - manual entry for a module that no longer exists: ${manualMissing.join(', ')}`);
