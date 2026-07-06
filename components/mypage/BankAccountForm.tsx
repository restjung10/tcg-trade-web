"use client";

import { useActionState } from "react";
import { submitBankAccount } from "@/lib/actions/bankAccount";

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
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      <input
        name="accountHolderName"
        type="text"
        placeholder="예금주명"
        required
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      <input
        name="accountNumber"
        type="text"
        placeholder="계좌번호 (숫자만)"
        required
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
      >
        {pending ? "저장 중..." : "등록 / 재제출"}
      </button>
    </form>
  );
}
