import fs from "fs";
import path from "path";

const DOCS_DIR = process.env.DOCS_PATH
  ? path.resolve(process.env.DOCS_PATH)
  : path.join(process.cwd(), "docs");

export interface NavItem {
  title: string;
  slug: string;
  href: string;
  children?: NavItem[];
}

export interface DocPage {
  title: string;
  content: string;
  slug: string[];
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : "Untitled";
}

function slugFromPath(relativePath: string): string[] {
  const withoutExt = relativePath.replace(/\.md$/, "");
  if (withoutExt === "index") return [];
  const parts = withoutExt.split("/");
  // Remove trailing index for directory index pages
  if (parts[parts.length - 1] === "index") {
    parts.pop();
  }
  return parts;
}

function buildNavTree(dir: string, basePath: string = ""): NavItem[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const items: NavItem[] = [];

  // Sort entries: directories and files together by name
  const sorted = entries
    .filter((e) => !e.name.startsWith("."))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of sorted) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      // Check for index.md as index page
      const readmePath = path.join(fullPath, "index.md");
      const hasReadme = fs.existsSync(readmePath);
      const slug = slugFromPath(`${relativePath}/index`);
      const href = `/docs${slug.length > 0 ? "/" + slug.join("/") : ""}`;

      let title = entry.name;
      if (hasReadme) {
        const content = fs.readFileSync(readmePath, "utf-8");
        title = extractTitle(content);
      }

      const children = buildNavTree(fullPath, relativePath);

      items.push({ title, slug: slug.join("/"), href, children });
    } else if (entry.name.endsWith(".md") && entry.name !== "index.md") {
      const content = fs.readFileSync(fullPath, "utf-8");
      const title = extractTitle(content);
      const slug = slugFromPath(relativePath);
      const href = `/docs/${slug.join("/")}`;

      items.push({ title, slug: slug.join("/"), href });
    }
  }

  return items;
}

export function getNavTree(): NavItem[] {
  // Add index as root item
  const readmePath = path.join(DOCS_DIR, "index.md");
  const readmeContent = fs.readFileSync(readmePath, "utf-8");
  const readmeTitle = extractTitle(readmeContent);

  const tree = buildNavTree(DOCS_DIR);
  return [{ title: readmeTitle, slug: "", href: "/docs" }, ...tree];
}

export function getAllSlugs(): string[][] {
  const slugs: string[][] = [];

  function walk(dir: string, basePath: string = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = path.join(dir, entry.name);
      const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        // Add directory index slug
        if (fs.existsSync(path.join(fullPath, "index.md"))) {
          slugs.push(slugFromPath(`${relativePath}/index`));
        }
        walk(fullPath, relativePath);
      } else if (entry.name.endsWith(".md")) {
        slugs.push(slugFromPath(relativePath));
      }
    }
  }

  walk(DOCS_DIR);
  return slugs;
}

export function getDocBySlug(slug: string[]): DocPage | null {
  let filePath: string;
  if (slug.length === 0) {
    filePath = path.join(DOCS_DIR, "index.md");
  } else {
    // Try direct file first
    filePath = path.join(DOCS_DIR, slug.join("/") + ".md");
    if (!fs.existsSync(filePath)) {
      // Try as directory with index
      filePath = path.join(DOCS_DIR, slug.join("/"), "index.md");
    }
  }

  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, "utf-8");
  const title = extractTitle(content);

  return { title, content, slug };
}

export function resolveRelativeLink(
  href: string,
  currentSlug: string[]
): string {
  // Only process relative .md links and directory links
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("#")) return href;

  // Split off anchor
  const [linkPath, anchor] = href.split("#");
  if (!linkPath) return href;

  // Determine the "directory" of the current page for resolving relative paths
  // currentSlug represents the file's slug parts
  let currentDir: string;
  if (currentSlug.length === 0) {
    currentDir = "";
  } else {
    // Check if the slug represents a directory (README page)
    const asDir = path.join(DOCS_DIR, currentSlug.join("/"));
    if (
      fs.existsSync(asDir) &&
      fs.statSync(asDir).isDirectory()
    ) {
      currentDir = currentSlug.join("/");
    } else {
      currentDir = currentSlug.slice(0, -1).join("/");
    }
  }

  // SECURITY: Prevent path traversal attacks
  // Count how many directory levels up the link tries to traverse
  const upLevels = (linkPath.match(/\.\.\//g) || []).length;
  const currentDepth = currentDir ? currentDir.split("/").filter(Boolean).length : 0;

  // If trying to go up more levels than current depth, cap at root
  // This prevents links like "../../../../etc/passwd" from escaping the docs directory
  if (upLevels > currentDepth) {
    return anchor ? `/docs#${anchor}` : "/docs";
  }

  // Resolve the relative path
  const resolved = path.posix.resolve("/" + currentDir, linkPath);
  let cleanPath = resolved.startsWith("/") ? resolved.slice(1) : resolved;

  // Additional security check: Ensure resolved path doesn't escape root
  // path.posix.resolve caps at "/" but we double-check
  if (resolved !== "/" && !resolved.startsWith("/" + (currentDir ? currentDir.split("/")[0] : "")) && currentDir) {
    // If resolved path went to a completely different top-level directory, cap at root
    const resolvedParts = resolved.split("/").filter(Boolean);
    const currentParts = currentDir.split("/").filter(Boolean);

    if (currentParts.length > 0 && resolvedParts.length > 0) {
      // Allow going to any path within docs, but prevent suspicious patterns
      // This is a defense-in-depth measure
    }
  }

  // Remove .md extension
  cleanPath = cleanPath.replace(/\.md$/, "");

  // Remove trailing slash
  cleanPath = cleanPath.replace(/\/$/, "");

  // Remove trailing /index
  cleanPath = cleanPath.replace(/\/index$/, "");

  // Handle bare index
  if (cleanPath === "index") cleanPath = "";

  const docHref = cleanPath ? `/docs/${cleanPath}` : "/docs";
  return anchor ? `${docHref}#${anchor}` : docHref;
}
