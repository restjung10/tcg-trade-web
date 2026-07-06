import Link from "next/link";
import { CARD_TYPE_LABEL, type BoardType, type CardType } from "@/lib/validators/post";
import { StatusBadge } from "@/components/board/StatusBadge";
import type { PostStatusValue } from "@/lib/ui";

export type PostListItem = {
  id: string;
  title: string;
  price: number | null;
  status: PostStatusValue;
  cardType: CardType;
  view_count: number;
  created_at: string;
  author_nickname: string;
};

function formatDate(iso: string) {
  return iso.slice(0, 10);
}

function formatPrice(price: number | null) {
  if (price === null) return "-";
  return `${price.toLocaleString("ko-KR")}원`;
}

export function PostListTable({
  posts,
  boardType,
  startIndex,
}: {
  posts: PostListItem[];
  boardType: BoardType;
  startIndex: number;
}) {
  if (posts.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
        아직 등록된 게시글이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-300 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            <th className="hidden w-14 py-2 text-center font-normal sm:table-cell">
              번호
            </th>
            <th className="py-2 text-left font-normal">제목</th>
            <th className="hidden w-28 py-2 text-center font-normal md:table-cell">
              글쓴이
            </th>
            <th className="hidden w-24 py-2 text-center font-normal sm:table-cell">
              작성일
            </th>
            <th className="hidden w-16 py-2 text-center font-normal md:table-cell">
              조회
            </th>
            <th className="w-24 py-2 text-center font-normal">가격</th>
            <th className="w-20 py-2 text-center font-normal">상태</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post, index) => {
            const isCompleted = post.status === "completed";
            return (
              <tr
                key={post.id}
                className={`border-b border-zinc-200 dark:border-zinc-800 ${
                  isCompleted ? "bg-zinc-100 dark:bg-zinc-900" : ""
                }`}
              >
                <td className="hidden py-2 text-center text-zinc-500 dark:text-zinc-400 sm:table-cell">
                  {startIndex - index}
                </td>
                <td className="py-2">
                  <Link
                    href={`/boards/${boardType}/${post.id}`}
                    className={`hover:underline ${
                      isCompleted
                        ? "text-zinc-400 line-through dark:text-zinc-600"
                        : "text-black dark:text-zinc-50"
                    }`}
                  >
                    <span className="mr-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      [{CARD_TYPE_LABEL[post.cardType]}]
                    </span>
                    {post.title}
                  </Link>
                </td>
                <td className="hidden py-2 text-center text-zinc-600 dark:text-zinc-400 md:table-cell">
                  {post.author_nickname}
                </td>
                <td className="hidden py-2 text-center text-zinc-500 dark:text-zinc-400 sm:table-cell">
                  {formatDate(post.created_at)}
                </td>
                <td className="hidden py-2 text-center text-zinc-500 dark:text-zinc-400 md:table-cell">
                  {post.view_count}
                </td>
                <td className="py-2 text-center text-zinc-600 dark:text-zinc-400">
                  {formatPrice(post.price)}
                </td>
                <td className="py-2 text-center">
                  <StatusBadge status={post.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
