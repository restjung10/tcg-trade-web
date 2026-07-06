"use client";

import { useActionState } from "react";
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
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "저장 중..." : "등록 / 재제출"}
      </Button>
    </form>
  );
}
