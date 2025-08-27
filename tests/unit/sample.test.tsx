import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from '@/pages/marketing/HomePage';

describe('HomePage', () => {
  it('renders the main heading', () => {
    render(<HomePage />);
    expect(screen.getByText('Website V2')).toBeInTheDocument();
  });

  it('displays the description', () => {
    render(<HomePage />);
    expect(screen.getByText(/A social media platform for capturing public sentiment/)).toBeInTheDocument();
  });

  it('shows the three main feature cards', () => {
    render(<HomePage />);
    expect(screen.getByText('News Ingestion')).toBeInTheDocument();
    expect(screen.getByText('Stance Capture')).toBeInTheDocument();
    expect(screen.getByText('Community Pulse')).toBeInTheDocument();
  });
});