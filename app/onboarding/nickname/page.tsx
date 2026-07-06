"use client";

import { useActionState } from "react";
import Link from "next/link";
import { setNickname } from "@/lib/actions/onboarding";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/lib/ui";

export default function NicknameOnboardingPage() {
  const [state, formAction, pending] = useActionState(setNickname, undefined);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-black">
      <h1 className="text-xl font-bold text-black dark:text-zinc-50">
        사이트에서 사용할 닉네임을 설정해주세요
      </h1>
      <form action={formAction} className="flex w-full max-w-xs flex-col items-stretch gap-3">
        <input
          name="nickname"
          type="text"
          maxLength={12}
          placeholder="2~12자 (한글/영문/숫자/_)"
          required
          className={inputClass}
        />
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input type="checkbox" name="agreeTerms" required />
          [필수]{" "}
          <Link
            href="/legal/terms"
            target="_blank"
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            이용약관
          </Link>
          에 동의합니다
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input type="checkbox" name="agreePrivacy" required />
          [필수]{" "}
          <Link
            href="/legal/privacy"
            target="_blank"
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            개인정보 수집·이용
          </Link>
          에 동의합니다
        </label>
        {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
        <Button type="submit" disabled={pending} className="self-center">
          {pending ? "저장 중..." : "설정 완료"}
        </Button>
      </form>
    </div>
  );
}
