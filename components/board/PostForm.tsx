"use client";

import { useActionState } from "react";
import { ImageUploader } from "@/components/board/ImageUploader";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/lib/ui";
import { CARD_TYPE_LABEL, type BoardType, type CardType } from "@/lib/validators/post";

type PostFormAction = (
  prevState: { error?: string } | undefined,
  formData: FormData,
) => Promise<{ error?: string } | undefined>;

export function PostForm({
  action,
  defaultValues,
  submitLabel,
  imageUpload,
}: {
  action: PostFormAction;
  defaultValues?: {
    cardType: CardType;
    title: string;
    content: string;
    price: number | null;
  };
  submitLabel: string;
  imageUpload?: { userId: string; boardType: BoardType };
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <select
        name="cardType"
        defaultValue={defaultValues?.cardType ?? "single"}
        required
        className={inputClass}
      >
        {(Object.entries(CARD_TYPE_LABEL) as [CardType, string][]).map(
          ([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ),
        )}
      </select>
      <input
        name="title"
        type="text"
        placeholder="제목 (2~100자)"
        defaultValue={defaultValues?.title}
        required
        className={inputClass}
      />
      <textarea
        name="content"
        placeholder="본문을 입력해주세요"
        defaultValue={defaultValues?.content}
        required
        rows={10}
        className={inputClass}
      />
      <input
        name="price"
        type="number"
        min={0}
        placeholder="가격 (선택, 원)"
        defaultValue={defaultValues?.price ?? ""}
        className={inputClass}
      />
      {imageUpload && (
        <ImageUploader
          userId={imageUpload.userId}
          boardType={imageUpload.boardType}
          required={imageUpload.boardType === "sell"}
        />
      )}
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "저장 중..." : submitLabel}
      </Button>
    </form>
  );
}
