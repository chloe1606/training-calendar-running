import { describe, expect, it } from 'vitest';
import { formatDistance } from './distance';

describe('three significant figure distances', () => {
  it('rounds large and small values and retains significant trailing zeros', () => {
    for (const [value, expected] of [[3, '3.00'], [25, '25.0'], [42.1648128, '42.2'], [0.123456, '0.123'], [0.00123456, '0.00123'], [999.9, '1000'], [0, '0.00']] as const) {
      expect(formatDistance(value)).toBe(expected);
    }
  });
});
