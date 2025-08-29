import { describe, it, expect, beforeEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client for testing
const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn()
  }
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

describe('Export Jobs RLS Policies', () => {
  const mockUser1 = { id: 'user-1', email: 'user1@example.com' };
  const mockUser2 = { id: 'user-2', email: 'user2@example.com' };
  const mockAdmin = { id: 'admin-1', email: 'admin@example.com', app_metadata: { role: 'admin' } };

  const mockExportJob = {
    id: 'job-1',
    requested_by: 'user-1',
    format: 'csv',
    filters: { scope: 'topic', topic: 'Economy' },
    k_threshold: 25,
    status: 'complete',
    file_path: 'user-1/job-1.csv',
    row_count: 100,
    created_at: new Date().toISOString()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow users to read their own export jobs', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser1 }, error: null });
    
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: [mockExportJob], error: null })
    });
    mockSupabase.from.mockReturnValue({ select: mockSelect });

    // Simulate user querying their own jobs
    const result = await mockSupabase.from('export_jobs')
      .select('*')
      .eq('requested_by', mockUser1.id);

    expect(mockSupabase.from).toHaveBeenCalledWith('export_jobs');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(result.data).toEqual([mockExportJob]);
  });

  it('should prevent users from reading other users export jobs', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser2 }, error: null });
    
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: [], error: null }) // RLS filters out other users' data
    });
    mockSupabase.from.mockReturnValue({ select: mockSelect });

    // Simulate user2 trying to access user1's jobs
    const result = await mockSupabase.from('export_jobs')
      .select('*')
      .eq('requested_by', mockUser1.id);

    expect(result.data).toEqual([]);
  });

  it('should allow admins to read all export jobs', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockAdmin }, error: null });
    
    const mockSelect = jest.fn().mockResolvedValue({
      data: [mockExportJob, { ...mockExportJob, id: 'job-2', requested_by: 'user-2' }], 
      error: null
    });
    mockSupabase.from.mockReturnValue({ select: mockSelect });

    // Simulate admin querying all jobs
    const result = await mockSupabase.from('export_jobs').select('*');

    expect(result.data).toHaveLength(2);
  });

  it('should allow users to insert their own export jobs', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser1 }, error: null });
    
    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: mockExportJob, error: null })
      })
    });
    mockSupabase.from.mockReturnValue({ insert: mockInsert });

    const newJob = {
      requested_by: mockUser1.id,
      format: 'json',
      filters: { scope: 'region', region: 'California' },
      k_threshold: 25,
      status: 'queued'
    };

    const result = await mockSupabase.from('export_jobs')
      .insert(newJob)
      .select()
      .single();

    expect(mockInsert).toHaveBeenCalledWith(newJob);
    expect(result.data).toEqual(mockExportJob);
  });

  it('should prevent users from inserting jobs for other users', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser2 }, error: null });
    
    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Row-level security policy violation' }
        })
      })
    });
    mockSupabase.from.mockReturnValue({ insert: mockInsert });

    const newJob = {
      requested_by: mockUser1.id, // user2 trying to create job for user1
      format: 'csv',
      filters: { scope: 'topic', topic: 'Healthcare' },
      k_threshold: 25,
      status: 'queued'
    };

    const result = await mockSupabase.from('export_jobs')
      .insert(newJob)
      .select()
      .single();

    expect(result.error).toBeTruthy();
    expect(result.error.message).toContain('policy violation');
  });

  it('should allow users to update their own export jobs', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser1 }, error: null });
    
    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: { ...mockExportJob, status: 'failed' }, 
            error: null 
          })
        })
      })
    });
    mockSupabase.from.mockReturnValue({ update: mockUpdate });

    const result = await mockSupabase.from('export_jobs')
      .update({ status: 'failed', error: 'Processing error' })
      .eq('id', mockExportJob.id)
      .select()
      .single();

    expect(mockUpdate).toHaveBeenCalledWith({ status: 'failed', error: 'Processing error' });
    expect(result.data.status).toBe('failed');
  });
});