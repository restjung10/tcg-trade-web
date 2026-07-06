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
        // auth.uid() 세션 전파 타이밍에 의존하지 않도록 service role로 user id를 명시해 호출한다.
        await createAdminClient().rpc("sync_kakao_identity", {
          p_user_id: user.id,
        });

        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarded, suspended_at")
          .eq("id", user.id)
          .single();

        if (profile?.suspended_at) {
          return NextResponse.redirect(`${origin}/suspended`);
        }

        if (!profile?.onboarded) {
          return NextResponse.redirect(`${origin}/onboarding/nickname`);
        }
      }

      return NextResponse.redirect(`${origin}/mypage`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
