"use client";

import { useActionState } from "react";
import { setNickname } from "@/lib/actions/onboarding";

export default function NicknameOnboardingPage() {
  const [state, formAction, pending] = useActionState(setNickname, undefined);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-black">
      <h1 className="text-xl font-bold text-black dark:text-zinc-50">
        사이트에서 사용할 닉네임을 설정해주세요
      </h1>
      <form action={formAction} className="flex flex-col items-center gap-3">
        <input
          name="nickname"
          type="text"
          maxLength={12}
          placeholder="2~12자 (한글/영문/숫자/_)"
          required
          className="rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-black px-6 py-2 text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
        >
          {pending ? "저장 중..." : "설정 완료"}
        </button>
      </form>
    </div>
  );
}
