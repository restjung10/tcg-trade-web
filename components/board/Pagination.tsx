import Link from "next/link";
import type { BoardType } from "@/lib/validators/post";

export function Pagination({
  boardType,
  currentPage,
  totalPages,
}: {
  boardType: BoardType;
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="mt-4 flex justify-center gap-2 text-sm">
      {pages.map((page) => (
        <Link
          key={page}
          href={`/boards/${boardType}?page=${page}`}
          className={`rounded px-2 py-1 ${
            page === currentPage
              ? "bg-black text-white dark:bg-zinc-50 dark:text-black"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          {page}
        </Link>
      ))}
    </nav>
  );
}
