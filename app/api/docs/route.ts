import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DOCS_DIR = path.join(process.cwd(), "..", "docs");

function slugToFilePath(slug: string[]): string | null {
  if (slug.length === 0) {
    return path.join(DOCS_DIR, "index.md");
  }

  // Try direct file first
  const directPath = path.join(DOCS_DIR, slug.join("/") + ".md");
  if (fs.existsSync(directPath)) return directPath;

  // Try as directory with index
  const readmePath = path.join(DOCS_DIR, slug.join("/"), "index.md");
  if (fs.existsSync(readmePath)) return readmePath;

  return null;
}

export async function PUT(request: NextRequest) {
  const { slug, content } = await request.json();

  if (typeof content !== "string") {
    return NextResponse.json({ error: "Missing content" }, { status: 400 });
  }

  const filePath = slugToFilePath(slug || []);
  if (!filePath) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Ensure the resolved path is within DOCS_DIR
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(DOCS_DIR))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 403 });
  }

  // Ensure content ends with newline
  const normalizedContent = content.endsWith("\n") ? content : content + "\n";
  fs.writeFileSync(resolved, normalizedContent, "utf-8");

  return NextResponse.json({ ok: true });
}
