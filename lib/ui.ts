export const inputClass =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export type PostStatusValue = "trading" | "reserved" | "completed";

export const STATUS_LABEL: Record<PostStatusValue, string> = {
  trading: "거래중",
  reserved: "예약중",
  completed: "거래완료",
};

export const STATUS_BADGE_CLASS: Record<PostStatusValue, string> = {
  trading:
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  reserved:
    "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  completed: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};
