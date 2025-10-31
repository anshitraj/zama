import { describe, it, expect, vi, beforeEach } from 'vitest';
import { coprocService } from '../services/coprocService';

describe('CoprocessorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should aggregate ciphertexts via coprocessor', async () => {
    const mockCids = ['QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o1', 'QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o2'];
    
    const result = await coprocService.aggregate(mockCids, 'sum');
    
    expect(result.outputCiphertext).toBeDefined();
    expect(result.meta.itemsCount).toBe(mockCids.length);
    expect(result.meta.op).toBe('sum');
  });

  it('should handle different operations', async () => {
    const mockCids = ['QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o1'];
    
    const operations = ['sum', 'max', 'min', 'avg'];
    
    for (const op of operations) {
      const result = await coprocService.aggregate(mockCids, op);
      expect(result.meta.op).toBe(op);
    }
  });

  it('should perform health check', async () => {
    const health = await coprocService.healthCheck();
    expect(health.success).toBe(true);
  });
});

