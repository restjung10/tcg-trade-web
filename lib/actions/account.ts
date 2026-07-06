"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function withdrawAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 온보딩 임시 닉네임과 동일한 규칙(접두어 + id 앞 8자리)으로 고유성을 보장한다.
  const anonymizedNickname = `탈퇴회원${user.id.replace(/-/g, "").slice(0, 8)}`;

  await createAdminClient()
    .from("profiles")
    .update({
      deleted_at: new Date().toISOString(),
      nickname: anonymizedNickname,
      avatar_url: null,
      kakao_user_id: null,
    })
    .eq("id", user.id);

  await supabase.auth.signOut();
  redirect("/login?withdrawn=1");
}
