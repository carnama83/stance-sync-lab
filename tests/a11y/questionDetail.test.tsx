import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import QuestionDetail from '@/pages/question/QuestionDetail';

expect.extend(toHaveNoViolations);

// Mock router params
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: 'test-question-id' }),
  useNavigate: () => jest.fn(),
}));

// Mock supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              id: 'test-question-id',
              title: 'Test Question',
              summary: 'Test summary',
              topic: 'Politics',
            }
          })
        }))
      }))
    })),
  },
}));

// Mock stance API
jest.mock('@/features/stance/api', () => ({
  getUserStance: jest.fn().mockResolvedValue(null),
  upsertStance: jest.fn().mockResolvedValue({}),
}));

// Mock other dependencies
jest.mock('@/lib/api/comments', () => ({
  listComments: jest.fn().mockResolvedValue([]),
  createComment: jest.fn(),
  toggleUpvote: jest.fn(),
  fileReport: jest.fn(),
  checkToxicity: jest.fn().mockReturnValue({ isToxic: false, score: 0 }),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('QuestionDetail Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = renderWithRouter(<QuestionDetail />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Test Question')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper form labels', async () => {
    renderWithRouter(<QuestionDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Question')).toBeInTheDocument();
    });

    // Stance slider should have a label
    expect(screen.getByText(/Your Position:/)).toBeInTheDocument();
    
    // Textareas should have labels
    expect(screen.getByLabelText(/Rationale/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Supporting Links/)).toBeInTheDocument();
  });

  it('should have accessible tabs for insights', async () => {
    renderWithRouter(<QuestionDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Question')).toBeInTheDocument();
    });

    // Should have tablist role
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
    
    // Tabs should have proper aria attributes
    const tabs = screen.getAllByRole('tab');
    tabs.forEach(tab => {
      expect(tab).toHaveAttribute('aria-selected');
    });
  });

  it('should have live regions for dynamic content', async () => {
    renderWithRouter(<QuestionDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Question')).toBeInTheDocument();
    });

    // Look for aria-live regions
    const liveRegions = container.querySelectorAll('[aria-live]');
    expect(liveRegions.length).toBeGreaterThan(0);
  });

  it('should have accessible buttons', async () => {
    renderWithRouter(<QuestionDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Question')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      // Buttons should have accessible names
      expect(button.textContent?.trim() || button.getAttribute('aria-label')).toBeTruthy();
    });
  });
});