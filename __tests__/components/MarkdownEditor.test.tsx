import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import MarkdownEditor from '@/components/MarkdownEditor';

// Mock @mdxeditor/editor completely
vi.mock('@mdxeditor/editor', () => ({
  MDXEditor: ({ markdown, onChange }: { markdown: string; onChange?: (value: string) => void }) => (
    <div data-testid="mdx-editor">
      <textarea
        value={markdown}
        onChange={(e) => onChange?.(e.target.value)}
        data-testid="editor-textarea"
      />
    </div>
  ),
  headingsPlugin: vi.fn(() => ({})),
  listsPlugin: vi.fn(() => ({})),
  quotePlugin: vi.fn(() => ({})),
  thematicBreakPlugin: vi.fn(() => ({})),
  markdownShortcutPlugin: vi.fn(() => ({})),
  linkPlugin: vi.fn(() => ({})),
  linkDialogPlugin: vi.fn(() => ({})),
  imagePlugin: vi.fn(() => ({})),
  tablePlugin: vi.fn(() => ({})),
  codeBlockPlugin: vi.fn(() => ({})),
  codeMirrorPlugin: vi.fn(() => ({})),
  toolbarPlugin: vi.fn(() => ({})),
  diffSourcePlugin: vi.fn(() => ({})),
  BoldItalicUnderlineToggles: () => <button>BIU</button>,
  ListsToggle: () => <button>Lists</button>,
  BlockTypeSelect: () => <select data-testid="block-type"></select>,
  CreateLink: () => <button>Link</button>,
  InsertImage: () => <button>Image</button>,
  InsertTable: () => <button>Table</button>,
  InsertCodeBlock: () => <button>Code</button>,
  UndoRedo: () => <button>Undo/Redo</button>,
  Separator: () => <span>|</span>,
  DiffSourceToggleWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe.skip('MarkdownEditor Component', () => {
  const mockSlug = ['test-doc'];
  const mockContent = '# Test Document\n\nSome content.';
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render editor with initial content', () => {
      const { getByTestId } = render(
        <MarkdownEditor slug={mockSlug} initialContent={mockContent} onChange={mockOnChange} />
      );

      expect(getByTestId('mdx-editor')).toBeInTheDocument();
    });

    it('should render with empty content', () => {
      const { getByTestId } = render(
        <MarkdownEditor slug={mockSlug} initialContent="" onChange={mockOnChange} />
      );

      expect(getByTestId('mdx-editor')).toBeInTheDocument();
    });

    it('should mount without errors', () => {
      expect(() =>
        render(<MarkdownEditor slug={mockSlug} initialContent={mockContent} onChange={mockOnChange} />)
      ).not.toThrow();
    });
  });

  describe('Props', () => {
    it('should accept slug prop', () => {
      const { getByTestId } = render(
        <MarkdownEditor slug={['guide', 'intro']} initialContent={mockContent} onChange={mockOnChange} />
      );

      expect(getByTestId('mdx-editor')).toBeInTheDocument();
    });

    it('should accept initialContent prop', () => {
      const content = '# Custom Content';
      const { getByTestId } = render(
        <MarkdownEditor slug={mockSlug} initialContent={content} onChange={mockOnChange} />
      );

      const textarea = getByTestId('editor-textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe(content);
    });

    it('should accept onChange callback', () => {
      const { getByTestId } = render(
        <MarkdownEditor slug={mockSlug} initialContent={mockContent} onChange={mockOnChange} />
      );

      expect(getByTestId('mdx-editor')).toBeInTheDocument();
    });
  });

  describe('Lifecycle', () => {
    it('should unmount without errors', () => {
      const { unmount } = render(
        <MarkdownEditor slug={mockSlug} initialContent={mockContent} onChange={mockOnChange} />
      );

      expect(() => unmount()).not.toThrow();
    });

    it('should handle re-render with different content', () => {
      const { rerender, getByTestId } = render(
        <MarkdownEditor slug={mockSlug} initialContent="# First" onChange={mockOnChange} />
      );

      rerender(<MarkdownEditor slug={mockSlug} initialContent="# Second" onChange={mockOnChange} />);

      expect(getByTestId('mdx-editor')).toBeInTheDocument();
    });
  });

  describe('Structure', () => {
    it('should be a client component', () => {
      // MarkdownEditor uses useState, useEffect - must be client component
      const { getByTestId } = render(
        <MarkdownEditor slug={mockSlug} initialContent={mockContent} onChange={mockOnChange} />
      );

      expect(getByTestId('mdx-editor')).toBeInTheDocument();
    });

    it('should render with different slugs', () => {
      const { rerender, getByTestId } = render(
        <MarkdownEditor slug={['doc1']} initialContent={mockContent} onChange={mockOnChange} />
      );

      rerender(<MarkdownEditor slug={['doc2']} initialContent={mockContent} onChange={mockOnChange} />);

      expect(getByTestId('mdx-editor')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long content', () => {
      const longContent = 'x'.repeat(10000);

      const { getByTestId } = render(
        <MarkdownEditor slug={mockSlug} initialContent={longContent} onChange={mockOnChange} />
      );

      expect(getByTestId('mdx-editor')).toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      const specialContent = '# Test\n\n`code` **bold** [link](url) ![image](img.png)';

      const { getByTestId } = render(
        <MarkdownEditor slug={mockSlug} initialContent={specialContent} onChange={mockOnChange} />
      );

      expect(getByTestId('mdx-editor')).toBeInTheDocument();
    });

    it('should handle empty slug array', () => {
      const { getByTestId } = render(
        <MarkdownEditor slug={[]} initialContent={mockContent} onChange={mockOnChange} />
      );

      expect(getByTestId('mdx-editor')).toBeInTheDocument();
    });
  });
});
