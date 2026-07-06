import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ChatWindow, type ChatMessage } from "@/components/chat/ChatWindow";
import {
  TransactionPanel,
  type TradeTransaction,
} from "@/components/chat/TransactionPanel";

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
    .select(
      "id, buyer_id, seller_id, posts(id, title, board_type), buyer:profiles!buyer_id(nickname), seller:profiles!seller_id(nickname)",
    )
    .eq("id", roomId)
    .single();

  if (!room || (room.buyer_id !== user.id && room.seller_id !== user.id)) {
    notFound();
  }

  const isBuyer = room.buyer_id === user.id;
  const otherProfile = (isBuyer ? room.seller : room.buyer) as unknown as {
    nickname: string;
  } | null;
  const post = room.posts as unknown as {
    id: string;
    title: string;
    board_type: "sell" | "buy";
  } | null;

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, room_id, sender_id, content, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  // 판매글: 글쓴이(seller_id)가 실제 배송자, 채팅 건 사람(buyer_id)이 실제 입금자.
  // 구매글: 글쓴이가 실제 입금자, 채팅 건 사람이 실제 배송자.
  const boardType = post?.board_type ?? "sell";
  const payerId = boardType === "sell" ? room.buyer_id : room.seller_id;
  const shipperId = boardType === "sell" ? room.seller_id : room.buyer_id;

  const { data: transaction } = await supabase
    .from("trade_transactions")
    .select(
      "id, account_shared_at, payment_confirmed_at, tracking_number, shipped_at, completed_at, cancelled_at",
    )
    .eq("chat_room_id", roomId)
    .maybeSingle();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <div className="mb-4 flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <Link
          href="/chat"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← 채팅 목록
        </Link>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          {otherProfile?.nickname ?? "알수없음"}
          {post && (
            <>
              {" · "}
              <Link
                href={`/boards/${post.board_type}/${post.id}`}
                className="hover:underline"
              >
                {post.title}
              </Link>
            </>
          )}
        </div>
      </div>
      <TransactionPanel
        chatRoomId={roomId}
        currentUserId={user.id}
        payerId={payerId}
        shipperId={shipperId}
        initialTransaction={(transaction ?? null) as TradeTransaction | null}
      />
      <ChatWindow
        roomId={roomId}
        currentUserId={user.id}
        initialMessages={(messages ?? []) as ChatMessage[]}
      />
    </div>
  );
}
