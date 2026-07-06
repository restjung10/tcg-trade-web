import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { reviewBankAccount } from "@/lib/actions/admin";

const STATUS_LABEL = {
  pending: "심사 중",
  approved: "승인됨",
  rejected: "반려됨",
} as const;

export default async function AdminBankAccountsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    notFound();
  }

  const { data: accounts, error: accountsError } = await supabase
    .from("bank_accounts")
    .select(
      "id, bank_name, account_number_encrypted, account_holder_name, status, rejection_reason, created_at, profiles!user_id(nickname)",
    )
    .order("status", { ascending: true })
    .order("created_at", { ascending: true });

  if (accountsError) {
    console.error("bank_accounts 조회 실패:", accountsError);
  }

  const rows = (accounts ?? []).map((row) => ({
    id: row.id,
    nickname:
      (row.profiles as unknown as { nickname: string } | null)?.nickname ??
      "알수없음",
    bankName: row.bank_name,
    accountHolderName: row.account_holder_name,
    accountNumber: (() => {
      try {
        return decrypt(row.account_number_encrypted);
      } catch {
        return "복호화 실패";
      }
    })(),
    status: row.status as keyof typeof STATUS_LABEL,
    rejectionReason: row.rejection_reason as string | null,
  }));

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <h1 className="mb-4 text-xl font-bold text-black dark:text-zinc-50">
        계좌 인증 관리
      </h1>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          신청 내역이 없습니다.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {rows.map((row) => (
            <li key={row.id} className="py-4">
              <div className="mb-2 text-sm">
                <p className="font-medium text-black dark:text-zinc-50">
                  {row.nickname} · {STATUS_LABEL[row.status]}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {row.bankName} · {row.accountHolderName} · {row.accountNumber}
                </p>
                {row.rejectionReason && (
                  <p className="text-red-500">
                    반려 사유: {row.rejectionReason}
                  </p>
                )}
              </div>
              {row.status === "pending" && (
                <div className="flex items-center gap-2">
                  <form action={reviewBankAccount.bind(null, row.id, "approved")}>
                    <button
                      type="submit"
                      className="rounded-md bg-black px-3 py-1.5 text-sm text-white dark:bg-zinc-50 dark:text-black"
                    >
                      승인
                    </button>
                  </form>
                  <form
                    action={reviewBankAccount.bind(null, row.id, "rejected")}
                    className="flex items-center gap-2"
                  >
                    <input
                      name="rejectionReason"
                      type="text"
                      placeholder="반려 사유(선택)"
                      className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                    />
                    <button
                      type="submit"
                      className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-500 dark:border-red-900"
                    >
                      거부
                    </button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
