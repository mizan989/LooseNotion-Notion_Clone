import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { getOrCreateDefaultWorkspace } from "@/lib/server/pages";
import { searchPageContent } from "@/lib/server/blocks";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const query = request.nextUrl.searchParams.get("search")?.trim().slice(0, 100);
  if (!query || query.length < 2) return NextResponse.json({ results: [] });

  const workspace = await getOrCreateDefaultWorkspace(user.id);
  const results = await searchPageContent(workspace.id, query);
  return NextResponse.json({ results });
}
