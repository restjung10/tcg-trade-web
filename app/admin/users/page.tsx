import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  unsuspendUser,
  unbanKakaoUser,
  suspendUserDirect,
  banUserFromUserList,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/lib/ui";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
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

  // profiles의 suspended_at/suspension_reason/kakao_user_id는 anon/authenticated에
  // 공개되지 않는 컬럼이라(0017), 관리자 세션 클라이언트로도 조회할 수 없다.
  // service role(admin) 클라이언트로만 조회 가능하다.
  const admin = createAdminClient();

  const { q: qParam } = await searchParams;
  const searchQuery = (qParam ?? "").trim();

  let usersQuery = admin
    .from("profiles")
    .select("id, nickname, created_at, suspended_at, suspension_reason");

  if (searchQuery) {
    // PostgREST or()/ilike 필터 문법에 쓰이는 메타문자를 제거해 필터 인젝션을 막는다.
    const escaped = searchQuery.replace(/[%,()."]/g, "");
    if (escaped) {
      usersQuery = usersQuery.ilike("nickname", `%${escaped}%`);
    }
  }

  const { data: users } = await usersQuery
    .order("created_at", { ascending: false })
    .limit(50);

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
          회원 검색
        </h2>
        <form method="get" className="mb-4 flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="닉네임으로 검색"
            className={`${inputClass} flex-1 sm:flex-none`}
          />
          <Button type="submit" variant="secondary" size="sm">
            검색
          </Button>
        </form>
        {!searchQuery && (
          <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            검색어가 없으면 최근 가입한 50명만 표시합니다.
          </p>
        )}
        {users && users.length > 0 ? (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {users.map((row) => (
              <li key={row.id} className="py-3 text-sm">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-black dark:text-zinc-50">
                      {row.nickname}
                    </p>
                    <p className="text-zinc-500 dark:text-zinc-400">
                      가입일: {String(row.created_at).slice(0, 10)}
                      {row.suspended_at && (
                        <>
                          {" · "}
                          <span className="text-red-500">
                            정지됨 ({row.suspension_reason ?? "-"})
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  {row.suspended_at ? (
                    <form action={unsuspendUser.bind(null, row.id)}>
                      <Button type="submit" variant="secondary" size="sm">
                        정지 해제
                      </Button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2">
                      <form
                        action={suspendUserDirect.bind(null, row.id)}
                        className="flex items-center gap-2"
                      >
                        <input
                          name="suspensionReason"
                          type="text"
                          placeholder="정지 사유(선택)"
                          className={`${inputClass} py-1`}
                        />
                        <Button type="submit" variant="danger" size="sm">
                          정지
                        </Button>
                      </form>
                      <form
                        action={banUserFromUserList.bind(null, row.id)}
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
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {searchQuery ? "검색 결과가 없습니다." : "회원이 없습니다."}
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
