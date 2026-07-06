import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-bold text-black dark:text-zinc-50">
          TCG 카드 거래소
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          사기당할 일 없는 TCG 카드 거래 커뮤니티
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/boards/sell"
            className="rounded-md bg-black px-4 py-2 text-sm text-white dark:bg-zinc-50 dark:text-black"
          >
            판매 게시판
          </Link>
          <Link
            href="/boards/buy"
            className="rounded-md bg-black px-4 py-2 text-sm text-white dark:bg-zinc-50 dark:text-black"
          >
            구매 게시판
          </Link>
        </div>
        <div className="mt-2 flex gap-3">
          <Link
            href="/login"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            로그인
          </Link>
          <Link
            href="/mypage"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            마이페이지
          </Link>
        </div>
      </div>
    </div>
  );
}
