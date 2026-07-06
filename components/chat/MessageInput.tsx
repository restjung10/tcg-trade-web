"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

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
      setError(`전송 실패: ${insertError.message}`);
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
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="submit"
          disabled={sending || value.trim().length === 0}
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
        >
          전송
        </button>
      </form>
    </div>
  );
}
