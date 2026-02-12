import { notFound } from "next/navigation";
import { getDocBySlug } from "@/lib/docs";
import { extractToc } from "@/lib/toc";
import MarkdownEditor from "@/components/MarkdownEditor";
import TableOfContents from "@/components/TableOfContents";

export const dynamic = "force-dynamic";

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug || [];
  const doc = getDocBySlug(slug);

  if (!doc) notFound();

  const toc = extractToc(doc.content);

  return (
    <div className="flex flex-1 min-w-0">
      <main className="flex-1 min-w-0 overflow-y-auto px-8 py-8">
        <div className="max-w-none">
          <MarkdownEditor content={doc.content} slug={slug} />
        </div>
      </main>
      <TableOfContents items={toc} />
    </div>
  );
}
