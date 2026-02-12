import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

/**
 * Custom render function that wraps components with necessary providers
 *
 * Usage:
 * ```tsx
 * import { renderWithProviders } from '@/test-utils/render';
 *
 * it('should render component', () => {
 *   const { getByText } = renderWithProviders(<MyComponent />);
 *   expect(getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // Currently no providers needed, but structure is ready for future additions
  // Examples of providers that might be added:
  // - ThemeProvider for dark mode
  // - Router Provider if needed
  // - Context providers

  return render(ui, { ...options });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override render with our custom version
export { renderWithProviders as render };
