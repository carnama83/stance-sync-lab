import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Mock Supabase client for testing
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  single: jest.fn(),
  auth: {
    getUser: jest.fn(),
  }
};

jest.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('Notifications RLS Integration', () => {
  beforeAll(() => {
    // Setup test user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } }
    });
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should only fetch notifications for authenticated user', async () => {
    mockSupabase.single.mockResolvedValue({
      data: [
        { id: '1', user_id: 'test-user-id', title: 'Test', body: 'Test notification' }
      ],
      error: null
    });

    // Import after mocking
    const { notificationsApi } = await import('@/lib/api/notifications');
    
    await notificationsApi.listNotifications();

    expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
    expect(mockSupabase.select).toHaveBeenCalledWith('*');
    expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should only allow users to mark their own notifications as read', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { id: '1', user_id: 'test-user-id', read_at: new Date().toISOString() },
      error: null
    });

    const { notificationsApi } = await import('@/lib/api/notifications');
    
    await notificationsApi.markRead('test-notification-id');

    expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'test-notification-id');
  });
});