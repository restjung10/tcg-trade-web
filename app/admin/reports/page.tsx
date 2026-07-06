import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { REPORT_REASON_LABEL, type ReportReason } from "@/lib/validators/report";
import {
  deleteReportedPost,
  suspendReportedUser,
  banReportedUser,
  dismissReport,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/lib/ui";

export default async function AdminReportsPage() {
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

  const { data: reports } = await supabase
    .from("reports")
    .select(
      "id, reason, detail, created_at, posts(id, title, board_type, author_id, profiles(nickname)), reporter:profiles!reporter_id(nickname)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const rows = (reports ?? []).map((row) => {
    const post = row.posts as unknown as {
      id: string;
      title: string;
      board_type: "sell" | "buy";
      author_id: string;
      profiles: { nickname: string } | null;
    } | null;
    const reporter = row.reporter as unknown as { nickname: string } | null;

    return {
      id: row.id,
      reason: row.reason as ReportReason,
      detail: row.detail as string | null,
      reporterNickname: reporter?.nickname ?? "알수없음",
      post,
    };
  });

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <h1 className="mb-4 text-xl font-bold text-black dark:text-zinc-50">
        신고 처리
      </h1>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          대기 중인 신고가 없습니다.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {rows.map((row) => (
            <li key={row.id} className="py-4">
              <div className="mb-2 text-sm">
                <p className="font-medium text-black dark:text-zinc-50">
                  {REPORT_REASON_LABEL[row.reason]}
                  {row.post && (
                    <>
                      {" · "}
                      <Link
                        href={`/boards/${row.post.board_type}/${row.post.id}`}
                        className="hover:underline"
                      >
                        {row.post.title}
                      </Link>
                    </>
                  )}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  신고자: {row.reporterNickname} · 작성자:{" "}
                  {row.post?.profiles?.nickname ?? "알수없음"}
                </p>
                {row.detail && (
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                    상세: {row.detail}
                  </p>
                )}
              </div>
              {row.post && (
                <div className="flex flex-wrap items-center gap-2">
                  <form action={deleteReportedPost.bind(null, row.id, row.post.id)}>
                    <Button type="submit" variant="danger" size="sm">
                      게시글 삭제
                    </Button>
                  </form>
                  <form
                    action={suspendReportedUser.bind(
                      null,
                      row.id,
                      row.post.author_id,
                    )}
                    className="flex items-center gap-2"
                  >
                    <input
                      name="suspensionReason"
                      type="text"
                      placeholder="정지 사유(선택)"
                      className={`${inputClass} py-1`}
                    />
                    <Button type="submit" variant="danger" size="sm">
                      사용자 정지
                    </Button>
                  </form>
                  <form
                    action={banReportedUser.bind(
                      null,
                      row.id,
                      row.post.author_id,
                    )}
                    className="flex items-center gap-2"
                  >
                    <input
                      name="banReason"
                      type="text"
                      placeholder="차단 사유(선택)"
                      className={`${inputClass} py-1`}
                    />
                    <Button type="submit" variant="danger" size="sm">
                      차단(재가입 금지)
                    </Button>
                  </form>
                  <form action={dismissReport.bind(null, row.id)}>
                    <Button type="submit" variant="secondary" size="sm">
                      무시
                    </Button>
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
