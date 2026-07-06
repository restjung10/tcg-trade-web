import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { unsuspendUser, unbanKakaoUser } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";

export default async function AdminUsersPage() {
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

  // profiles의 suspended_at/suspension_reason/kakao_user_id는 anon/authenticated에
  // 공개되지 않는 컬럼이라(0017), 관리자 세션 클라이언트로도 조회할 수 없다.
  // service role(admin) 클라이언트로만 조회 가능하다.
  const admin = createAdminClient();

  const { data: suspended } = await admin
    .from("profiles")
    .select("id, nickname, suspended_at, suspension_reason")
    .not("suspended_at", "is", null)
    .order("suspended_at", { ascending: false });

  const { data: blocked } = await admin
    .from("blocked_kakao_users")
    .select("kakao_user_id, reason, blocked_at")
    .order("blocked_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-xl font-bold text-black dark:text-zinc-50">
        사용자 관리
      </h1>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-black dark:text-zinc-50">
          정지된 사용자
        </h2>
        {suspended && suspended.length > 0 ? (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {suspended.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-black dark:text-zinc-50">
                    {row.nickname}
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    사유: {row.suspension_reason ?? "-"} ·{" "}
                    {String(row.suspended_at).slice(0, 10)}
                  </p>
                </div>
                <form action={unsuspendUser.bind(null, row.id)}>
                  <Button type="submit" variant="secondary" size="sm">
                    정지 해제
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            정지된 사용자가 없습니다.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-black dark:text-zinc-50">
          차단된 카카오 계정
        </h2>
        {blocked && blocked.length > 0 ? (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {blocked.map((row) => (
              <li
                key={row.kakao_user_id}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-black dark:text-zinc-50">
                    ****{row.kakao_user_id.slice(-4)}
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    사유: {row.reason} · {String(row.blocked_at).slice(0, 10)}
                  </p>
                </div>
                <form action={unbanKakaoUser.bind(null, row.kakao_user_id)}>
                  <Button type="submit" variant="secondary" size="sm">
                    차단 해제
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            차단된 계정이 없습니다.
          </p>
        )}
      </section>
    </div>
  );
}
