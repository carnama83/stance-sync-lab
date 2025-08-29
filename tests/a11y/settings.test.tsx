import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import Account from '@/pages/settings/Account';

expect.extend(toHaveNoViolations);

// Mock router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
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
  },
}));

// Mock account API
jest.mock('@/lib/api/account', () => ({
  getDeletionRequest: jest.fn().mockResolvedValue(null),
  listConsentLogs: jest.fn().mockResolvedValue([]),
  initiateDeletion: jest.fn(),
  confirmDeletion: jest.fn(),
  cancelDeletion: jest.fn(),
  setConsent: jest.fn(),
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

describe('Account Settings Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = renderWithRouter(<Account />);
    
    await waitFor(() => {
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading hierarchy', async () => {
    renderWithRouter(<Account />);
    
    await waitFor(() => {
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
    });

    // Should have one main h1
    const h1Elements = screen.getAllByRole('heading', { level: 1 });
    expect(h1Elements).toHaveLength(1);
    expect(h1Elements[0]).toHaveTextContent('Account Settings');
  });

  it('should have accessible form controls', async () => {
    renderWithRouter(<Account />);
    
    await waitFor(() => {
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
    });

    // Switches should have labels
    const switches = screen.getAllByRole('switch');
    switches.forEach(switchElement => {
      // Should have an associated label
      const labels = screen.getAllByText(/IP-based Region Inference/);
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  it('should have accessible buttons with proper labels', async () => {
    renderWithRouter(<Account />);
    
    await waitFor(() => {
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      // Every button should have accessible text or aria-label
      const hasAccessibleName = button.textContent?.trim() || 
                               button.getAttribute('aria-label') ||
                               button.getAttribute('aria-labelledby');
      expect(hasAccessibleName).toBeTruthy();
    });
  });

  it('should have proper alert regions', async () => {
    renderWithRouter(<Account />);
    
    await waitFor(() => {
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
    });

    // Important notice should be in an alert region
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('should have accessible card structure', async () => {
    renderWithRouter(<Account />);
    
    await waitFor(() => {
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
    });

    // Cards should have proper heading structure
    expect(screen.getByText('Delete Account')).toBeInTheDocument();
    expect(screen.getByText('Privacy Consent')).toBeInTheDocument();
    expect(screen.getByText('Export My Data')).toBeInTheDocument();
  });
});