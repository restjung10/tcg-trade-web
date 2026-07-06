import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, created_at")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-black">
      <h1 className="text-xl font-bold text-black dark:text-zinc-50">
        {profile?.nickname ?? "익명"}님, 환영합니다
      </h1>
      <LogoutButton />
    </div>
  );
}
