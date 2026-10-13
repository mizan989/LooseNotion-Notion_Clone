import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/server/supabase";
import type { User } from "@/types/user";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

  if (!hasAuthCookie) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    name: profile?.name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    createdAt: profile?.created_at ?? user.created_at,
  };
}

/** Redirects to /login if there's no session. Use at the top of protected pages. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
