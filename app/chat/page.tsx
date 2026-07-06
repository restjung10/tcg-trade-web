import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatRoomList, type ChatRoomSummary } from "@/components/chat/ChatRoomList";
import { PushNotificationToggle } from "@/components/chat/PushNotificationToggle";

export default async function ChatListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("chat_room_summaries")
    .select(
      "room_id, post_title, buyer_id, seller_id, buyer_nickname, seller_nickname, buyer_last_read_at, seller_last_read_at, last_message, last_message_at",
    )
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  const rooms: ChatRoomSummary[] = (data ?? []).map((room) => {
    const isBuyer = room.buyer_id === user.id;
    const myLastRead = isBuyer ? room.buyer_last_read_at : room.seller_last_read_at;
    const unread = Boolean(
      room.last_message_at && new Date(room.last_message_at) > new Date(myLastRead),
    );

    return {
      room_id: room.room_id,
      post_title: room.post_title,
      other_nickname: isBuyer ? room.seller_nickname : room.buyer_nickname,
      last_message: room.last_message,
      unread,
    };
  });

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="mb-4 text-xl font-bold text-black dark:text-zinc-50">
        채팅
      </h1>
      <PushNotificationToggle />
      <ChatRoomList rooms={rooms} />
    </div>
  );
}
