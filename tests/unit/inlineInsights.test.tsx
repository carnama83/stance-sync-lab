import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import InlineInsights from '@/components/insights/InlineInsights';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: [
              { bucket: -2, cnt: 5 },
              { bucket: -1, cnt: 10 },
              { bucket: 0, cnt: 20 },
              { bucket: 1, cnt: 15 },
              { bucket: 2, cnt: 8 }
            ],
            error: null
          }))
        }))
      }))
    }))
  }
}));

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn()
}));

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />
}));

describe('InlineInsights', () => {
  const mockProfileData = {
    country_iso: 'US',
    region_id: 'region-123',
    city_id: 'city-456',
    county_id: 'county-789'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(
      <InlineInsights
        questionId="question-123"
        profileData={mockProfileData}
      />
    );

    expect(screen.getByText('Loading community insights...')).toBeInTheDocument();
  });

  it('fetches insights for all geographic scopes', async () => {
    render(
      <InlineInsights
        questionId="question-123"
        profileData={mockProfileData}
      />
    );

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('question_region_agg');
    });

    // Should query for city, region, and country scopes
    expect(screen.queryByText('Loading community insights...')).not.toBeInTheDocument();
  });

  it('displays insights for different geographic levels', async () => {
    render(
      <InlineInsights
        questionId="question-123"
        profileData={mockProfileData}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Your City')).toBeInTheDocument();
      expect(screen.getByText('Your Region')).toBeInTheDocument();
      expect(screen.getByText('Your Country')).toBeInTheDocument();
    });
  });

  it('shows confidence badges based on sample size', async () => {
    render(
      <InlineInsights
        questionId="question-123"
        profileData={mockProfileData}
      />
    );

    await waitFor(() => {
      // With sample size of 58 (5+10+20+15+8), should show 'medium' confidence
      expect(screen.getByText('medium confidence')).toBeInTheDocument();
    });
  });

  it('renders bar charts for each insight', async () => {
    render(
      <InlineInsights
        questionId="question-123"
        profileData={mockProfileData}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('bar-chart')).toHaveLength(3); // city, region, country
    });
  });

  it('handles empty profile data gracefully', () => {
    render(
      <InlineInsights
        questionId="question-123"
        profileData={undefined}
      />
    );

    expect(screen.queryByText('Community Insights')).not.toBeInTheDocument();
  });

  it('shows no data message when no insights available', async () => {
    // Mock empty response
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      }))
    } as any);

    render(
      <InlineInsights
        questionId="question-123"
        profileData={mockProfileData}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/No community data available yet/)).toBeInTheDocument();
    });
  });

  it('displays low confidence warning for small sample sizes', async () => {
    // Mock low sample size response
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: [
              { bucket: 0, cnt: 5 } // Small sample size
            ],
            error: null
          }))
        }))
      }))
    } as any);

    render(
      <InlineInsights
        questionId="question-123"
        profileData={mockProfileData}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Low sample size - interpret with caution/)).toBeInTheDocument();
    });
  });
});