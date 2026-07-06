export default function BlockedPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-4 text-center dark:bg-black">
      <h1 className="text-xl font-bold text-black dark:text-zinc-50">
        이용이 제한된 계정입니다
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        관리자에 의해 차단된 카카오 계정으로, 재가입 및 재로그인이
        불가능합니다.
      </p>
    </div>
  );
}
