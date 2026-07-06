import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 px-4 py-6 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      <div className="mx-auto flex max-w-4xl flex-col gap-2">
        <p>
          TCGinside는 통신판매중개자이며 통신판매의 당사자가 아닙니다. 상품
          등록 정보 및 거래(대금 결제, 배송, 하자 등)에 대한 책임은 거래
          당사자인 판매 회원과 구매 회원에게 있으며, TCGinside는 이에 대해
          원칙적으로 책임을 지지 않습니다.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/legal/terms" className="hover:underline">
            이용약관
          </Link>
          <Link href="/legal/privacy" className="hover:underline">
            개인정보처리방침
          </Link>
          <span>운영자 연락처: restjung10@naver.com</span>
        </div>
      </div>
    </footer>
  );
}
