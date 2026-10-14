import { describe, it, expect } from 'vitest';
import { distinct, parseWidthHeightPair, replaceLastToken, getSortValue, getWidthXHeightStringFromBid, getAutocompleteOptions, createQueryEngine } from './utils';

describe('autocomplete/utils', () => {
  describe('distinct', () => {
    it('removes duplicates and filters null/undefined', () => {
      expect(distinct(['a', 'b', 'a', null, undefined, 'c'])).toEqual(['a', 'b', 'c']);
    });
  });

  describe('parseWidthHeightPair', () => {
    it('parses valid width-height pairs', () => {
      expect(parseWidthHeightPair('300x250')).toEqual({ w: 300, h: 250 });
      expect(parseWidthHeightPair('728 x 90')).toEqual({ w: 728, h: 90 });
    });

    it('returns null for invalid inputs', () => {
      expect(parseWidthHeightPair('invalid')).toBeNull();
      expect(parseWidthHeightPair('')).toBeNull();
    });
  });

  describe('replaceLastToken', () => {
    it('replaces last token in string or handles empty string', () => {
      expect(replaceLastToken('cpm:1 bidder', 'appnexus')).toBe('cpm:1 appnexus');
      expect(replaceLastToken('', 'test')).toBe('test');
    });
  });

  describe('getSortValue', () => {
    it('returns area for size key with numeric or parsed size string', () => {
      expect(getSortValue({ width: 300, height: 250 }, 'size')).toBe(75000);
      expect(getSortValue({ size: '300x250' }, 'size')).toBe(75000);
      expect(getSortValue({ size: 'invalid' }, 'size')).toBe(Number.NEGATIVE_INFINITY);
    });

    it('returns numeric cpm for cpm key including string formats', () => {
      expect(getSortValue({ cpm: 2.5 }, 'cpm')).toBe(2.5);
      expect(getSortValue({ cpm: '1,50' }, 'cpm')).toBe(1.5);
      expect(getSortValue({ cpm: '$3.25' }, 'cpm')).toBe(3.25);
      expect(getSortValue({ cpm: 'invalid' }, 'cpm')).toBe(Number.NEGATIVE_INFINITY);
      expect(getSortValue({ cpm: NaN }, 'cpm')).toBe(Number.NEGATIVE_INFINITY);
    });

    it('returns lowercase string for other keys', () => {
      expect(getSortValue({ bidder: 'AppNexus' }, 'bidder')).toBe('appnexus');
      expect(getSortValue({}, 'bidder')).toBe('');
    });
  });

  describe('getWidthXHeightStringFromBid', () => {
    it('returns size property if exists', () => {
      expect(getWidthXHeightStringFromBid({ size: '300x250' } as any)).toBe('300x250');
    });

    it('builds from width and height properties', () => {
      expect(getWidthXHeightStringFromBid({ width: 728, height: 90 } as any)).toBe('728x90');
    });

    it('returns empty string if neither size nor width/height exist', () => {
      expect(getWidthXHeightStringFromBid({} as any)).toBe('');
    });
  });

  describe('getAutocompleteOptions', () => {
    it('returns key options for empty query or operator query', () => {
      const keys = ['bidder', 'adunit'];
      expect(getAutocompleteOptions('', keys)).toContain('bidder');
      expect(getAutocompleteOptions('bidder:rubicon AND', keys)).toContain('bidder');
      expect(getAutocompleteOptions('bidder:rubicon OR', keys)).toContain('adunit');
    });

    it('filters keys matching query prefix when no colon is typed', () => {
      const keys = ['bidder', 'adunit', 'cpm'];
      const res = getAutocompleteOptions('bi', keys);
      expect(res).toEqual(['bidder']);
    });

    it('filters options matching key prefix when colon is typed', () => {
      const keys = ['bidder', 'size'];
      const options = ['bidder:rubicon', 'bidder:criteo', 'size:300x250'];

      const res = getAutocompleteOptions('bidder:cri', keys, options);
      expect(res).toEqual(['criteo']);
    });

    it('returns empty array if no options provided for key with colon', () => {
      expect(getAutocompleteOptions('bidder:', ['bidder'])).toEqual([]);
    });
  });

  describe('createQueryEngine', () => {
    const engine = createQueryEngine<{ name: string; cpm: number; size?: string }>({
      name: (r) => r.name,
      cpm: (r) => r.cpm,
      size: (r) => r.size,
    });

    it('matches text search across all fields', () => {
      const predicate = engine.runQuery('appnexus');
      expect(predicate({ name: 'appnexus', cpm: 1.0 })).toBe(true);
      expect(predicate({ name: 'rubicon', cpm: 2.0 })).toBe(false);
    });

    it('matches key:value filter', () => {
      const predicate = engine.runQuery('name:rubicon');
      expect(predicate({ name: 'rubicon', cpm: 1.0 })).toBe(true);
      expect(predicate({ name: 'appnexus', cpm: 1.0 })).toBe(false);
    });

    it('supports all numeric operators (>=, <, <=, =, ~=)', () => {
      expect(engine.runQuery('cpm>=1.5')({ name: 'a', cpm: 1.5 })).toBe(true);
      expect(engine.runQuery('cpm<1.5')({ name: 'a', cpm: 1.0 })).toBe(true);
      expect(engine.runQuery('cpm<=1.5')({ name: 'a', cpm: 1.5 })).toBe(true);
      expect(engine.runQuery('cpm=1.5')({ name: 'a', cpm: 1.5 })).toBe(true);
      expect(engine.runQuery('cpm~=1')({ name: 'a', cpm: 1.5 })).toBe(true);
      expect(engine.runQuery('cpm>2.0')({ name: 'a', cpm: 1.5 })).toBe(false);
      expect(engine.runQuery('cpm=invalid')({ name: 'a', cpm: 1.5 })).toBe(false);
    });

    it('supports string comparison operators', () => {
      expect(engine.runQuery('name:app')({ name: 'appnexus', cpm: 1 })).toBe(true);
      expect(engine.runQuery('name~=app')({ name: 'appnexus', cpm: 1 })).toBe(true);
      expect(engine.runQuery('name>a')({ name: 'b', cpm: 1 })).toBe(true);
      expect(engine.runQuery('name>=b')({ name: 'b', cpm: 1 })).toBe(true);
      expect(engine.runQuery('name<c')({ name: 'b', cpm: 1 })).toBe(true);
      expect(engine.runQuery('name<=b')({ name: 'b', cpm: 1 })).toBe(true);
    });

    it('supports custom size comparators', () => {
      expect(engine.runQuery('size:300x250')({ name: 'a', cpm: 1, size: '300x250' })).toBe(true);
      expect(engine.runQuery('size>300x200')({ name: 'a', cpm: 1, size: '300x250' })).toBe(true);
      expect(engine.runQuery('size>=300x250')({ name: 'a', cpm: 1, size: '300x250' })).toBe(true);
      expect(engine.runQuery('size<728x90')({ name: 'a', cpm: 1, size: '300x250' })).toBe(false);
      expect(engine.runQuery('size<=300x250')({ name: 'a', cpm: 1, size: '300x250' })).toBe(true);
      expect(engine.runQuery('size:invalid')({ name: 'a', cpm: 1, size: '300x250' })).toBe(false);
    });

    it('supports OR logic between queries', () => {
      const predicate = engine.runQuery('name:rubicon OR name:criteo');
      expect(predicate({ name: 'rubicon', cpm: 1 })).toBe(true);
      expect(predicate({ name: 'criteo', cpm: 1 })).toBe(true);
      expect(predicate({ name: 'appnexus', cpm: 1 })).toBe(false);
    });

    it('supports quoted queries and case-insensitive AND separation', () => {
      const predicate = engine.runQuery('name:"app nexus" AND "exact match"');
      expect(predicate({ name: 'app nexus exact match', cpm: 1 })).toBe(true);
      expect(predicate({ name: 'other', cpm: 1 })).toBe(false);
    });

    it('handles empty query string', () => {
      expect(engine.runQuery('')({ name: 'a', cpm: 1 })).toBe(true);
    });
  });
});
