import Link from "next/link";
import type { BoardType } from "@/lib/validators/post";

export type PostListItem = {
  id: string;
  title: string;
  price: number | null;
  status: "trading" | "reserved" | "completed";
  view_count: number;
  created_at: string;
  author_nickname: string;
};

const STATUS_LABEL: Record<PostListItem["status"], string> = {
  trading: "거래중",
  reserved: "예약중",
  completed: "거래완료",
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
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-zinc-300 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          <th className="w-14 py-2 text-center font-normal">번호</th>
          <th className="py-2 text-left font-normal">제목</th>
          <th className="w-28 py-2 text-center font-normal">글쓴이</th>
          <th className="w-24 py-2 text-center font-normal">작성일</th>
          <th className="w-16 py-2 text-center font-normal">조회</th>
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
              <td className="py-2 text-center text-zinc-500 dark:text-zinc-400">
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
                  {post.title}
                </Link>
              </td>
              <td className="py-2 text-center text-zinc-600 dark:text-zinc-400">
                {post.author_nickname}
              </td>
              <td className="py-2 text-center text-zinc-500 dark:text-zinc-400">
                {formatDate(post.created_at)}
              </td>
              <td className="py-2 text-center text-zinc-500 dark:text-zinc-400">
                {post.view_count}
              </td>
              <td className="py-2 text-center text-zinc-600 dark:text-zinc-400">
                {formatPrice(post.price)}
              </td>
              <td className="py-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
                {STATUS_LABEL[post.status]}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
