"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const inactiveClass =
  "text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50";
const activeClass = "font-semibold text-indigo-600 dark:text-indigo-400";

export function NavLinks({
  showChat,
  showAdmin,
  unreadChatCount = 0,
}: {
  showChat: boolean;
  showAdmin: boolean;
  unreadChatCount?: number;
}) {
  const pathname = usePathname();

  const links: { href: string; label: string; badge?: number }[] = [
    { href: "/boards/sell", label: "판매 게시판" },
    { href: "/boards/buy", label: "구매 게시판" },
    ...(showChat ? [{ href: "/chat", label: "채팅", badge: unreadChatCount }] : []),
    ...(showAdmin
      ? [
          { href: "/admin/bank-accounts", label: "계좌인증 관리" },
          { href: "/admin/reports", label: "신고 관리" },
          { href: "/admin/users", label: "사용자 관리" },
        ]
      : []),
  ];

  return (
    <>
      {links.map((link) => {
        const isActive =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`inline-flex items-center gap-1 ${
              isActive ? activeClass : inactiveClass
            }`}
          >
            {link.label}
            {!!link.badge && link.badge > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {link.badge > 9 ? "9+" : link.badge}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
}
