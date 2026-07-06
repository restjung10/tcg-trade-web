import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  PostListTable,
  type PostListItem,
} from "@/components/board/PostListTable";
import type { BoardType } from "@/lib/validators/post";

const HOME_LIST_SIZE = 10;

async function fetchRecentPosts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  boardType: BoardType,
): Promise<PostListItem[]> {
  const { data } = await supabase
    .from("posts")
    .select(
      "id, title, price, status, card_type, view_count, created_at, profiles(nickname)",
    )
    .eq("board_type", boardType)
    .order("bumped_at", { ascending: false })
    .limit(HOME_LIST_SIZE);

  return (data ?? []).map((row) => ({
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
}

export default async function Home() {
  const supabase = await createClient();
  const [sellPosts, buyPosts] = await Promise.all([
    fetchRecentPosts(supabase, "sell"),
    fetchRecentPosts(supabase, "buy"),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="mb-10 flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-bold text-black dark:text-zinc-50">
          TCG 카드 거래소
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          사기당할 일 없는 TCG 카드 거래 커뮤니티
        </p>
        <div className="mt-4 flex gap-3">
          <LinkButton href="/boards/sell" variant="primary">
            판매 게시판
          </LinkButton>
          <LinkButton href="/boards/buy" variant="secondary">
            구매 게시판
          </LinkButton>
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              최근 판매글
            </h2>
            <Link
              href="/boards/sell"
              className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
            >
              더보기
            </Link>
          </div>
          <PostListTable
            posts={sellPosts}
            boardType="sell"
            startIndex={sellPosts.length}
          />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              최근 구매글
            </h2>
            <Link
              href="/boards/buy"
              className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
            >
              더보기
            </Link>
          </div>
          <PostListTable
            posts={buyPosts}
            boardType="buy"
            startIndex={buyPosts.length}
          />
        </section>
      </div>
    </div>
  );
}
