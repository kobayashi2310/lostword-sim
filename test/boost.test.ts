import { describe, it, expect } from 'vitest';
import { getActiveCountFromBoost, validateBoostPattern } from '../types';

describe('Boost Logic Verification', () => {
  describe('getActiveCountFromBoost', () => {
    it('should return 1 for 0b regardless of pattern', () => {
      expect(getActiveCountFromBoost('1-3-1', 0)).toBe(1);
      expect(getActiveCountFromBoost('2-2-1', 0)).toBe(1);
    });

    it('should calculate active count for 1-3-1 pattern', () => {
      expect(getActiveCountFromBoost('1-3-1', 1)).toBe(2); // 1 + 1
      expect(getActiveCountFromBoost('1-3-1', 2)).toBe(5); // 2 + 3
      expect(getActiveCountFromBoost('1-3-1', 3)).toBe(6); // 5 + 1
    });

    it('should calculate active count for 1-1-3 pattern', () => {
      expect(getActiveCountFromBoost('1-1-3', 1)).toBe(2); // 1 + 1
      expect(getActiveCountFromBoost('1-1-3', 2)).toBe(3); // 2 + 1
      expect(getActiveCountFromBoost('1-1-3', 3)).toBe(6); // 3 + 3
    });

    it('should handle invalid pattern string gracefully by fallback', () => {
      // should return level + 1 if split fails
      expect(getActiveCountFromBoost('invalid', 1)).toBe(2);
      expect(getActiveCountFromBoost('1-2', 2)).toBe(3);
    });
  });

  describe('validateBoostPattern', () => {
    it('should pass for valid pattern "1-3-1"', () => {
      expect(validateBoostPattern('1-3-1')).toBeNull();
    });

    it('should fail if sum is not 5', () => {
      expect(validateBoostPattern('1-1-1')).toContain('合計は 5 である必要があります');
      expect(validateBoostPattern('2-2-2')).toContain('合計は 5 である必要があります');
    });

    it('should fail for non-numeric input', () => {
      expect(validateBoostPattern('a-b-c')).toContain('形式で入力してください');
    });

    it('should fail for wrong format', () => {
      expect(validateBoostPattern('1,2,2')).toContain('形式で入力してください');
      expect(validateBoostPattern('1-2')).toContain('形式で入力してください');
    });
  });
});
