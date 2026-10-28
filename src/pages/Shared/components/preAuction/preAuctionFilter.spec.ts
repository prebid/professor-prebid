import { describe, it, expect } from 'vitest';
import { createQueryEngine } from '../autocomplete/utils';
import { PROVIDER_FIELD_MAP } from './PreAuctionComponent';
import { IProviderDiagnostic } from './providerDiagnostics';
import { verdictLabel } from './labels';

const engine = createQueryEngine<IProviderDiagnostic>(PROVIDER_FIELD_MAP);

const provider = (name: string, type: string, awaited: boolean, verdict: string, host: string) => ({ name, type, awaited, auctions: [{ verdict }], hosts: [host] } as unknown as IProviderDiagnostic);

const rows = [provider('permutiveRtd', 'rtd', false, 'landed', 'permutive.com'), provider('criteoId', 'identity', true, 'never', 'criteo.com'), provider('adagio', 'rtd', false, 'landed', '4dex.io')];

const run = (query: string) => rows.filter(engine.runQuery(query)).map(({ name }) => name);

describe('pre-auction provider filter', () => {
  it('shows everything when the query is empty', () => {
    expect(run('')).toHaveLength(3);
  });

  it('matches a bare word against every mapped field', () => {
    expect(run('criteo')).toEqual(['criteoId']);
    expect(run('4dex.io')).toEqual(['adagio']);
  });

  it('combines several providers with OR', () => {
    expect(run('permutive OR criteo')).toEqual(['permutiveRtd', 'criteoId']);
    expect(run('provider:permutive OR provider:criteo')).toEqual(['permutiveRtd', 'criteoId']);
  });

  it('filters by type, verdict and awaited', () => {
    expect(run('type:rtd')).toEqual(['permutiveRtd', 'adagio']);
    expect(run('verdict:never')).toEqual(['criteoId']);
    expect(run('awaited:false')).toEqual(['permutiveRtd', 'adagio']);
  });

  it('narrows with AND', () => {
    expect(run('type:rtd AND verdict:landed')).toEqual(['permutiveRtd', 'adagio']);
    expect(run('type:rtd AND verdict:never')).toEqual([]);
  });
});

describe('verdict labels', () => {
  it('says what is actually missing, per module type', () => {
    expect(verdictLabel('never', 'identity')).toBe('no ID');
    expect(verdictLabel('never', 'rtd')).toBe('no RTD');
  });

  it('covers both kinds at once in the legend, which has no provider to key off', () => {
    expect(verdictLabel('never')).toBe('no ID / no RTD');
  });

  it('leaves the type-neutral verdicts alone', () => {
    expect(verdictLabel('landed', 'rtd')).toBe('landed');
    expect(verdictLabel('late', 'identity')).toBe('too late');
    expect(verdictLabel('unknown')).toBe('unknown');
  });
});
