import Link from "next/link";
import type { BoardType } from "@/lib/validators/post";

export function Pagination({
  boardType,
  currentPage,
  totalPages,
  status,
  category,
  q,
  searchType,
}: {
  boardType: BoardType;
  currentPage: number;
  totalPages: number;
  status?: string;
  category?: string;
  q?: string;
  searchType?: string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const statusQuery = status && status !== "all" ? `&status=${status}` : "";
  const categoryQuery =
    category && category !== "all" ? `&category=${category}` : "";
  const qQuery = q ? `&q=${encodeURIComponent(q)}` : "";
  const searchTypeQuery =
    searchType && searchType !== "all" ? `&searchType=${searchType}` : "";

  return (
    <nav className="mt-4 flex justify-center gap-2 text-sm">
      {pages.map((page) => (
        <Link
          key={page}
          href={`/boards/${boardType}?page=${page}${statusQuery}${categoryQuery}${qQuery}${searchTypeQuery}`}
          className={`rounded px-2 py-1 ${
            page === currentPage
              ? "bg-indigo-600 text-white dark:bg-indigo-500"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          {page}
        </Link>
      ))}
    </nav>
  );
}
