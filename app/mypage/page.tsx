import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BankAccountForm } from "@/components/mypage/BankAccountForm";
import { WithdrawButton } from "@/components/mypage/WithdrawButton";
import { StatusBadge } from "@/components/board/StatusBadge";
import { BOARD_TITLE } from "@/lib/validators/post";
import type { PostStatusValue } from "@/lib/ui";

const BANK_STATUS_LABEL = {
  pending: "심사 중",
  approved: "승인됨",
  rejected: "반려됨",
} as const;

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, created_at")
    .eq("id", user.id)
    .single();

  const { data: myPosts } = await supabase
    .from("posts")
    .select("id, title, board_type, status, created_at")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  const { data: bankAccount } = await supabase
    .from("bank_accounts")
    .select("bank_name, account_holder_name, status, rejection_reason")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="mb-8 text-xl font-bold text-black dark:text-zinc-50">
        {profile?.nickname ?? "익명"}님, 환영합니다
      </h1>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-black dark:text-zinc-50">
          내가 쓴 글
        </h2>
        {myPosts && myPosts.length > 0 ? (
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
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            아직 작성한 글이 없습니다.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-black dark:text-zinc-50">
          계좌 인증
        </h2>
        {bankAccount && (
          <div className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              {bankAccount.bank_name} · {bankAccount.account_holder_name} ·{" "}
              <span className="font-medium">
                {BANK_STATUS_LABEL[bankAccount.status as keyof typeof BANK_STATUS_LABEL]}
              </span>
            </p>
            {bankAccount.status === "rejected" && bankAccount.rejection_reason && (
              <p className="mt-1 text-red-500">
                반려 사유: {bankAccount.rejection_reason}
              </p>
            )}
          </div>
        )}
        <BankAccountForm />
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
