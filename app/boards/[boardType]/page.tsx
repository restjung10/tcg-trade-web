import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { boardTypeSchema } from "@/lib/validators/post";
import {
  PostListTable,
  type PostListItem,
} from "@/components/board/PostListTable";
import { Pagination } from "@/components/board/Pagination";

const PAGE_SIZE = 20;

const BOARD_TITLE = { sell: "판매 게시판", buy: "구매 게시판" } as const;

export default async function BoardListPage({
  params,
  searchParams,
}: {
  params: Promise<{ boardType: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { boardType: boardTypeParam } = await params;
  const parsedBoardType = boardTypeSchema.safeParse(boardTypeParam);
  if (!parsedBoardType.success) {
    notFound();
  }
  const boardType = parsedBoardType.data;

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data, count } = await supabase
    .from("posts")
    .select(
      "id, title, price, status, view_count, created_at, profiles(nickname)",
      { count: "exact" },
    )
    .eq("board_type", boardType)
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-black dark:text-zinc-50">
          {BOARD_TITLE[boardType]}
        </h1>
        <Link
          href={`/boards/${boardType}/write`}
          className="rounded-md bg-black px-4 py-2 text-sm text-white dark:bg-zinc-50 dark:text-black"
        >
          글쓰기
        </Link>
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
      />
    </div>
  );
}
