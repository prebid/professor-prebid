import { describe, it, expect } from 'vitest';
import { verdictLabel, formatMs,  VERDICT_COLOR, VERDICT_HELP, ATTRIBUTION_LABEL, ATTRIBUTION_HELP } from './labels';

describe('preAuction labels', () => {
  it('formats verdict labels with and without provider type', () => {
    expect(verdictLabel('landed', 'rtd')).toBe('landed');
    expect(verdictLabel('never', 'identity')).toBe('no ID');
    expect(verdictLabel('never', 'rtd')).toBe('no RTD');
    expect(verdictLabel('never')).toBe('no ID / no RTD');
    expect(verdictLabel('late')).toBe('too late');
  });

  it('formats milliseconds across units (ms, s, min)', () => {
    expect(formatMs(500)).toBe('500ms');
    expect(formatMs(2500)).toBe('2.5s');
    expect(formatMs(120000)).toBe('2.0min');
    expect(formatMs(-500)).toBe('-500ms');
    expect(formatMs(-2500)).toBe('-2.5s');
    expect(formatMs(-120000)).toBe('-2.0min');
  });

  it('exposes help and color maps', () => {
    expect(VERDICT_COLOR.landed).toBe('success');
    expect(VERDICT_COLOR.late).toBe('error');
    expect(VERDICT_HELP.landed).toBeTruthy();
    expect(ATTRIBUTION_LABEL.endpoint).toBe('known endpoint');
    expect(ATTRIBUTION_HELP.host).toBeTruthy();
  });
});
