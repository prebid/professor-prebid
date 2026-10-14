export interface PrebidGroundTruth {
  namespace: string;
  version: string | null;
  installedModules: string[];
  config: Record<string, any> | null;
  bidderSettings?: Record<string, any> | null;
  eids: any[];
  adUnits: any[];
  events: Array<{ eventType: string; args: any; elapsedTime?: number }>;
  winningBids: any[];
  timeoutSetting?: number | null;
}

export interface ExtensionCapturedState {
  namespace: string;
  version?: string;
  installedModules?: string[];
  config?: Record<string, any>;
  bidderSettings?: Record<string, any>;
  eids?: any[];
  events?: Array<{ eventType: string; args: any; elapsedTime?: number }>;
  eventsCount?: number;
  eventsUrl?: string | null;
  mcpSnapshot?: any;
}

export interface DomainAuditResult {
  domain: string;
  passed: boolean;
  score: number;
  summary: string;
  details: {
    expected?: any;
    actual?: any;
    missing?: any;
    discrepancies?: string[];
  };
}

export interface SurfaceAuditReport {
  timestamp: string;
  targetUrl: string;
  overallPassed: boolean;
  namespace: string;
  domains: {
    version: DomainAuditResult;
    modules: DomainAuditResult;
    config: DomainAuditResult;
    events: DomainAuditResult;
    userIds: DomainAuditResult;
    bids: DomainAuditResult;
    adUnits: DomainAuditResult;
  };
}

export const sanitizeForComparison = function(val: any): any {
  if (val === null || val === undefined) return val;
  if (typeof val === 'function') return '[Function]';
  if (typeof val !== 'object') return val;
  if (Array.isArray(val)) {
    return val.map(sanitizeForComparison);
  }
  const clean: Record<string, any> = {};
  const sortedKeys = Object.keys(val).sort();
  for (const k of sortedKeys) {
    if (k.startsWith('_') && typeof val[k] === 'function') continue;
    clean[k] = sanitizeForComparison(val[k]);
  }
  return clean;
}

export const reconcilePrebidSurface = function(truth: PrebidGroundTruth, captured: ExtensionCapturedState, targetUrl: string = 'synthetic'): SurfaceAuditReport {
  const versionPassed = truth.version ? truth.version === captured.version : true;
  const versionResult: DomainAuditResult = {
    domain: 'Version',
    passed: versionPassed,
    score: versionPassed ? 100 : 0,
    summary: versionPassed ? `Prebid version ${truth.version} matched exactly.` : `Version mismatch: Expected ${truth.version}, Extension captured ${captured.version}`,
    details: { expected: truth.version, actual: captured.version },
  };

  // 2. Installed Modules Reconcile
  const truthModules = new Set(truth.installedModules || []);
  const capturedModules = new Set(captured.installedModules || []);
  const missingModules = [...truthModules].filter((m) => !capturedModules.has(m));
  const modulesPassed = missingModules.length === 0;
  const modulesScore = truthModules.size > 0 ? Math.round(((truthModules.size - missingModules.length) / truthModules.size) * 100) : 100;
  const modulesResult: DomainAuditResult = {
    domain: 'Installed Modules',
    passed: modulesPassed,
    score: modulesScore,
    summary: modulesPassed ? `All ${truthModules.size} installed modules detected.` : `Missing ${missingModules.length} modules: ${missingModules.join(', ')}`,
    details: {
      expected: [...truthModules],
      actual: [...capturedModules],
      missing: missingModules,
    },
  };

  // 3. Config Reconcile
  const truthConfig = truth.config || {};
  const capturedConfig = captured.config || {};
  const truthConfigKeys = Object.keys(truthConfig);
  const missingConfigKeys = truthConfigKeys.filter((k) => !(k in capturedConfig));
  const valueMismatches: string[] = [];

  for (const key of truthConfigKeys) {
    if (key in capturedConfig) {
      const expVal = JSON.stringify(sanitizeForComparison(truthConfig[key]));
      const actVal = JSON.stringify(sanitizeForComparison(capturedConfig[key]));
      if (expVal !== actVal) {
        // Deep compare check
        valueMismatches.push(key);
      }
    }
  }

  const configPassed = missingConfigKeys.length === 0 && valueMismatches.length === 0;
  const configScore = truthConfigKeys.length > 0 ? Math.round(((truthConfigKeys.length - missingConfigKeys.length - valueMismatches.length) / truthConfigKeys.length) * 100) : 100;
  const configResult: DomainAuditResult = {
    domain: 'Configuration (pbjs.getConfig)',
    passed: configPassed,
    score: Math.max(0, configScore),
    summary: configPassed ? `All ${truthConfigKeys.length} config sections correctly surfaced.` : `Config discrepancies: missing [${missingConfigKeys.join(', ')}], mismatched values [${valueMismatches.join(', ')}]`,
    details: {
      missing: missingConfigKeys,
      discrepancies: valueMismatches,
    },
  };

  // 4. Events Reconcile
  const truthEvents = truth.events || [];
  const capturedEvents = captured.events || [];
  const truthTypes = truthEvents.map((e) => e.eventType);
  const capturedTypes = capturedEvents.map((e) => e.eventType);

  const eventCountsTruth: Record<string, number> = {};
  const eventCountsCaptured: Record<string, number> = {};
  truthTypes.forEach((t) => (eventCountsTruth[t] = (eventCountsTruth[t] || 0) + 1));
  capturedTypes.forEach((t) => (eventCountsCaptured[t] = (eventCountsCaptured[t] || 0) + 1));

  const missingEventTypes: string[] = [];
  const countMismatches: string[] = [];
  for (const [type, count] of Object.entries(eventCountsTruth)) {
    const capCount = eventCountsCaptured[type] || 0;
    if (capCount === 0) {
      missingEventTypes.push(type);
    } else if (capCount < count) {
      countMismatches.push(`${type} (expected ${count}, got ${capCount})`);
    }
  }

  const eventsPassed = missingEventTypes.length === 0 && countMismatches.length === 0;
  const eventsScore = truthEvents.length > 0 ? Math.round(((truthEvents.length - missingEventTypes.length - countMismatches.length) / Math.max(1, truthEvents.length)) * 100) : 100;
  const eventsResult: DomainAuditResult = {
    domain: 'Events Stream (pbjs.getEvents)',
    passed: eventsPassed,
    score: Math.max(0, Math.min(100, eventsScore)),
    summary: eventsPassed ? `All ${truthEvents.length} events across ${Object.keys(eventCountsTruth).length} event types surfaced.` : `Missing event types: [${missingEventTypes.join(', ')}]; count discrepancies: [${countMismatches.join(', ')}]`,
    details: {
      expected: eventCountsTruth,
      actual: eventCountsCaptured,
      missing: missingEventTypes,
      discrepancies: countMismatches,
    },
  };

  // 5. User IDs (EIDs) Reconcile
  const truthEids = truth.eids || [];
  const capturedEids = captured.eids || [];
  const truthSources = truthEids.map((e: any) => e.source).filter(Boolean);
  const capturedSources = capturedEids.map((e: any) => e.source).filter(Boolean);
  const missingSources = truthSources.filter((s: string) => !capturedSources.includes(s));
  const userIdsPassed = missingSources.length === 0;
  const userIdsScore = truthSources.length > 0 ? Math.round(((truthSources.length - missingSources.length) / truthSources.length) * 100) : 100;
  const userIdsResult: DomainAuditResult = {
    domain: 'User IDs & EIDs',
    passed: userIdsPassed,
    score: userIdsScore,
    summary: userIdsPassed ? `All ${truthSources.length} EID sources surfaced (${truthSources.join(', ') || 'none'}).` : `Missing EID sources: ${missingSources.join(', ')}`,
    details: {
      expected: truthSources,
      actual: capturedSources,
      missing: missingSources,
    },
  };

  // 6. Bids / Winning Bids
  const truthWinning = truth.winningBids || [];
  const capturedWinning = captured.mcpSnapshot?.winningBids || [];
  const truthWinners = truthWinning.map((b: any) => b.bidder || b.bidderCode);
  const capturedWinners = capturedWinning.map((b: any) => b.bidder || b.bidderCode);
  const bidsPassed = truthWinners.length === capturedWinners.length;
  const bidsResult: DomainAuditResult = {
    domain: 'Bids & Winning Bids',
    passed: bidsPassed,
    score: bidsPassed ? 100 : 50,
    summary: bidsPassed ? `Winning bids accounted for (${truthWinners.length} winners).` : `Winning bids mismatch: expected ${truthWinners.length}, captured ${capturedWinners.length}`,
    details: {
      expected: truthWinners,
      actual: capturedWinners,
    },
  };

  // 7. Ad Units Reconcile
  const truthAdUnits = truth.adUnits || [];
  const truthCodes = truthAdUnits.map((u: any) => u.code).filter(Boolean);
  const adUnitsPassed = truthCodes.length > 0 ? (captured.mcpSnapshot?.adUnitsCount || 0) >= truthCodes.length : true;
  const adUnitsResult: DomainAuditResult = {
    domain: 'Ad Units',
    passed: adUnitsPassed,
    score: adUnitsPassed ? 100 : 50,
    summary: adUnitsPassed ? `Ad units accounted for (${truthCodes.length} units).` : `Ad units count discrepancy`,
    details: {
      expected: truthCodes,
    },
  };

  const overallPassed = versionResult.passed && modulesResult.passed && configResult.passed && eventsResult.passed && userIdsResult.passed && bidsResult.passed && adUnitsResult.passed;

  return {
    timestamp: new Date().toISOString(),
    targetUrl,
    overallPassed,
    namespace: truth.namespace || 'pbjs',
    domains: {
      version: versionResult,
      modules: modulesResult,
      config: configResult,
      events: eventsResult,
      userIds: userIdsResult,
      bids: bidsResult,
      adUnits: adUnitsResult,
    },
  };
}

/**
 * Formats a SurfaceAuditReport into a clean Markdown table.
 */
export const formatAuditReportMarkdown = function(report: SurfaceAuditReport): string {
  const statusBadge = report.overallPassed ? '✅ **PASS (100% Surface Match)**' : '❌ **FAIL (Discrepancies Found)**';

  let md = `# Professor Prebid Data Surface Audit Report\n\n`;
  md += `- **URL / Target**: \`${report.targetUrl}\`\n`;
  md += `- **Timestamp**: \`${report.timestamp}\`\n`;
  md += `- **Prebid Namespace**: \`${report.namespace}\`\n`;
  md += `- **Overall Verdict**: ${statusBadge}\n\n`;

  md += `## Domain Audit Breakdown\n\n`;
  md += `| Prebid Domain | Status | Match Score | Summary |\n`;
  md += `|---|---|---|---|\n`;

  for (const [, result] of Object.entries(report.domains)) {
    const badge = result.passed ? '✅ Pass' : '❌ Fail';
    md += `| **${result.domain}** | ${badge} | ${result.score}% | ${result.summary} |\n`;
  }

  md += `\n## Detailed Discrepancy Diagnostics\n\n`;
  let hasDiscrepancies = false;
  for (const [key, result] of Object.entries(report.domains)) {
    if (!result.passed) {
      hasDiscrepancies = true;
      md += `### ⚠️ Discrepancy in ${result.domain} (\`${key}\`)\n`;
      md += `- **Summary**: ${result.summary}\n`;
      md += `\`\`\`json\n${JSON.stringify(result.details, null, 2)}\n\`\`\`\n\n`;
    }
  }

  if (!hasDiscrepancies) {
    md += `> No discrepancies detected. All Prebid runtime configurations, event streams, user IDs, and auction metrics are 100% captured and available to the Professor Prebid extension panels.\n`;
  }

  return md;
}
