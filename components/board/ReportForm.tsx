"use client";

import { useActionState } from "react";
import { submitReport } from "@/lib/actions/reports";
import { REPORT_REASON_LABEL } from "@/lib/validators/report";
import type { BoardType } from "@/lib/validators/post";

export function ReportForm({
  boardType,
  postId,
}: {
  boardType: BoardType;
  postId: string;
}) {
  const action = submitReport.bind(null, boardType, postId);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <select
        name="reason"
        required
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      >
        {Object.entries(REPORT_REASON_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <textarea
        name="detail"
        placeholder="상세 내용 (선택)"
        rows={5}
        maxLength={1000}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
      >
        {pending ? "제출 중..." : "신고하기"}
      </button>
    </form>
  );
}
