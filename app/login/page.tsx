"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function WithdrawnNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get("withdrawn") !== "1") return null;

  return (
    <p className="text-sm text-zinc-500 dark:text-zinc-400">
      회원탈퇴가 완료되었습니다.
    </p>
  );
}

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
      <Suspense>
        <WithdrawnNotice />
      </Suspense>
      <button
        onClick={handleKakaoLogin}
        className="rounded-md bg-[#FEE500] px-6 py-3 font-medium text-black hover:brightness-95"
      >
        카카오로 시작하기
      </button>
    </div>
  );
}
