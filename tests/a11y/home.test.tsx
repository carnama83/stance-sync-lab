import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '@/pages/marketing/HomePage';

expect.extend(toHaveNoViolations);

// Mock supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      }),
    },
  },
}));

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('HomePage Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = renderWithRouter(<HomePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading hierarchy', () => {
    renderWithRouter(<HomePage />);
    
    // Should have one h1
    const h1Elements = screen.getAllByRole('heading', { level: 1 });
    expect(h1Elements).toHaveLength(1);
  });

  it('should have accessible navigation', () => {
    renderWithRouter(<HomePage />);
    
    // Should have main navigation landmark
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('should have a skip to content link', () => {
    renderWithRouter(<HomePage />);
    
    // Look for skip link (might be visually hidden)
    const skipLink = document.querySelector('a[href="#main-content"]');
    expect(skipLink).toBeInTheDocument();
  });

  it('should have proper focus management', () => {
    renderWithRouter(<HomePage />);
    
    // All interactive elements should be focusable
    const interactiveElements = screen.getAllByRole('button');
    interactiveElements.forEach(element => {
      expect(element).not.toHaveAttribute('tabindex', '-1');
    });
  });

  it('should have sufficient color contrast', async () => {
    const { container } = renderWithRouter(<HomePage />);
    
    // axe will check color contrast automatically
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });
    
    expect(results).toHaveNoViolations();
  });
});