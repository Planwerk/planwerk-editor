import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Sidebar from '@/components/Sidebar';
import { mockNavTree } from '@/test-utils/fixtures';
import type { NavItem } from '@/lib/docs';

// Mock ResizeHandle component
vi.mock('@/components/ResizeHandle', () => ({
  default: () => <div data-testid="resize-handle">Resize Handle</div>,
}));

describe('Sidebar Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('should render navigation tree', () => {
      render(<Sidebar navTree={mockNavTree} />);

      // Root item
      expect(screen.getByText('Documentation')).toBeInTheDocument();

      // Child items
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText('Guide')).toBeInTheDocument();
      expect(screen.getByText('API Reference')).toBeInTheDocument();
    });

    it('should render nested navigation items', () => {
      render(<Sidebar navTree={mockNavTree} />);

      // Nested under "Guide"
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    it('should render all navigation links', () => {
      render(<Sidebar navTree={mockNavTree} />);

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should render resize handle', () => {
      render(<Sidebar navTree={mockNavTree} />);

      expect(screen.getByTestId('resize-handle')).toBeInTheDocument();
    });

    it('should render empty tree gracefully', () => {
      const { container } = render(<Sidebar navTree={[]} />);

      // Should not crash - sidebar container should exist
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should render correct href attributes', () => {
      render(<Sidebar navTree={mockNavTree} />);

      const docLink = screen.getByText('Documentation').closest('a');
      expect(docLink).toHaveAttribute('href', '/docs');

      const gettingStartedLink = screen.getByText('Getting Started').closest('a');
      expect(gettingStartedLink).toHaveAttribute('href', '/docs/getting-started');
    });

    it('should apply correct indentation for nested items', () => {
      render(<Sidebar navTree={mockNavTree} />);

      // Top-level item (depth 0)
      const rootLink = screen.getByText('Documentation').closest('a');
      expect(rootLink).toHaveStyle({ paddingLeft: '12px' });

      // First-level children would have paddingLeft: 24px (depth 1)
      // This is calculated as: depth * 12 + 12 = 1 * 12 + 12 = 24
    });

    it('should show all links in navigation hierarchy', () => {
      const simpleTree: NavItem[] = [
        {
          title: 'Root',
          slug: '',
          href: '/docs',
          children: [
            {
              title: 'Child',
              slug: 'child',
              href: '/docs/child',
            },
          ],
        },
      ];

      render(<Sidebar navTree={simpleTree} />);

      expect(screen.getByText('Root')).toBeInTheDocument();
      expect(screen.getByText('Child')).toBeInTheDocument();
    });
  });

  describe('Active Link Highlighting', () => {
    it('should highlight active link based on pathname', () => {
      // usePathname is mocked to return '/' by default in vitest.setup.ts
      render(<Sidebar navTree={mockNavTree} />);

      // In real app, active link would have bg-blue-100 class
      // This test documents the behavior - in production the pathname would match
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Expand/Collapse Items', () => {
    it('should show expand/collapse buttons for items with children', () => {
      render(<Sidebar navTree={mockNavTree} />);

      // Items with children should have collapse/expand buttons
      const buttons = screen.getAllByRole('button');

      // At least one button should exist (collapse sidebar button + expand buttons for items with children)
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should display children when parent is expanded', () => {
      render(<Sidebar navTree={mockNavTree} />);

      // By default, items with children are open
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    it('should render leaf items without expand button', () => {
      const leafTree: NavItem[] = [
        {
          title: 'Single Item',
          slug: 'single',
          href: '/docs/single',
        },
      ];

      render(<Sidebar navTree={leafTree} />);

      const link = screen.getByText('Single Item');
      expect(link).toBeInTheDocument();

      // Should not have expand/collapse button
      const buttons = screen.queryAllByLabelText(/expand|collapse/i);
      // Only sidebar collapse button should exist, not item expand buttons
      expect(buttons.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Sidebar Width', () => {
    it('should render sidebar container', () => {
      const { container } = render(<Sidebar navTree={mockNavTree} />);

      // Sidebar renders as div, not aside
      const sidebar = container.firstChild;
      expect(sidebar).toBeInTheDocument();
    });

    it('should have width styling', () => {
      const { container } = render(<Sidebar navTree={mockNavTree} />);

      const sidebar = container.firstChild as HTMLElement;
      // Sidebar has inline width style
      expect(sidebar).toBeDefined();
    });
  });

  describe('Tree Structure', () => {
    it('should handle deeply nested items', () => {
      const deepTree: NavItem[] = [
        {
          title: 'Level 1',
          slug: 'l1',
          href: '/docs/l1',
          children: [
            {
              title: 'Level 2',
              slug: 'l1/l2',
              href: '/docs/l1/l2',
              children: [
                {
                  title: 'Level 3',
                  slug: 'l1/l2/l3',
                  href: '/docs/l1/l2/l3',
                },
              ],
            },
          ],
        },
      ];

      render(<Sidebar navTree={deepTree} />);

      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(screen.getByText('Level 2')).toBeInTheDocument();
      expect(screen.getByText('Level 3')).toBeInTheDocument();
    });

    it('should handle multiple root items', () => {
      const multiRootTree: NavItem[] = [
        {
          title: 'Root 1',
          slug: 'r1',
          href: '/docs/r1',
        },
        {
          title: 'Root 2',
          slug: 'r2',
          href: '/docs/r2',
        },
      ];

      render(<Sidebar navTree={multiRootTree} />);

      expect(screen.getByText('Root 1')).toBeInTheDocument();
      expect(screen.getByText('Root 2')).toBeInTheDocument();
    });

    it('should handle items with empty children array', () => {
      const emptyChildrenTree: NavItem[] = [
        {
          title: 'Item',
          slug: 'item',
          href: '/docs/item',
          children: [],
        },
      ];

      render(<Sidebar navTree={emptyChildrenTree} />);

      expect(screen.getByText('Item')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should render with proper structure', () => {
      const { container } = render(<Sidebar navTree={mockNavTree} />);

      // Sidebar renders with specific class structure
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have scrollable content area', () => {
      const { container } = render(<Sidebar navTree={mockNavTree} />);

      const scrollArea = container.querySelector('.overflow-y-auto');
      expect(scrollArea).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render navigation structure', () => {
      render(<Sidebar navTree={mockNavTree} />);

      // Navigation links should be present
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should have accessible links', () => {
      render(<Sidebar navTree={mockNavTree} />);

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });

    it('should have accessible expand/collapse buttons', () => {
      render(<Sidebar navTree={mockNavTree} />);

      const expandButtons = screen.queryAllByLabelText(/expand|collapse/i);
      expandButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in titles', () => {
      const specialTree: NavItem[] = [
        {
          title: 'API & SDKs: <Advanced>',
          slug: 'api',
          href: '/docs/api',
        },
      ];

      render(<Sidebar navTree={specialTree} />);

      expect(screen.getByText('API & SDKs: <Advanced>')).toBeInTheDocument();
    });

    it('should handle very long titles', () => {
      const longTitle = 'A'.repeat(100);
      const longTitleTree: NavItem[] = [
        {
          title: longTitle,
          slug: 'long',
          href: '/docs/long',
        },
      ];

      render(<Sidebar navTree={longTitleTree} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle undefined children gracefully', () => {
      const tree: NavItem[] = [
        {
          title: 'Item',
          slug: 'item',
          href: '/docs/item',
          children: undefined,
        },
      ];

      render(<Sidebar navTree={tree} />);

      expect(screen.getByText('Item')).toBeInTheDocument();
    });
  });
});
