import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { boardTypeSchema, BOARD_TITLE } from "@/lib/validators/post";
import {
  PostListTable,
  type PostListItem,
} from "@/components/board/PostListTable";
import { Pagination } from "@/components/board/Pagination";
import { LinkButton } from "@/components/ui/LinkButton";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/lib/ui";
import Link from "next/link";

const PAGE_SIZE = 20;

const STATUS_TABS = [
  { value: "all", label: "전체" },
  { value: "trading", label: "거래중" },
  { value: "completed", label: "거래완료" },
] as const;

export default async function BoardListPage({
  params,
  searchParams,
}: {
  params: Promise<{ boardType: string }>;
  searchParams: Promise<{ page?: string; status?: string; q?: string }>;
}) {
  const { boardType: boardTypeParam } = await params;
  const parsedBoardType = boardTypeSchema.safeParse(boardTypeParam);
  if (!parsedBoardType.success) {
    notFound();
  }
  const boardType = parsedBoardType.data;

  const { page: pageParam, status: statusParam, q: qParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const statusFilter = STATUS_TABS.some((tab) => tab.value === statusParam)
    ? statusParam!
    : "all";
  const searchQuery = (qParam ?? "").trim();

  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select(
      "id, title, price, status, view_count, created_at, profiles(nickname)",
      { count: "exact" },
    )
    .eq("board_type", boardType);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  if (searchQuery) {
    // PostgREST or() 필터 문법에 쓰이는 메타문자를 전부 제거해 필터 인젝션을 막는다.
    const escaped = searchQuery.replace(/[%,()."]/g, "");
    if (escaped) {
      query = query.or(`title.ilike.%${escaped}%,content.ilike.%${escaped}%`);
    }
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const posts: PostListItem[] = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    price: row.price,
    status: row.status,
    view_count: row.view_count,
    created_at: row.created_at,
    author_nickname:
      (row.profiles as unknown as { nickname: string } | null)?.nickname ??
      "알수없음",
  }));

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-black dark:text-zinc-50">
          {BOARD_TITLE[boardType]}
        </h1>
        <LinkButton href={`/boards/${boardType}/write`} variant="primary">
          글쓰기
        </LinkButton>
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 text-sm">
          {STATUS_TABS.map((tab) => {
            const tabParams = new URLSearchParams();
            if (tab.value !== "all") tabParams.set("status", tab.value);
            if (searchQuery) tabParams.set("q", searchQuery);
            const qs = tabParams.toString();
            return (
              <Link
                key={tab.value}
                href={`/boards/${boardType}${qs ? `?${qs}` : ""}`}
                className={`rounded-full px-3 py-1 ${
                  statusFilter === tab.value
                    ? "bg-indigo-600 text-white dark:bg-indigo-500"
                    : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <form method="get" className="flex gap-2">
          {statusFilter !== "all" && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="제목/본문 검색"
            className={`${inputClass} flex-1 sm:flex-none`}
          />
          <Button type="submit" variant="secondary" size="sm">
            검색
          </Button>
        </form>
      </div>
      <PostListTable
        posts={posts}
        boardType={boardType}
        startIndex={(count ?? 0) - from}
      />
      <Pagination
        boardType={boardType}
        currentPage={page}
        totalPages={totalPages}
        status={statusFilter}
        q={searchQuery}
      />
    </div>
  );
}
