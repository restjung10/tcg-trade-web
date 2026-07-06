import { LinkButton } from "@/components/ui/LinkButton";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="flex flex-col items-center gap-3 text-center">
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
    </div>
  );
}
