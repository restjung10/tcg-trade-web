"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { BoardType } from "@/lib/validators/post";

export function AuthorMenu({
  nickname,
  boardType,
}: {
  nickname: string;
  boardType: BoardType;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <span ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="hover:underline"
      >
        {nickname}
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded border border-zinc-300 bg-white shadow-md dark:border-zinc-700 dark:bg-zinc-900">
          <Link
            href={`/boards/${boardType}?q=${encodeURIComponent(nickname)}&searchType=author`}
            className="block px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            onClick={() => setOpen(false)}
          >
            작성글 보기
          </Link>
        </div>
      )}
    </span>
  );
}
