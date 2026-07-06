"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitBankAccount } from "@/lib/actions/bankAccount";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/lib/ui";

export function BankAccountForm() {
  const [state, formAction, pending] = useActionState(
    submitBankAccount,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        name="bankName"
        type="text"
        placeholder="은행명 (예: 국민은행)"
        required
        className={inputClass}
      />
      <input
        name="accountHolderName"
        type="text"
        placeholder="예금주명"
        required
        className={inputClass}
      />
      <input
        name="accountNumber"
        type="text"
        placeholder="계좌번호 (숫자만)"
        required
        className={inputClass}
      />
      <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <input type="checkbox" name="agreeBankInfo" required />
        [필수]{" "}
        <Link
          href="/legal/privacy"
          target="_blank"
          className="text-indigo-600 hover:underline dark:text-indigo-400"
        >
          계좌정보 수집·이용
        </Link>
        에 동의합니다
      </label>
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "저장 중..." : "등록 / 재제출"}
      </Button>
    </form>
  );
}
