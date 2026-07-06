import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BankAccountSection } from "@/components/mypage/BankAccountSection";
import { NicknameForm } from "@/components/mypage/NicknameForm";
import { WithdrawButton } from "@/components/mypage/WithdrawButton";
import { StatusBadge } from "@/components/board/StatusBadge";
import { BOARD_TITLE } from "@/lib/validators/post";
import type { PostStatusValue } from "@/lib/ui";
import { decrypt } from "@/lib/crypto";

const POSTS_PAGE_SIZE = 5;

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * POSTS_PAGE_SIZE;
  const to = from + POSTS_PAGE_SIZE - 1;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .single();

  const { data: statusRows } = await supabase.rpc("get_my_account_status");
  const nicknameChangedAt = statusRows?.[0]?.nickname_changed_at as
    | string
    | null
    | undefined;

  let nextChangeAvailableAt: string | null = null;
  if (nicknameChangedAt) {
    const next = new Date(nicknameChangedAt);
    next.setDate(next.getDate() + 30);
    if (next.getTime() > Date.now()) {
      nextChangeAvailableAt = next.toISOString().slice(0, 10);
    }
  }

  const { data: myPosts, count } = await supabase
    .from("posts")
    .select("id, title, board_type, status, created_at", { count: "exact" })
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / POSTS_PAGE_SIZE));

  const { data: bankAccount } = await supabase
    .from("bank_accounts")
    .select(
      "bank_name, account_holder_name, account_number_encrypted, status, rejection_reason",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const bankAccountView = bankAccount
    ? {
        bankName: bankAccount.bank_name,
        accountHolderName: bankAccount.account_holder_name,
        accountNumber: (() => {
          try {
            return decrypt(bankAccount.account_number_encrypted);
          } catch {
            return "복호화 실패";
          }
        })(),
        status: bankAccount.status as "pending" | "approved" | "rejected",
        rejectionReason: bankAccount.rejection_reason as string | null,
      }
    : null;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="mb-8 text-xl font-bold text-black dark:text-zinc-50">
        {profile?.nickname ?? "익명"}님, 환영합니다
      </h1>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-black dark:text-zinc-50">
          닉네임 변경
        </h2>
        <NicknameForm
          currentNickname={profile?.nickname ?? ""}
          nextChangeAvailableAt={nextChangeAvailableAt}
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-black dark:text-zinc-50">
          계좌 인증
        </h2>
        <BankAccountSection bankAccount={bankAccountView} />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-black dark:text-zinc-50">
          내가 쓴 글
        </h2>
        {myPosts && myPosts.length > 0 ? (
          <>
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {myPosts.map((post) => (
                <li key={post.id} className="py-2">
                  <Link
                    href={`/boards/${post.board_type}/${post.id}`}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-black dark:text-zinc-50">
                      {post.title}
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {BOARD_TITLE[post.board_type as "sell" | "buy"]}
                      <StatusBadge status={post.status as PostStatusValue} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <nav className="mt-4 flex justify-center gap-2 text-sm">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <Link
                      key={p}
                      href={`/mypage?page=${p}`}
                      className={`rounded px-2 py-1 ${
                        p === page
                          ? "bg-indigo-600 text-white dark:bg-indigo-500"
                          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {p}
                    </Link>
                  ),
                )}
              </nav>
            )}
          </>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            아직 작성한 글이 없습니다.
          </p>
        )}
      </section>

      <section className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="mb-3 text-lg font-semibold text-black dark:text-zinc-50">
          회원탈퇴
        </h2>
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
          탈퇴 시 닉네임/프로필 사진/카카오 계정 연동 정보는 삭제되며 즉시
          로그아웃됩니다. 작성한 게시글과 채팅 기록은 거래 상대방 보호를 위해
          남아있으며, 같은 카카오 계정으로 다시 로그인하면 계정을 이어서
          사용할 수 있습니다.
        </p>
        <WithdrawButton />
      </section>
    </div>
  );
}
