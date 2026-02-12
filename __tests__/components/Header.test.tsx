import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '@/components/Header';

describe('Header Component', () => {
  beforeEach(() => {
    // Clear localStorage and classList before each test
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  describe('Rendering', () => {
    it('should render with title prop', () => {
      render(<Header title="Test Documentation" />);

      expect(screen.getByText('Test Documentation')).toBeInTheDocument();
    });

    it('should render link to /docs', () => {
      render(<Header title="Docs" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/docs');
    });

    it('should render book icon', () => {
      render(<Header title="Docs" />);

      // SVG with book icon path
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render dark mode toggle button', () => {
      render(<Header title="Docs" />);

      const button = screen.getByRole('button', { name: /toggle dark mode/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Dark Mode - Initial State', () => {
    it('should start in light mode by default', () => {
      render(<Header title="Docs" />);

      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem('theme')).toBeNull();
    });

    it('should start in dark mode if localStorage has "dark"', () => {
      localStorage.setItem('theme', 'dark');

      render(<Header title="Docs" />);

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should start in light mode if localStorage has "light"', () => {
      localStorage.setItem('theme', 'light');

      render(<Header title="Docs" />);

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should display moon icon in light mode', () => {
      render(<Header title="Docs" />);

      // Moon icon path (M20.354...)
      const moonPath = document.querySelector('path[d*="M20.354"]');
      expect(moonPath).toBeInTheDocument();
    });

    it('should display sun icon in dark mode', () => {
      localStorage.setItem('theme', 'dark');

      render(<Header title="Docs" />);

      // Sun icon path (M12 3v1m0...)
      const sunPath = document.querySelector('path[d*="M12 3v1m0"]');
      expect(sunPath).toBeInTheDocument();
    });
  });

  describe('Dark Mode - Toggle Functionality', () => {
    it('should toggle to dark mode when button clicked', () => {
      render(<Header title="Docs" />);

      const button = screen.getByRole('button', { name: /toggle dark mode/i });

      fireEvent.click(button);

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('should toggle to light mode when button clicked in dark mode', () => {
      localStorage.setItem('theme', 'dark');

      render(<Header title="Docs" />);

      const button = screen.getByRole('button', { name: /toggle dark mode/i });

      fireEvent.click(button);

      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('should toggle multiple times correctly', () => {
      render(<Header title="Docs" />);

      const button = screen.getByRole('button', { name: /toggle dark mode/i });

      // Light → Dark
      fireEvent.click(button);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('theme')).toBe('dark');

      // Dark → Light
      fireEvent.click(button);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem('theme')).toBe('light');

      // Light → Dark again
      fireEvent.click(button);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('should update icon when toggled', () => {
      render(<Header title="Docs" />);

      const button = screen.getByRole('button', { name: /toggle dark mode/i });

      // Initially light mode - should show moon icon
      expect(document.querySelector('path[d*="M20.354"]')).toBeInTheDocument();

      // Toggle to dark mode
      fireEvent.click(button);

      // Now should show sun icon
      expect(document.querySelector('path[d*="M12 3v1m0"]')).toBeInTheDocument();
    });
  });

  describe('localStorage Persistence', () => {
    it('should persist dark mode preference', () => {
      render(<Header title="Docs" />);

      const button = screen.getByRole('button', { name: /toggle dark mode/i });
      fireEvent.click(button);

      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('should persist light mode preference', () => {
      localStorage.setItem('theme', 'dark');

      render(<Header title="Docs" />);

      const button = screen.getByRole('button', { name: /toggle dark mode/i });
      fireEvent.click(button);

      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('should restore dark mode on re-render', () => {
      const { rerender } = render(<Header title="Docs" />);

      const button = screen.getByRole('button', { name: /toggle dark mode/i });
      fireEvent.click(button);

      // Unmount and remount
      rerender(<Header title="Docs Rerendered" />);

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button label', () => {
      render(<Header title="Docs" />);

      const button = screen.getByRole('button', { name: /toggle dark mode/i });
      expect(button).toHaveAttribute('aria-label', 'Toggle dark mode');
    });

    it('should be keyboard accessible', () => {
      render(<Header title="Docs" />);

      const button = screen.getByRole('button', { name: /toggle dark mode/i });

      // Button should be focusable
      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Styling', () => {
    it('should have sticky header classes', () => {
      const { container } = render(<Header title="Docs" />);

      const header = container.querySelector('header');
      expect(header).toHaveClass('sticky', 'top-0', 'z-50');
    });

    it('should have dark background', () => {
      const { container } = render(<Header title="Docs" />);

      const header = container.querySelector('header');
      expect(header).toHaveClass('bg-gray-900', 'text-white');
    });

    it('should have hover state on toggle button', () => {
      render(<Header title="Docs" />);

      const button = screen.getByRole('button', { name: /toggle dark mode/i });
      expect(button).toHaveClass('hover:bg-gray-800', 'hover:text-white');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title gracefully', () => {
      render(<Header title="" />);

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('should handle very long title', () => {
      const longTitle = 'A'.repeat(100);
      render(<Header title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle special characters in title', () => {
      render(<Header title="Docs & Guides: <Special> Characters!" />);

      expect(screen.getByText('Docs & Guides: <Special> Characters!')).toBeInTheDocument();
    });

    it('should handle corrupted localStorage gracefully', () => {
      // Set invalid value
      localStorage.setItem('theme', 'invalid-value');

      render(<Header title="Docs" />);

      // Should default to light mode
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});
