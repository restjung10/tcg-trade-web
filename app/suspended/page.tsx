import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function SuspendedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("suspension_reason")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-4 text-center dark:bg-black">
      <h1 className="text-xl font-bold text-black dark:text-zinc-50">
        계정이 정지되었습니다
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        사유: {profile?.suspension_reason ?? "커뮤니티 가이드라인 위반"}
      </p>
      <LogoutButton />
    </div>
  );
}
