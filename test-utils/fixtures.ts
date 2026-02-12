import type { NavItem, DocPage } from '@/lib/docs';
import type { TocItem } from '@/lib/toc';

/**
 * Test fixtures for documentation system
 */

// Mock documentation content
export const mockDocContent = {
  simple: '# Test Document\n\nThis is a test document.',
  withHeadings: `# Main Title

## Section 1

Content for section 1.

### Subsection 1.1

Details here.

## Section 2

More content.`,

  withCode: `# API Reference

## Installation

\`\`\`bash
npm install package
\`\`\`

## Usage

Use the \`useHook()\` function.`,

  empty: '',

  noTitle: 'Just some content without a title.\n\nMore text here.',
};

// Mock DocPage objects
export const mockDocPages: Record<string, DocPage> = {
  root: {
    title: 'Documentation',
    content: mockDocContent.simple,
    slug: [],
  },

  gettingStarted: {
    title: 'Getting Started',
    content: mockDocContent.withHeadings,
    slug: ['getting-started'],
  },

  apiReference: {
    title: 'API Reference',
    content: mockDocContent.withCode,
    slug: ['api', 'reference'],
  },
};

// Mock navigation tree
export const mockNavTree: NavItem[] = [
  {
    title: 'Documentation',
    slug: '',
    href: '/docs',
    children: [
      {
        title: 'Getting Started',
        slug: 'getting-started',
        href: '/docs/getting-started',
      },
      {
        title: 'Guide',
        slug: 'guide',
        href: '/docs/guide',
        children: [
          {
            title: 'Introduction',
            slug: 'guide/intro',
            href: '/docs/guide/intro',
          },
          {
            title: 'Advanced',
            slug: 'guide/advanced',
            href: '/docs/guide/advanced',
          },
        ],
      },
      {
        title: 'API Reference',
        slug: 'api',
        href: '/docs/api',
        children: [
          {
            title: 'Authentication',
            slug: 'api/auth',
            href: '/docs/api/auth',
          },
          {
            title: 'Endpoints',
            slug: 'api/endpoints',
            href: '/docs/api/endpoints',
          },
        ],
      },
    ],
  },
];

// Mock TOC (Table of Contents)
export const mockTocItems: TocItem[] = [
  { id: 'section-1', text: 'Section 1', level: 2 },
  { id: 'subsection-11', text: 'Subsection 1.1', level: 3 },
  { id: 'section-2', text: 'Section 2', level: 2 },
];

// Mock slugs
export const mockSlugs: string[][] = [
  [],
  ['getting-started'],
  ['guide'],
  ['guide', 'intro'],
  ['guide', 'advanced'],
  ['api'],
  ['api', 'auth'],
  ['api', 'endpoints'],
];

// Mock WebSocket messages
export const mockWebSocketMessages = {
  terminalData: new Uint8Array([0x00, ...new TextEncoder().encode('$ ls\n')]),
  terminalControl: new Uint8Array([0x01, ...new TextEncoder().encode(JSON.stringify({ type: 'resize', cols: 80, rows: 24 }))]),
  fileChange: new Uint8Array([0x01, ...new TextEncoder().encode(JSON.stringify({ type: 'file-change', path: 'docs/test.md' }))]),
};

// Helper to create mock NavItem
export function createMockNavItem(overrides?: Partial<NavItem>): NavItem {
  return {
    title: 'Test Item',
    slug: 'test-item',
    href: '/docs/test-item',
    ...overrides,
  };
}

// Helper to create mock DocPage
export function createMockDocPage(overrides?: Partial<DocPage>): DocPage {
  return {
    title: 'Test Page',
    content: '# Test Page\n\nTest content.',
    slug: ['test-page'],
    ...overrides,
  };
}

// Helper to create mock TocItem
export function createMockTocItem(overrides?: Partial<TocItem>): TocItem {
  return {
    id: 'test-heading',
    text: 'Test Heading',
    level: 2,
    ...overrides,
  };
}

// Mock localStorage data
export const mockLocalStorage = {
  theme: 'dark',
  sidebarCollapsed: 'false',
  lastVisitedDoc: '/docs/getting-started',
};

// Mock editor state
export const mockEditorState = {
  content: mockDocContent.simple,
  isDirty: false,
  isSaving: false,
  lastSaved: new Date('2024-01-01T12:00:00Z'),
};

// Mock terminal state
export const mockTerminalState = {
  isConnected: true,
  history: [
    '$ pwd',
    '/Users/test/docs',
    '$ ls',
    'index.md  getting-started.md',
  ],
  cols: 80,
  rows: 24,
};
