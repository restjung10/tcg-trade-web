"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const handleKakaoLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 dark:bg-black">
      <h1 className="text-xl font-bold text-black dark:text-zinc-50">
        TCG 카드 거래소 로그인
      </h1>
      <button
        onClick={handleKakaoLogin}
        className="rounded-md bg-[#FEE500] px-6 py-3 font-medium text-black hover:brightness-95"
      >
        카카오로 시작하기
      </button>
    </div>
  );
}
