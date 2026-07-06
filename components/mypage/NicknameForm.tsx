"use client";

import { useActionState } from "react";
import { changeNickname } from "@/lib/actions/nickname";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/lib/ui";

export function NicknameForm({
  currentNickname,
  nextChangeAvailableAt,
}: {
  currentNickname: string;
  nextChangeAvailableAt: string | null;
}) {
  const [state, formAction, pending] = useActionState(changeNickname, undefined);
  const locked = Boolean(nextChangeAvailableAt) && !state?.success;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        현재 닉네임:{" "}
        <span className="font-medium text-black dark:text-zinc-50">
          {currentNickname}
        </span>
      </p>
      {locked ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          닉네임은 한 달에 한 번만 변경할 수 있습니다. 다음 변경 가능일:{" "}
          {nextChangeAvailableAt}
        </p>
      ) : (
        <form action={formAction} className="flex gap-2">
          <input
            name="nickname"
            type="text"
            placeholder="새 닉네임 (2~12자)"
            required
            className={inputClass}
          />
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "변경 중..." : "변경"}
          </Button>
        </form>
      )}
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          닉네임이 변경되었습니다.
        </p>
      )}
    </div>
  );
}
