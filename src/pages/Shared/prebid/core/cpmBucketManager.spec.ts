import { describe, it, expect } from 'vitest';
import { getPriceBucketString, isValidPriceConfig } from './cpmBucketManager';

describe('cpmBucketManager', () => {
  describe('isValidPriceConfig', () => {
    it('returns false for empty config', () => {
      expect(isValidPriceConfig({} as any)).toBe(false);
      expect(isValidPriceConfig('[]' as any)).toBe(false);
    });
    it('returns false when buckets missing', () => {
      expect(isValidPriceConfig({ something: true } as any)).toBe(false);
    });
    it('returns false when bucket lacks max', () => {
      expect(isValidPriceConfig({ buckets: [{ increment: 0.1 }] } as any)).toBe(false);
    });
    it('returns false when bucket lacks increment', () => {
      expect(isValidPriceConfig({ buckets: [{ max: 20 }] } as any)).toBe(false);
    });
    it('returns true for valid config', () => {
      expect(isValidPriceConfig({ buckets: [{ max: 20, increment: 0.1 }] } as any)).toBe(true);
    });
  });

  describe('getPriceBucketString', () => {
    it('returns correct buckets for $1.25', () => {
      const result = getPriceBucketString('1.25', { buckets: [{ max: 20, increment: 0.01 }] } as any);
      expect(result.low).toBe('1.00');
      expect(result.med).toBe('1.20');
      expect(result.high).toBe('1.25');
      expect(result.auto).toBe('1.25');
      expect(result.dense).toBe('1.25');
      expect(result.custom).toBe('1.25');
    });

    it('returns correct buckets for $5.50', () => {
      const result = getPriceBucketString('5.50', { buckets: [{ max: 20, increment: 0.5 }] } as any);
      expect(result.low).toBe('5.00');
      expect(result.med).toBe('5.50');
      expect(result.auto).toBe('5.50');
      expect(result.dense).toBe('5.50');
    });

    it('caps at max for high CPMs', () => {
      const result = getPriceBucketString('25.00', { buckets: [{ max: 20, increment: 0.01 }] } as any);
      expect(result.high).toBe('20.00');
    });

    it('supports custom precision and granularityMultiplier', () => {
      const customConfig: any = {
        buckets: [
          { max: 5, increment: 0.25, precision: 3 },
          { max: 15, increment: 1.0, precision: 1 },
        ],
      };
      const result = getPriceBucketString('2.30', customConfig, 1.2);
      expect(result.custom).toBe('2.100');

      const overCap = getPriceBucketString('30.00', customConfig, 1.0);
      expect(overCap.custom).toBe('15.0');
    });

    it('handles invalid customConfig gracefully', () => {
      const result = getPriceBucketString('2.50', {} as any);
      expect(result.custom).toBe('');
    });

    it('handles throwing or invalid cpmRoundingFunction by falling back to Math.floor', () => {
      const throwingConfig: any = {
        cpmRoundingFunction: () => {
          throw new Error('Custom rounding crash');
        },
        buckets: [{ max: 10, increment: 0.5 }],
      };
      const result = getPriceBucketString('3.75', throwingConfig);
      expect(result.custom).toBe('3.50');

      const nonNumberConfig: any = {
        cpmRoundingFunction: () => 'invalid-return-value' as any,
        buckets: [{ max: 10, increment: 0.5 }],
      };
      const result2 = getPriceBucketString('3.75', nonNumberConfig);
      expect(result2.custom).toBe('3.50');
    });
  });
});
