import { AttributionSource } from './harCorrelation';
import { LandedVerdict, ProviderType } from './providerDiagnostics';

type ChipColor = 'success' | 'error' | 'warning' | 'primary' | 'default';

export const VERDICT_LABEL: { [verdict in LandedVerdict]: string } = {
  landed: 'landed',
  late: 'too late',
  never: 'nothing produced',
  unknown: 'unknown',
};

const NEVER_LABEL: { [type in ProviderType]: string } = { identity: 'no ID', rtd: 'no RTD' };

export const verdictLabel = (verdict: LandedVerdict, type?: ProviderType): string => (verdict === 'never' ? (type ? NEVER_LABEL[type] : 'no ID / no RTD') : VERDICT_LABEL[verdict]);

export const VERDICT_COLOR: { [verdict in LandedVerdict]: ChipColor } = {
  landed: 'success',
  late: 'error',
  never: 'default',
  unknown: 'default',
};

export const VERDICT_HELP: { [verdict in LandedVerdict]: string } = {
  landed: 'Present in this auction’s bidder requests.',
  late: 'Present in another auction on this page, absent from this one.',
  never: 'Absent from every auction, at the paths this module writes.',
  unknown: 'No known write path for this module. Nothing attributable either way.',
};

export const ATTRIBUTION_LABEL: { [source in AttributionSource]: string } = {
  endpoint: 'known endpoint',
  host: 'name guess',
};

export const ATTRIBUTION_HELP: { [source in AttributionSource]: string } = {
  endpoint: 'Host matches a documented endpoint in prebid’s source.',
  host: 'Module name appears in the hostname. A guess.',
};

export const formatMs = (ms: number): string => {
  const abs = Math.abs(ms);
  if (abs < 1000) return `${Math.round(ms)}ms`;
  if (abs < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}min`;
};
