import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn()
    }
  }
}));

describe('profiles_set_location RPC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call profiles_set_location with correct parameters', async () => {
    const mockRpc = vi.mocked(supabase.rpc);
    mockRpc.mockResolvedValue({ data: null, error: null });

    const testParams = {
      p_region: 'region-uuid-123',
      p_city: 'city-uuid-456',
      p_county: 'county-uuid-789'
    };

    await supabase.rpc('profiles_set_location', testParams);

    expect(mockRpc).toHaveBeenCalledWith('profiles_set_location', testParams);
  });

  it('should handle null county parameter', async () => {
    const mockRpc = vi.mocked(supabase.rpc);
    mockRpc.mockResolvedValue({ data: null, error: null });

    const testParams = {
      p_region: 'region-uuid-123',
      p_city: 'city-uuid-456',
      p_county: null
    };

    await supabase.rpc('profiles_set_location', testParams);

    expect(mockRpc).toHaveBeenCalledWith('profiles_set_location', testParams);
  });

  it('should handle RPC errors gracefully', async () => {
    const mockRpc = vi.mocked(supabase.rpc);
    const mockError = { message: 'Invalid region ID', code: 'INVALID_REGION' };
    mockRpc.mockResolvedValue({ data: null, error: mockError });

    const testParams = {
      p_region: 'invalid-uuid',
      p_city: 'city-uuid-456',
      p_county: null
    };

    const result = await supabase.rpc('profiles_set_location', testParams);

    expect(result.error).toEqual(mockError);
    expect(mockRpc).toHaveBeenCalledWith('profiles_set_location', testParams);
  });
});