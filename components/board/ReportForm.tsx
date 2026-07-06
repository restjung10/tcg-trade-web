"use client";

import { useActionState } from "react";
import { submitReport } from "@/lib/actions/reports";
import { REPORT_REASON_LABEL } from "@/lib/validators/report";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/lib/ui";
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
      <select name="reason" required className={inputClass}>
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
        className={inputClass}
      />
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      <Button type="submit" variant="danger" disabled={pending} className="self-start">
        {pending ? "제출 중..." : "신고하기"}
      </Button>
    </form>
  );
}
