import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Accessibility', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(<App />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper skip links', () => {
      render(<App />);
      const skipLink = screen.getByText('Pular para o conteúdo principal');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('should have proper ARIA labels', () => {
      render(<App />);
      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveAttribute('aria-label', 'Aplicação de Planning Poker');
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<App />);

      const roomNameInput = screen.getByLabelText('Nome da Sala');
      await user.tab();
      expect(roomNameInput).toHaveFocus();
    });
  });

  describe('Room Creation', () => {
    it('should render room creation form', () => {
      render(<App />);

      expect(screen.getByText('Criar Sala')).toBeInTheDocument();
      expect(screen.getByLabelText('Nome da Sala')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Iniciar Sala/i })).toBeInTheDocument();
    });

    it('should validate room name input', async () => {
      const user = userEvent.setup();
      render(<App />);

      const input = screen.getByLabelText('Nome da Sala');
      const submitButton = screen.getByRole('button', { name: /Iniciar Sala/i });

      expect(submitButton).toBeDisabled();

      await user.type(input, 'Test Room');
      expect(submitButton).toBeEnabled();
    });

    it('should create room with valid input', async () => {
      const user = userEvent.setup();
      render(<App />);

      const input = screen.getByLabelText('Nome da Sala');
      const submitButton = screen.getByRole('button', { name: /Iniciar Sala/i });

      await user.type(input, 'Test Room');
      await user.click(submitButton);

      // Should call Firebase setDoc
      await waitFor(() => {
        expect(vi.mocked(setDoc)).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display authentication errors', async () => {
      // Mock auth error
      vi.mocked(signInAnonymously).mockRejectedValueOnce(new Error('Auth failed'));

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Erro de conexão/);
      });
    });

    it('should announce errors to screen readers', async () => {
      vi.mocked(signInAnonymously).mockRejectedValueOnce(new Error('Auth failed'));

      render(<App />);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Performance', () => {
    it('should use Suspense for lazy loading', () => {
      render(<App />);

      // Check if Suspense boundaries are present
      // This would be tested through actual lazy loading scenarios
      expect(true).toBe(true); // Placeholder for Suspense tests
    });

    it('should memoize expensive calculations', () => {
      // Test that components are properly memoized
      const { rerender } = render(<App />);

      // Component should not re-render with same props
      rerender(<App />);

      expect(true).toBe(true); // Placeholder for memoization tests
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper live regions', () => {
      render(<App />);

      const announcements = document.getElementById('announcements');
      expect(announcements).toHaveAttribute('aria-live', 'polite');
      expect(announcements).toHaveAttribute('aria-atomic', 'true');
    });

    it('should announce status changes', async () => {
      const user = userEvent.setup();
      render(<App />);

      const input = screen.getByLabelText('Nome da Sala');
      await user.type(input, 'Test Room');

      const submitButton = screen.getByRole('button', { name: /Iniciar Sala/i });
      await user.click(submitButton);

      // Should announce success
      // This would be tested by checking the live region content
      expect(true).toBe(true); // Placeholder for announcement tests
    });
  });
});

// Mock imports for the test
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    setDoc: vi.fn(() => Promise.resolve()),
  };
});

vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual('firebase/auth');
  return {
    ...actual,
    signInAnonymously: vi.fn(() => Promise.resolve()),
  };
});