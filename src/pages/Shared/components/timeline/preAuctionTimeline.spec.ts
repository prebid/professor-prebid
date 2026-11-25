import { describe, it, expect } from 'vitest';
import { getPreAuctionTimeline, SerializedMetrics } from './preAuctionTimeline';
import { Config, EventRecord } from 'prebid.js/types.d.ts';

const TIMESTAMP = 1_700_000_000_000;
const AUCTION_END = TIMESTAMP + 1000;

const makeAuctionEndEvent = (metrics?: SerializedMetrics) => ({ eventType: 'auctionEnd', args: { timestamp: TIMESTAMP, auctionEnd: AUCTION_END, metrics } } as unknown as EventRecord<'auctionEnd'>);

const EMPTY_CONFIG = {} as Config;

describe('getPreAuctionTimeline', () => {
  it('returns null when the auction carries no metrics', () => {
    expect(getPreAuctionTimeline(makeAuctionEndEvent(), EMPTY_CONFIG)).toBeNull();
  });

  it('returns null when none of the known pre-auction phases were measured', () => {
    expect(getPreAuctionTimeline(makeAuctionEndEvent({ 'requestBids.total': 1200 }), EMPTY_CONFIG)).toBeNull();
  });

  it('derives the pre-auction start from requestBids.total', () => {
    const timeline = getPreAuctionTimeline(makeAuctionEndEvent({ 'requestBids.total': 1200, 'requestBids.rtd': 100 }), EMPTY_CONFIG);
    expect(timeline.start).toBe(AUCTION_END - 1200);
    expect(timeline.duration).toBe(200);
  });

  it('lays the measured phases out back to back in hook order', () => {
    const timeline = getPreAuctionTimeline(makeAuctionEndEvent({ 'requestBids.total': 1200, 'requestBids.gdpr': 10, 'requestBids.rtd': 100, 'requestBids.userId': 50 }), EMPTY_CONFIG);
    expect(timeline.rows.map(({ label, start, end }) => [label, start - timeline.start, end - timeline.start])).toEqual([
      ['Consent (TCF)', 0, 10],
      ['User Ids', 10, 60],
      ['Real Time Data', 60, 160],
      ['Unattributed', 160, 200],
    ]);
  });

  it('falls back to the sum of the measured phases when requestBids.total is missing', () => {
    const timeline = getPreAuctionTimeline(makeAuctionEndEvent({ 'requestBids.rtd': 100, 'requestBids.fpd': 20 }), EMPTY_CONFIG);
    expect(timeline.duration).toBe(120);
    expect(timeline.rows.map(({ label }) => label)).toEqual(['Real Time Data', 'First Party Data']);
  });

  it('never starts later than the measured phases require', () => {
    const timeline = getPreAuctionTimeline(makeAuctionEndEvent({ 'requestBids.total': 1000, 'requestBids.rtd': 300 }), EMPTY_CONFIG);
    expect(timeline.start).toBe(TIMESTAMP - 300);
  });

  it('places build bid requests after the auction start', () => {
    const timeline = getPreAuctionTimeline(makeAuctionEndEvent({ 'requestBids.total': 1200, 'requestBids.rtd': 200, 'requestBids.makeRequests': 15 }), EMPTY_CONFIG);
    const makeRequests = timeline.rows.find(({ metric }) => metric === 'requestBids.makeRequests');
    expect(makeRequests).toMatchObject({ start: TIMESTAMP, end: TIMESTAMP + 15, variant: 'afterAuctionStart' });
  });

  it('breaks the user id phase down per module, right aligned to the end of the phase', () => {
    const timeline = getPreAuctionTimeline(
      makeAuctionEndEvent({
        'requestBids.total': 1200,
        'requestBids.userId': 200,
        'userId.mods.id5Id.init': 30,
        'userId.mods.id5Id.callback': 90,
        'userId.mods.sharedId.init': 40,
        'userId.mod.init': [30, 40],
      }),
      EMPTY_CONFIG
    );
    const userIds = timeline.rows.find(({ metric }) => metric === 'requestBids.userId');
    expect(userIds.children).toEqual([
      { label: 'id5Id', duration: 120, start: userIds.end - 120, end: userIds.end, metrics: { init: 30, callback: 90 } },
      { label: 'sharedId', duration: 40, start: userIds.end - 40, end: userIds.end, metrics: { init: 40 } },
    ]);
  });

  it('clamps user id module bars to the start of the timeline', () => {
    const timeline = getPreAuctionTimeline(makeAuctionEndEvent({ 'requestBids.total': 1010, 'requestBids.userId': 5, 'userId.mods.id5Id.init': 900 }), EMPTY_CONFIG);
    const userIds = timeline.rows.find(({ metric }) => metric === 'requestBids.userId');
    expect(userIds.children[0].start).toBe(timeline.start);
  });

  it('names the configured real time data providers', () => {
    const config = { realTimeData: { dataProviders: [{ name: 'weborama' }, { name: 'permutive' }] } } as unknown as Config;
    const timeline = getPreAuctionTimeline(makeAuctionEndEvent({ 'requestBids.total': 1200, 'requestBids.rtd': 100 }), config);
    expect(timeline.rows.find(({ metric }) => metric === 'requestBids.rtd').notes).toEqual(['weborama', 'permutive']);
  });

  it('ignores grouped metrics that are not plain durations', () => {
    const timeline = getPreAuctionTimeline(makeAuctionEndEvent({ 'requestBids.total': 1200, 'requestBids.rtd': [10, 20] as unknown as number, 'requestBids.fpd': 30 }), EMPTY_CONFIG);
    expect(timeline.rows.map(({ label }) => label)).toEqual(['First Party Data', 'Unattributed']);
  });
});
