import { requireUser } from "@/lib/server/auth";
import { getOrCreateDefaultWorkspace } from "@/lib/server/pages";
import { NewPageButton } from "@/app/(workspace)/workspace/NewPageButton";
import { LooseNotionLogo } from "@/components/ui/LooseNotionLogo";

export default async function WorkspaceIndexPage() {
  const user = await requireUser();
  const workspace = await getOrCreateDefaultWorkspace(user.id);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <div className="h-12 w-12 rounded-xl overflow-hidden shadow-lg mb-1 opacity-85">
        <LooseNotionLogo className="h-12 w-12" />
      </div>
      <div>

        <h1 className="text-lg font-medium">No page selected</h1>
        <p className="text-sm text-muted-foreground">Pick a page from the sidebar, or create a new one.</p>
      </div>
      <NewPageButton workspaceId={workspace.id} />
    </div>
  );
}
