import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { reviewBankAccount, banBankAccountUser } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/lib/ui";

const STATUS_LABEL = {
  pending: "심사 중",
  approved: "승인됨",
  rejected: "반려됨",
} as const;

const STATUS_TABS = [
  { value: "all", label: "전체" },
  { value: "pending", label: "대기" },
  { value: "approved", label: "승인" },
  { value: "rejected", label: "거부" },
] as const;

export default async function AdminBankAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: statusRows } = await supabase.rpc("get_my_account_status");

  if (statusRows?.[0]?.role !== "admin") {
    notFound();
  }

  const { status: statusParam } = await searchParams;
  const statusFilter = STATUS_TABS.some((tab) => tab.value === statusParam)
    ? statusParam!
    : "all";

  let accountsQuery = supabase
    .from("bank_accounts")
    .select(
      "id, user_id, bank_name, account_number_encrypted, account_holder_name, status, rejection_reason, created_at, profiles!user_id(nickname)",
    );

  if (statusFilter !== "all") {
    accountsQuery = accountsQuery.eq("status", statusFilter);
  }

  const { data: accounts, error: accountsError } = await accountsQuery
    .order("status", { ascending: true })
    .order("created_at", { ascending: true });

  if (accountsError) {
    console.error("bank_accounts 조회 실패:", accountsError);
  }

  const rows = (accounts ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
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
      <div className="mb-4 flex gap-2 text-sm">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/bank-accounts${tab.value === "all" ? "" : `?status=${tab.value}`}`}
            className={`rounded-full px-3 py-1 ${
              statusFilter === tab.value
                ? "bg-indigo-600 text-white dark:bg-indigo-500"
                : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
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
                    <Button type="submit" variant="primary" size="sm">
                      승인
                    </Button>
                  </form>
                  <form
                    action={reviewBankAccount.bind(null, row.id, "rejected")}
                    className="flex items-center gap-2"
                  >
                    <input
                      name="rejectionReason"
                      type="text"
                      placeholder="반려 사유(선택)"
                      className={`${inputClass} py-1`}
                    />
                    <Button type="submit" variant="danger" size="sm">
                      거부
                    </Button>
                  </form>
                </div>
              )}
              {row.status === "rejected" && (
                <form
                  action={banBankAccountUser.bind(null, row.userId)}
                  className="flex items-center gap-2"
                >
                  <input
                    name="banReason"
                    type="text"
                    placeholder="차단 사유(선택)"
                    className={`${inputClass} py-1`}
                  />
                  <Button type="submit" variant="danger" size="sm">
                    사용자 차단(재가입 금지)
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
