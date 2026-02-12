import { describe, it, expect } from 'vitest';
import { extractToc } from '@/lib/toc';

describe('lib/toc.ts - Table of Contents Extraction', () => {
  describe('extractToc() - Basic Functionality', () => {
    it('should extract H2 headings', () => {
      const markdown = `
# Main Title

## Introduction

Some content here.

## Getting Started

More content.
`;

      const toc = extractToc(markdown);

      expect(toc).toHaveLength(2);
      expect(toc[0]).toEqual({
        id: 'introduction',
        text: 'Introduction',
        level: 2,
      });
      expect(toc[1]).toEqual({
        id: 'getting-started',
        text: 'Getting Started',
        level: 2,
      });
    });

    it('should extract H3 headings', () => {
      const markdown = `
## Section

### Subsection One

### Subsection Two
`;

      const toc = extractToc(markdown);

      expect(toc).toHaveLength(3);
      expect(toc[0].level).toBe(2);
      expect(toc[1].level).toBe(3);
      expect(toc[2].level).toBe(3);
    });

    it('should extract H4 headings', () => {
      const markdown = `
## Section

### Subsection

#### Detail Level
`;

      const toc = extractToc(markdown);

      expect(toc).toHaveLength(3);
      expect(toc[2]).toEqual({
        id: 'detail-level',
        text: 'Detail Level',
        level: 4,
      });
    });

    it('should NOT extract H1 headings', () => {
      const markdown = `
# Main Title

## Section

### Subsection
`;

      const toc = extractToc(markdown);

      expect(toc).toHaveLength(2);
      expect(toc.every(item => item.level >= 2)).toBe(true);
      expect(toc.some(item => item.text === 'Main Title')).toBe(false);
    });

    it('should NOT extract H5 and H6 headings', () => {
      const markdown = `
## Section

##### Too Deep

###### Even Deeper
`;

      const toc = extractToc(markdown);

      expect(toc).toHaveLength(1);
      expect(toc[0].text).toBe('Section');
    });

    it('should return empty array for markdown without headings', () => {
      const markdown = 'Just some plain text without any headings.';

      const toc = extractToc(markdown);

      expect(toc).toEqual([]);
    });

    it('should return empty array for empty markdown', () => {
      const toc = extractToc('');

      expect(toc).toEqual([]);
    });
  });

  describe('stripMarkdown() - Formatting Removal', () => {
    it('should strip inline code from headings', () => {
      const markdown = '## Using `useState` Hook';

      const toc = extractToc(markdown);

      expect(toc[0].text).toBe('Using useState Hook');
      expect(toc[0].id).toBe('using-usestate-hook');
    });

    it('should strip bold formatting', () => {
      const markdown = '## **Important** Section';

      const toc = extractToc(markdown);

      expect(toc[0].text).toBe('Important Section');
    });

    it('should strip italic formatting (single asterisk)', () => {
      const markdown = '## *Emphasized* Text';

      const toc = extractToc(markdown);

      expect(toc[0].text).toBe('Emphasized Text');
    });

    it('should strip italic formatting (underscore)', () => {
      const markdown = '## _Emphasized_ Text';

      const toc = extractToc(markdown);

      expect(toc[0].text).toBe('Emphasized Text');
    });

    it('should strip bold formatting (underscore)', () => {
      const markdown = '## __Important__ Text';

      const toc = extractToc(markdown);

      expect(toc[0].text).toBe('Important Text');
    });

    it('should strip links and keep link text', () => {
      const markdown = '## See [Documentation](https://example.com)';

      const toc = extractToc(markdown);

      expect(toc[0].text).toBe('See Documentation');
      expect(toc[0].id).toBe('see-documentation');
    });

    it('should strip images and keep alt text', () => {
      const markdown = '## Icon ![home icon](/icon.png) Home';

      const toc = extractToc(markdown);

      // Note: The regex leaves the "!" - this could be improved in implementation
      expect(toc[0].text).toBe('Icon !home icon Home');
    });

    it('should handle multiple markdown formats in one heading', () => {
      const markdown = '## **Bold** and `code` and [link](url)';

      const toc = extractToc(markdown);

      expect(toc[0].text).toBe('Bold and code and link');
    });
  });

  describe('ID Generation', () => {
    it('should convert text to lowercase IDs', () => {
      const markdown = '## UPPERCASE HEADING';

      const toc = extractToc(markdown);

      expect(toc[0].id).toBe('uppercase-heading');
    });

    it('should replace spaces with dashes', () => {
      const markdown = '## Multiple Word Heading';

      const toc = extractToc(markdown);

      expect(toc[0].id).toBe('multiple-word-heading');
    });

    it('should remove special characters', () => {
      const markdown = '## What is React? (Framework)';

      const toc = extractToc(markdown);

      expect(toc[0].id).toBe('what-is-react-framework');
    });

    it('should handle Unicode characters', () => {
      const markdown = '## Übersicht';

      const toc = extractToc(markdown);

      expect(toc[0].text).toBe('Übersicht');
      // Unicode chars are preserved in text but removed from ID (per regex /[^\w\s-]/)
      expect(toc[0].id).toBe('bersicht');
    });

    it('should collapse multiple spaces to single dash', () => {
      const markdown = '## Multiple    Spaces    Here';

      const toc = extractToc(markdown);

      expect(toc[0].id).toBe('multiple-spaces-here');
    });

    it('should handle headings with only special characters', () => {
      const markdown = '## ---';

      const toc = extractToc(markdown);

      expect(toc[0].text).toBe('---');
      expect(toc[0].id).toBe('---');
    });

    it('should trim whitespace from headings', () => {
      const markdown = '##   Trimmed Heading   ';

      const toc = extractToc(markdown);

      expect(toc[0].text).toBe('Trimmed Heading');
      expect(toc[0].id).toBe('trimmed-heading');
    });
  });

  describe('Duplicate ID Handling', () => {
    it('should handle duplicate heading IDs', () => {
      const markdown = `
## Introduction

Some content.

## Introduction

More content.
`;

      const toc = extractToc(markdown);

      expect(toc).toHaveLength(2);
      expect(toc[0].id).toBe('introduction');
      expect(toc[1].id).toBe('introduction-1');
    });

    it('should handle triple duplicate IDs', () => {
      const markdown = `
## Introduction

## Introduction

## Introduction
`;

      const toc = extractToc(markdown);

      expect(toc).toHaveLength(3);
      expect(toc[0].id).toBe('introduction');
      expect(toc[1].id).toBe('introduction-1');
      expect(toc[2].id).toBe('introduction-2');
    });

    it('should handle duplicates with different formatting', () => {
      const markdown = `
## Getting Started

## **Getting Started**

## \`Getting Started\`
`;

      const toc = extractToc(markdown);

      expect(toc).toHaveLength(3);
      // All strip down to same text and ID
      expect(toc[0].text).toBe('Getting Started');
      expect(toc[1].text).toBe('Getting Started');
      expect(toc[2].text).toBe('Getting Started');
      expect(toc[0].id).toBe('getting-started');
      expect(toc[1].id).toBe('getting-started-1');
      expect(toc[2].id).toBe('getting-started-2');
    });

    it('should handle duplicates at different heading levels', () => {
      const markdown = `
## Section

### Section

#### Section
`;

      const toc = extractToc(markdown);

      expect(toc).toHaveLength(3);
      expect(toc[0].id).toBe('section');
      expect(toc[1].id).toBe('section-1');
      expect(toc[2].id).toBe('section-2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle headings with trailing hashes', () => {
      // Some markdown allows: ## Heading ##
      const markdown = '## Heading ##';

      const toc = extractToc(markdown);

      expect(toc).toHaveLength(1);
      expect(toc[0].text).toBe('Heading ##');
    });

    it('should handle headings with code blocks nearby', () => {
      const markdown = `
## Code Example

\`\`\`javascript
const x = 1;
\`\`\`

## Next Section
`;

      const toc = extractToc(markdown);

      expect(toc).toHaveLength(2);
      expect(toc[0].text).toBe('Code Example');
      expect(toc[1].text).toBe('Next Section');
    });

    it('should handle headings in lists', () => {
      const markdown = `
- Item 1
  ## Not a heading (indented)

## Real Heading
`;

      const toc = extractToc(markdown);

      // Regex /^(#{2,4})\s+(.+)$/gm requires start of line
      // Indented headings won't match
      expect(toc).toHaveLength(1);
      expect(toc[0].text).toBe('Real Heading');
    });

    it('should handle headings with HTML tags', () => {
      const markdown = '## Heading with <span>HTML</span>';

      const toc = extractToc(markdown);

      expect(toc).toHaveLength(1);
      // HTML tags are NOT stripped by stripMarkdown (only markdown syntax)
      expect(toc[0].text).toBe('Heading with <span>HTML</span>');
    });

    it('should handle empty headings', () => {
      const markdown = '## ';

      const toc = extractToc(markdown);

      // Regex requires at least one char after ##, so empty headings don't match
      expect(toc).toHaveLength(0);
    });

    it('should handle headings with only whitespace', () => {
      const markdown = '##    ';

      const toc = extractToc(markdown);

      // Regex matches, but after trim() it becomes empty string
      expect(toc).toHaveLength(1);
      expect(toc[0].text).toBe('');
      expect(toc[0].id).toBe('');
    });

    it('should handle multiline markdown (headings on separate lines)', () => {
      const markdown = `## First

## Second

## Third`;

      const toc = extractToc(markdown);

      expect(toc).toHaveLength(3);
    });

    it('should handle headings with emojis', () => {
      const markdown = '## 🚀 Getting Started';

      const toc = extractToc(markdown);

      expect(toc).toHaveLength(1);
      expect(toc[0].text).toBe('🚀 Getting Started');
      // Emojis are removed from ID by /[^\w\s-]/
      // This creates a leading space which becomes a dash
      expect(toc[0].id).toBe('-getting-started');
    });

    it('should handle headings with numbers', () => {
      const markdown = '## Section 1.2.3';

      const toc = extractToc(markdown);

      expect(toc).toHaveLength(1);
      expect(toc[0].text).toBe('Section 1.2.3');
      expect(toc[0].id).toBe('section-123');
    });
  });

  describe('Complex Real-World Examples', () => {
    it('should extract TOC from realistic markdown document', () => {
      const markdown = `
# API Documentation

## Overview

This is the overview section.

## Authentication

### API Keys

You need an API key to authenticate.

### OAuth 2.0

Alternative authentication method.

## Endpoints

### GET /users

Retrieve all users.

#### Parameters

- \`page\`: Page number
- \`limit\`: Items per page

#### Response

Returns JSON array.

### POST /users

Create a new user.

## Error Handling

Common error codes.

## Rate Limiting

API rate limits.
`;

      const toc = extractToc(markdown);

      expect(toc).toHaveLength(11);

      // Verify structure
      expect(toc[0]).toEqual({ id: 'overview', text: 'Overview', level: 2 });
      expect(toc[1]).toEqual({ id: 'authentication', text: 'Authentication', level: 2 });
      expect(toc[2]).toEqual({ id: 'api-keys', text: 'API Keys', level: 3 });
      expect(toc[3]).toEqual({ id: 'oauth-20', text: 'OAuth 2.0', level: 3 });
      expect(toc[4]).toEqual({ id: 'endpoints', text: 'Endpoints', level: 2 });
      expect(toc[5]).toEqual({ id: 'get-users', text: 'GET /users', level: 3 });
      expect(toc[6]).toEqual({ id: 'parameters', text: 'Parameters', level: 4 });
      expect(toc[7]).toEqual({ id: 'response', text: 'Response', level: 4 });
      expect(toc[8]).toEqual({ id: 'post-users', text: 'POST /users', level: 3 });
      expect(toc[9]).toEqual({ id: 'error-handling', text: 'Error Handling', level: 2 });
      expect(toc[10]).toEqual({ id: 'rate-limiting', text: 'Rate Limiting', level: 2 });
    });

    it('should handle document with mixed formatting', () => {
      const markdown = `
## **Installation**

### Using \`npm\`

\`\`\`bash
npm install package
\`\`\`

### Using [yarn](https://yarnpkg.com)

## Configuration

Configure using \`config.json\`.
`;

      const toc = extractToc(markdown);

      expect(toc).toHaveLength(4);
      expect(toc[0].text).toBe('Installation');
      expect(toc[1].text).toBe('Using npm');
      expect(toc[2].text).toBe('Using yarn');
      expect(toc[3].text).toBe('Configuration');
    });
  });
});
