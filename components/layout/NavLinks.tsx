"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const inactiveClass =
  "text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50";
const activeClass = "font-semibold text-indigo-600 dark:text-indigo-400";

export function NavLinks({
  showChat,
  showAdmin,
}: {
  showChat: boolean;
  showAdmin: boolean;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/boards/sell", label: "판매 게시판" },
    { href: "/boards/buy", label: "구매 게시판" },
    ...(showChat ? [{ href: "/chat", label: "채팅" }] : []),
    ...(showAdmin
      ? [
          { href: "/admin/bank-accounts", label: "계좌인증 관리" },
          { href: "/admin/reports", label: "신고 관리" },
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
            className={isActive ? activeClass : inactiveClass}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
