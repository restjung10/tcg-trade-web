"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/lib/ui";

export function MessageInput({
  roomId,
  senderId,
}: {
  roomId: string;
  senderId: string;
}) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const content = value.trim();
    if (!content || sending) return;

    setSending(true);
    setError(null);
    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("chat_messages")
      .insert({ room_id: roomId, sender_id: senderId, content });

    if (insertError) {
      if (insertError.code === "42501") {
        setError(
          "메시지를 보낼 권한이 없습니다. 계좌 인증이 필요하거나 계정이 제한되었을 수 있습니다.",
        );
      } else {
        setError(`전송 실패: ${insertError.message}`);
      }
    } else {
      setValue("");
    }
    setSending(false);
  };

  return (
    <div className="border-t border-zinc-300 dark:border-zinc-700">
      {error && <p className="px-3 pt-2 text-sm text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="flex gap-2 p-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="메시지를 입력하세요"
          maxLength={2000}
          className={`flex-1 ${inputClass}`}
        />
        <Button
          type="submit"
          disabled={sending || value.trim().length === 0}
        >
          전송
        </Button>
      </form>
    </div>
  );
}
