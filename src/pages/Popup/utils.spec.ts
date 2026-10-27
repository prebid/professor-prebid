import { describe, it, expect } from 'vitest';
import { firstDifferent } from './utils';

describe('Popup utils', () => {
  describe('firstDifferent', () => {
    it('returns first item not in excludes', () => {
      expect(firstDifferent(['a', 'b', 'c'], ['a'])).toBe('b');
    });

    it('returns first item when no excludes match', () => {
      expect(firstDifferent(['x', 'y'], ['z'])).toBe('x');
    });

    it('returns undefined when all items are excluded', () => {
      expect(firstDifferent(['a', 'b'], ['a', 'b'])).toBeUndefined();
    });

    it('returns first item when excludes is empty array', () => {
      expect(firstDifferent(['a', 'b'], [])).toBe('a');
    });

    it('handles undefined or null excludes parameter gracefully', () => {
      expect(firstDifferent(['a', 'b'], undefined as any)).toBe('a');
      expect(firstDifferent(['a', 'b'], null as any)).toBe('a');
    });

    it('handles empty input array', () => {
      expect(firstDifferent([], ['a'])).toBeUndefined();
    });

    it('returns first item when excludes contains elements not present in input', () => {
      expect(firstDifferent(['item1', 'item2'], ['other'])).toBe('item1');
    });
  });
});
