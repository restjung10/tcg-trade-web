import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const admin = createAdminClient();

        // auth.uid() 세션 전파 타이밍에 의존하지 않도록 service role로 user id를 명시해 호출한다.
        await admin.rpc("sync_kakao_identity", { p_user_id: user.id });

        // 관리자에게 차단된 카카오 계정은, 탈퇴 여부나 예전 프로필 상태와 무관하게
        // 로그인 시점마다 항상 다시 걸러낸다 (재가입/재로그인 방지의 핵심 지점).
        const { data: profile } = await admin
          .from("profiles")
          .select("kakao_user_id")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.kakao_user_id) {
          const { data: blocked } = await admin
            .from("blocked_kakao_users")
            .select("kakao_user_id")
            .eq("kakao_user_id", profile.kakao_user_id)
            .maybeSingle();

          if (blocked) {
            await supabase.auth.signOut();
            return NextResponse.redirect(`${origin}/blocked`);
          }
        }

        const { data: statusRows } = await supabase.rpc(
          "get_my_account_status",
        );
        const status = statusRows?.[0];

        // 탈퇴했던 계정이 같은 카카오 계정으로 다시 로그인하면, 온보딩부터 새로 진행한다.
        if (status?.deleted) {
          await admin
            .from("profiles")
            .update({ deleted_at: null, onboarded: false })
            .eq("id", user.id);
          return NextResponse.redirect(`${origin}/onboarding/nickname`);
        }

        if (status?.suspended) {
          return NextResponse.redirect(`${origin}/suspended`);
        }

        if (!status?.onboarded) {
          return NextResponse.redirect(`${origin}/onboarding/nickname`);
        }
      }

      return NextResponse.redirect(`${origin}/mypage`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
