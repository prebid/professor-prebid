import { Config, EventRecord } from 'prebid.js/types.d.ts';

export type SerializedMetrics = { [name: string]: number | number[] };

export interface IPreAuctionChild {
  label: string;
  start: number;
  end: number;
  duration: number;
  metrics: { [name: string]: number };
}

export interface IPreAuctionRow {
  metric: string;
  label: string;
  start: number;
  end: number;
  duration: number;
  variant: 'phase' | 'unattributed' | 'afterAuctionStart';
  children: IPreAuctionChild[];
  notes: string[];
}

export interface IPreAuctionTimeline {
  start: number;

  duration: number;
  rows: IPreAuctionRow[];
  metrics: SerializedMetrics;
}

const PRE_AUCTION_PHASES: { metric: string; label: string }[] = [
  { metric: 'requestBids.gdpr', label: 'Consent (TCF)' },
  { metric: 'requestBids.gpp', label: 'Consent (GPP)' },
  { metric: 'requestBids.usp', label: 'Consent (US Privacy)' },
  { metric: 'requestBids.currency', label: 'Currency' },
  { metric: 'requestBids.priceFloors', label: 'Price Floors' },
  { metric: 'requestBids.userId', label: 'User Ids' },
  { metric: 'requestBids.rules', label: 'Rules' },
  { metric: 'requestBids.rtd', label: 'Real Time Data' },
  { metric: 'requestBids.fpd', label: 'First Party Data' },
  { metric: 'requestBids.dataController', label: 'Data Controller' },
  { metric: 'requestBids.validate', label: 'Ad Unit Validation' },
];

const USER_ID_MODULE_METRIC = /^userId\.mods\.(.+)\.(init|callback)$/;

const MIN_VISIBLE_DURATION = 0.5;

const toNumber = (value: number | number[] | undefined): number | null => (typeof value === 'number' && isFinite(value) ? value : null);

const getUserIdChildren = (metrics: SerializedMetrics): Omit<IPreAuctionChild, 'start' | 'end'>[] => {
  const byModule = new Map<string, { [stage: string]: number }>();
  Object.entries(metrics).forEach(([key, value]) => {
    const match = USER_ID_MODULE_METRIC.exec(key);
    const duration = toNumber(value);
    if (!match || duration === null) return;
    const [, name, stage] = match;
    byModule.set(name, { ...byModule.get(name), [stage]: duration });
  });
  return Array.from(byModule, ([label, stages]) => ({ label, duration: Object.values(stages).reduce((acc, value) => acc + value, 0), metrics: stages })).sort((a, b) => b.duration - a.duration);
};

const getRtdProviderNames = (config: Config): string[] => {
  const dataProviders = (config as { realTimeData?: { dataProviders?: { name?: string }[] } })?.realTimeData?.dataProviders;
  return (dataProviders || []).map(({ name }) => name).filter(Boolean);
};

const getChildren = (metric: string, metrics: SerializedMetrics): Omit<IPreAuctionChild, 'start' | 'end'>[] => (metric === 'requestBids.userId' ? getUserIdChildren(metrics) : []);

const getNotes = (metric: string, config: Config): string[] => (metric === 'requestBids.rtd' ? getRtdProviderNames(config) : []);

export const getPreAuctionTimeline = (auctionEndEvent: EventRecord<'auctionEnd'>, config: Config): IPreAuctionTimeline | null => {
  const { timestamp, auctionEnd } = auctionEndEvent?.args || ({} as EventRecord<'auctionEnd'>['args']);
  const metrics = (auctionEndEvent?.args as unknown as { metrics?: SerializedMetrics })?.metrics;
  if (!metrics || typeof metrics !== 'object' || !timestamp) return null;

  const phases = PRE_AUCTION_PHASES.map((phase) => ({ ...phase, duration: toNumber(metrics[phase.metric]) })).filter((phase) => phase.duration !== null);
  if (phases.length === 0) return null;

  const measured = phases.reduce((acc, { duration }) => acc + duration, 0);

  const total = toNumber(metrics['requestBids.total']);
  const start = Math.min(total !== null ? auctionEnd - total : timestamp - measured, timestamp - measured);

  let cursor = start;
  const rows: IPreAuctionRow[] = phases.map(({ metric, label, duration }) => {
    const row: IPreAuctionRow = {
      metric,
      label,
      start: cursor,
      end: cursor + duration,
      duration,
      variant: 'phase',
      children: getChildren(metric, metrics).map((child) => ({ ...child, start: Math.max(start, cursor + duration - child.duration), end: cursor + duration })),
      notes: getNotes(metric, config),
    };
    cursor = row.end;
    return row;
  });

  const unattributed = timestamp - cursor;
  if (unattributed > MIN_VISIBLE_DURATION) {
    rows.push({ metric: '', label: 'Unattributed', start: cursor, end: timestamp, duration: unattributed, variant: 'unattributed', children: [], notes: [] });
  }

  const makeRequests = toNumber(metrics['requestBids.makeRequests']);
  if (makeRequests !== null) {
    rows.push({ metric: 'requestBids.makeRequests', label: 'Build Bid Requests', start: timestamp, end: timestamp + makeRequests, duration: makeRequests, variant: 'afterAuctionStart', children: [], notes: [] });
  }

  return { start, duration: timestamp - start, rows, metrics };
};
