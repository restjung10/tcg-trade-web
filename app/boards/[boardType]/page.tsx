import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  boardTypeSchema,
  BOARD_TITLE,
  CARD_TYPE_LABEL,
  type CardType,
} from "@/lib/validators/post";
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

const CATEGORY_TABS = [
  { value: "all", label: "전체" },
  ...(Object.entries(CARD_TYPE_LABEL) as [CardType, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
] as const;

const SEARCH_TYPE_OPTIONS = [
  { value: "all", label: "제목+내용" },
  { value: "author", label: "글쓴이" },
] as const;

export default async function BoardListPage({
  params,
  searchParams,
}: {
  params: Promise<{ boardType: string }>;
  searchParams: Promise<{
    page?: string;
    status?: string;
    category?: string;
    q?: string;
    searchType?: string;
  }>;
}) {
  const { boardType: boardTypeParam } = await params;
  const parsedBoardType = boardTypeSchema.safeParse(boardTypeParam);
  if (!parsedBoardType.success) {
    notFound();
  }
  const boardType = parsedBoardType.data;

  const {
    page: pageParam,
    status: statusParam,
    category: categoryParam,
    q: qParam,
    searchType: searchTypeParam,
  } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const statusFilter = STATUS_TABS.some((tab) => tab.value === statusParam)
    ? statusParam!
    : "all";
  const categoryFilter = CATEGORY_TABS.some((tab) => tab.value === categoryParam)
    ? categoryParam!
    : "all";
  const searchQuery = (qParam ?? "").trim();
  const searchType = SEARCH_TYPE_OPTIONS.some(
    (opt) => opt.value === searchTypeParam,
  )
    ? searchTypeParam!
    : "all";

  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select(
      "id, title, price, status, card_type, view_count, created_at, profiles(nickname)",
      { count: "exact" },
    )
    .eq("board_type", boardType);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  if (categoryFilter !== "all") {
    query = query.eq("card_type", categoryFilter);
  }

  if (searchQuery) {
    // PostgREST or()/ilike 필터 문법에 쓰이는 메타문자를 전부 제거해 필터 인젝션을 막는다.
    const escaped = searchQuery.replace(/[%,()."]/g, "");
    if (escaped) {
      if (searchType === "author") {
        const { data: matchingAuthors } = await supabase
          .from("profiles")
          .select("id")
          .ilike("nickname", `%${escaped}%`);
        const authorIds = (matchingAuthors ?? []).map((p) => p.id);
        query =
          authorIds.length > 0
            ? query.in("author_id", authorIds)
            : query.eq("author_id", "00000000-0000-0000-0000-000000000000");
      } else {
        query = query.or(`title.ilike.%${escaped}%,content.ilike.%${escaped}%`);
      }
    }
  }

  const { data, count } = await query
    .order("bumped_at", { ascending: false })
    .range(from, to);

  const posts: PostListItem[] = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    price: row.price,
    status: row.status,
    cardType: row.card_type,
    view_count: row.view_count,
    created_at: row.created_at,
    author_nickname:
      (row.profiles as unknown as { nickname: string } | null)?.nickname ??
      "알수없음",
  }));

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function buildQuery(overrides: { status?: string; category?: string }) {
    const merged = {
      status: overrides.status ?? statusFilter,
      category: overrides.category ?? categoryFilter,
    };
    const tabParams = new URLSearchParams();
    if (merged.status !== "all") tabParams.set("status", merged.status);
    if (merged.category !== "all") tabParams.set("category", merged.category);
    if (searchQuery) tabParams.set("q", searchQuery);
    if (searchType !== "all") tabParams.set("searchType", searchType);
    return tabParams.toString();
  }

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
      <div className="mb-3 flex gap-2 text-sm">
        {CATEGORY_TABS.map((tab) => {
          const qs = buildQuery({ category: tab.value });
          return (
            <Link
              key={tab.value}
              href={`/boards/${boardType}${qs ? `?${qs}` : ""}`}
              className={`rounded-full px-3 py-1 ${
                categoryFilter === tab.value
                  ? "bg-indigo-600 text-white dark:bg-indigo-500"
                  : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 text-sm">
          {STATUS_TABS.map((tab) => {
            const qs = buildQuery({ status: tab.value });
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
          {categoryFilter !== "all" && (
            <input type="hidden" name="category" value={categoryFilter} />
          )}
          <select
            name="searchType"
            defaultValue={searchType}
            className={inputClass}
          >
            {SEARCH_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder={searchType === "author" ? "글쓴이 검색" : "제목/본문 검색"}
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
        category={categoryFilter}
        q={searchQuery}
        searchType={searchType}
      />
    </div>
  );
}
