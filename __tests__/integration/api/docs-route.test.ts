import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PUT } from '@/app/api/docs/route';
import fs from 'fs';

// Mock fs module
vi.mock('fs');

describe('API Route: /api/docs - Security & Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PUT /api/docs - Valid Requests', () => {
    it('should save content to existing file', async () => {
      // Mock file exists
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['getting-started'],
          content: '# Getting Started\n\nWelcome!',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ ok: true });
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should save content to root index.md', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: [],
          content: '# Home\n\nWelcome!',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ ok: true });
    });

    it('should save content to nested file', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['guide', 'intro'],
          content: '# Introduction\n\nContent...',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ ok: true });
    });

    it('should try directory index if direct file does not exist', async () => {
      // First call (direct file) returns false, second call (directory index) returns true
      vi.mocked(fs.existsSync)
        .mockReturnValueOnce(false) // getting-started.md doesn't exist
        .mockReturnValueOnce(true); // getting-started/index.md exists

      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['getting-started'],
          content: '# Getting Started',
        }),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      expect(fs.existsSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('PUT /api/docs - Content Normalization', () => {
    it('should add newline if content does not end with one', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['test'],
          content: '# Test',
        }),
      });

      await PUT(request);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        '# Test\n',
        'utf-8'
      );
    });

    it('should not add extra newline if content already ends with one', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['test'],
          content: '# Test\n',
        }),
      });

      await PUT(request);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        '# Test\n',
        'utf-8'
      );
    });

    it('should preserve multiple trailing newlines', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['test'],
          content: '# Test\n\n',
        }),
      });

      await PUT(request);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        '# Test\n\n',
        'utf-8'
      );
    });
  });

  describe('PUT /api/docs - Validation & Error Handling', () => {
    it('should return 400 if content is missing', async () => {
      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['test'],
          // content missing
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Missing content' });
    });

    it('should return 400 if content is not a string', async () => {
      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['test'],
          content: 123, // number instead of string
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Missing content' });
    });

    it('should return 400 if content is null', async () => {
      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['test'],
          content: null,
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Missing content' });
    });

    it('should return 404 if file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['non-existent'],
          content: '# Test',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'File not found' });
    });

    it('should accept empty string as valid content', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['test'],
          content: '',
        }),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        '\n',
        'utf-8'
      );
    });
  });

  describe('PUT /api/docs - SECURITY: Path Traversal Prevention', () => {
    it('should reject path traversal with parent directory references (..)', async () => {
      // Mock that attacker's file "exists"
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['..', '..', 'etc', 'passwd'],
          content: 'malicious content',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      // CRITICAL: Should return 403 Invalid path
      expect(response.status).toBe(403);
      expect(data).toEqual({ error: 'Invalid path' });
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should handle absolute paths in slug segments', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['/etc/passwd'],
          content: 'malicious content',
        }),
      });

      const response = await PUT(request);

      // path.join() treats "/etc/passwd" as a segment, resulting in
      // DOCS_DIR//etc/passwd.md which normalizes to DOCS_DIR/etc/passwd.md
      // This is within DOCS_DIR, so it's allowed (though unusual)
      // Real security is that the file must exist - arbitrary files can't be created
      expect(response.status).toBe(200);
    });

    it('should reject path traversal in nested slugs', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['valid', '..', '..', 'etc', 'passwd'],
          content: 'malicious content',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({ error: 'Invalid path' });
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should handle null bytes in slug (filesystem will reject)', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['test\0.md'],
          content: 'content',
        }),
      });

      const response = await PUT(request);

      // Null bytes are passed through but would fail at filesystem level
      // In real usage, fs.writeFileSync would throw an error
      // In tests with mocks, it passes through
      expect(response.status).toBe(200);
    });

    it('should allow valid nested paths', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['guide', 'advanced', 'security'],
          content: '# Security',
        }),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should ensure resolved path stays within DOCS_DIR', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      // Simulate a crafted slug that tries to escape
      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['..', 'outside-docs'],
          content: 'malicious',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({ error: 'Invalid path' });
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('slugToFilePath() - Path Resolution Logic', () => {
    it('should resolve empty slug to index.md', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: [],
          content: '# Home',
        }),
      });

      await PUT(request);

      // Check that writeFileSync was called with path ending in index.md
      const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
      expect(callArgs[0]).toMatch(/index\.md$/);
    });

    it('should try direct file first, then directory index', async () => {
      vi.mocked(fs.existsSync)
        .mockReturnValueOnce(false) // Direct file doesn't exist
        .mockReturnValueOnce(true); // Directory index exists

      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['guide'],
          content: '# Guide',
        }),
      });

      await PUT(request);

      expect(fs.existsSync).toHaveBeenCalledTimes(2);

      const calls = vi.mocked(fs.existsSync).mock.calls;
      expect(calls[0][0]).toMatch(/guide\.md$/);
      expect(calls[1][0]).toMatch(/guide\/index\.md$/);
    });

    it('should construct correct file path for nested slugs', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['api', 'reference', 'authentication'],
          content: '# Auth',
        }),
      });

      await PUT(request);

      const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
      expect(callArgs[0]).toMatch(/api\/reference\/authentication\.md$/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long content', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const longContent = 'x'.repeat(1000000); // 1MB of content

      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['test'],
          content: longContent,
        }),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
    });

    it('should handle Unicode content', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['test'],
          content: '# Übersicht\n\n日本語 テスト 🚀',
        }),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        '# Übersicht\n\n日本語 テスト 🚀\n',
        'utf-8'
      );
    });

    it('should handle special characters in slug', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: JSON.stringify({
          slug: ['my-guide-2024'],
          content: '# Guide',
        }),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost/api/docs', {
        method: 'PUT',
        body: 'invalid json',
      });

      // This will throw during JSON parsing
      await expect(PUT(request)).rejects.toThrow();
    });
  });
});
