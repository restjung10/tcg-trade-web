"use client";

import { useActionState } from "react";

type PostFormAction = (
  prevState: { error?: string } | undefined,
  formData: FormData,
) => Promise<{ error?: string } | undefined>;

export function PostForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: PostFormAction;
  defaultValues?: { title: string; content: string; price: number | null };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input
        name="title"
        type="text"
        placeholder="제목 (2~100자)"
        defaultValue={defaultValues?.title}
        required
        className="rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      <textarea
        name="content"
        placeholder="본문을 입력해주세요"
        defaultValue={defaultValues?.content}
        required
        rows={10}
        className="rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      <input
        name="price"
        type="number"
        min={0}
        placeholder="가격 (선택, 원)"
        defaultValue={defaultValues?.price ?? ""}
        className="rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-black px-6 py-2 text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
      >
        {pending ? "저장 중..." : submitLabel}
      </button>
    </form>
  );
}
