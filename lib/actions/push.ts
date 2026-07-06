"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWebPush } from "@/lib/push/webpush";

export async function notifyNewMessage(roomId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { data: room } = await supabase
    .from("chat_rooms")
    .select("buyer_id, seller_id")
    .eq("id", roomId)
    .single();

  if (!room || (room.buyer_id !== user.id && room.seller_id !== user.id)) {
    return;
  }

  const recipientId = room.buyer_id === user.id ? room.seller_id : room.buyer_id;

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .single();
  const senderNickname = senderProfile?.nickname ?? "알수없음";

  const admin = createAdminClient();
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", recipientId);

  if (!subscriptions || subscriptions.length === 0) {
    return;
  }

  const webpush = getWebPush();
  const payload = JSON.stringify({
    title: senderNickname,
    body: content.slice(0, 50),
    url: `/chat/${roomId}`,
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }),
  );
}
