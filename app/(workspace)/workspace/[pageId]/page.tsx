import { notFound } from "next/navigation";
import { getPage } from "@/lib/server/pages";
import { getPageContent } from "@/lib/server/blocks";
import { getDatabaseByPageId, getDatabaseColumns, getDatabaseRows } from "@/lib/server/databases";
import { PageHeader } from "@/components/page/PageHeader";
import { PageCover } from "@/components/page/PageCover";
import { Editor } from "@/components/editor/Editor";
import { Database } from "@/components/database/Database";

export default async function PageDetail({ params }: { params: { pageId: string } }) {
  const page = await getPage(params.pageId);
  if (!page || page.isDeleted) notFound();

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <PageCover pageId={page.id} cover={page.cover} />
      <PageHeader page={page} />

      {page.isDatabase ? (
        <DatabaseSection pageId={page.id} />
      ) : (
        <EditorSection pageId={page.id} />
      )}
    </div>
  );
}

async function EditorSection({ pageId }: { pageId: string }) {
  const content = await getPageContent(pageId);
  return <Editor pageId={pageId} initialContent={content} />;
}

async function DatabaseSection({ pageId }: { pageId: string }) {
  const database = await getDatabaseByPageId(pageId);
  if (!database) {
    return <p className="p-8 text-sm text-muted-foreground">This database hasn&apos;t been set up yet.</p>;
  }

  const [columns, rows] = await Promise.all([
    getDatabaseColumns(database.id),
    getDatabaseRows(database.id),
  ]);

  return <Database databaseId={database.id} columns={columns} initialRows={rows} />;
}
