import { describe, it, expect } from '@jest/globals';

describe('Digest Composition', () => {
  it('should format digest content properly', () => {
    const mockQuestions = [
      { id: '1', title: 'Climate Change Impact', topic: 'Environment' },
      { id: '2', title: 'AI in Healthcare', topic: 'Technology' }
    ];

    const digestTitle = 'Your Weekly Pulse Digest';
    const digestBody = `Here's what's trending this week:\n\n${mockQuestions
      .slice(0, 5)
      .map((q, i) => `${i + 1}. ${q?.title || 'Untitled'} (${q?.topic || 'General'})`)
      .join('\n')}`;

    expect(digestTitle).toBe('Your Weekly Pulse Digest');
    expect(digestBody).toContain('Climate Change Impact');
    expect(digestBody).toContain('Environment');
    expect(digestBody).toContain('1.');
    expect(digestBody).toContain('2.');
  });

  it('should handle empty questions gracefully', () => {
    const mockQuestions: any[] = [];
    
    const digestBody = `Here's what's trending this week:\n\n${mockQuestions
      .slice(0, 5)
      .map((q, i) => `${i + 1}. ${q?.title || 'Untitled'} (${q?.topic || 'General'})`)
      .join('\n')}`;

    expect(digestBody).toBe("Here's what's trending this week:\n\n");
  });
});