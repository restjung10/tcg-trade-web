import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { LinkButton } from "@/components/ui/LinkButton";
import { NavLinks } from "@/components/layout/NavLinks";

const navLinkClass =
  "text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nickname: string | null = null;
  let role: string | null = null;
  let unreadChatCount = 0;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", user.id)
      .single();
    nickname = profile?.nickname ?? null;

    const { data: statusRows } = await supabase.rpc("get_my_account_status");
    role = statusRows?.[0]?.role ?? null;

    const { data: rooms } = await supabase
      .from("chat_room_summaries")
      .select("buyer_id, seller_id, buyer_last_read_at, seller_last_read_at, last_message_at")
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

    unreadChatCount = (rooms ?? []).filter((room) => {
      const isBuyer = room.buyer_id === user.id;
      const myLastRead = isBuyer ? room.buyer_last_read_at : room.seller_last_read_at;
      return (
        room.last_message_at && new Date(room.last_message_at) > new Date(myLastRead)
      );
    }).length;
  }

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Link
            href="/"
            className="text-base font-bold text-black dark:text-zinc-50"
          >
            TCGinside
          </Link>
          <NavLinks
            showChat={Boolean(user)}
            showAdmin={role === "admin"}
            unreadChatCount={unreadChatCount}
          />
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link href="/mypage" className={navLinkClass}>
                {nickname ?? "마이페이지"}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <LinkButton href="/login" variant="primary" size="sm">
              로그인
            </LinkButton>
          )}
        </div>
      </div>
    </header>
  );
}
