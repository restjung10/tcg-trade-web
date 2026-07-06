import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatWindow, type ChatMessage } from "@/components/chat/ChatWindow";

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id, buyer_id, seller_id")
    .eq("id", roomId)
    .single();

  if (!room || (room.buyer_id !== user.id && room.seller_id !== user.id)) {
    notFound();
  }

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, room_id, sender_id, content, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <ChatWindow
        roomId={roomId}
        currentUserId={user.id}
        initialMessages={(messages ?? []) as ChatMessage[]}
      />
    </div>
  );
}
