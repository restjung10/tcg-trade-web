"use client";

import { useState } from "react";
import { BankAccountForm } from "@/components/mypage/BankAccountForm";

const BANK_STATUS_LABEL = {
  pending: "심사 중",
  approved: "승인됨",
  rejected: "반려됨",
} as const;

export function BankAccountSection({
  bankAccount,
}: {
  bankAccount: {
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    status: keyof typeof BANK_STATUS_LABEL;
    rejectionReason: string | null;
  } | null;
}) {
  const [showForm, setShowForm] = useState(false);

  if (!bankAccount) {
    return <BankAccountForm />;
  }

  const isApproved = bankAccount.status === "approved";

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        <p className="flex flex-wrap items-center gap-2">
          <span>
            {bankAccount.bankName} · {bankAccount.accountHolderName} ·{" "}
            {bankAccount.accountNumber}
          </span>
          <span className="font-medium text-black dark:text-zinc-50">
            [{BANK_STATUS_LABEL[bankAccount.status]}]
          </span>
          {isApproved && !showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="text-indigo-600 hover:underline dark:text-indigo-400"
            >
              [수정/재승인 신청]
            </button>
          )}
        </p>
        {bankAccount.status === "rejected" && bankAccount.rejectionReason && (
          <p className="mt-1 text-red-500">
            반려 사유: {bankAccount.rejectionReason}
          </p>
        )}
      </div>
      {(!isApproved || showForm) && <BankAccountForm />}
    </div>
  );
}
