"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";

type ActionResult = { error?: string } | undefined;

async function getRoomContext(chatRoomId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." } as const;
  }

  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id, post_id, buyer_id, seller_id, posts(board_type)")
    .eq("id", chatRoomId)
    .single();

  if (!room || (room.buyer_id !== user.id && room.seller_id !== user.id)) {
    return { error: "채팅방을 찾을 수 없습니다." } as const;
  }

  const boardType = (
    room.posts as unknown as { board_type: "sell" | "buy" } | null
  )?.board_type;

  if (!boardType) {
    return { error: "게시글을 찾을 수 없습니다." } as const;
  }

  // 판매글: 글쓴이(seller_id)가 실제 배송자, 채팅 건 사람(buyer_id)이 실제 입금자.
  // 구매글: 글쓴이(seller_id로 저장돼있지만 실제로는 글쓴이)가 실제 입금자, 채팅 건 사람이 실제 배송자.
  const payerId = boardType === "sell" ? room.buyer_id : room.seller_id;
  const shipperId = boardType === "sell" ? room.seller_id : room.buyer_id;

  return {
    userId: user.id,
    postId: room.post_id,
    payerId,
    shipperId,
  } as const;
}

export async function shareAccount(chatRoomId: string): Promise<ActionResult> {
  const ctx = await getRoomContext(chatRoomId);
  if ("error" in ctx) {
    return { error: ctx.error };
  }
  const { userId, postId, payerId, shipperId } = ctx;

  if (userId !== shipperId) {
    return { error: "본인이 물건을 보내는 쪽일 때만 계좌를 전송할 수 있습니다." };
  }

  const admin = createAdminClient();

  const { data: bankAccount } = await admin
    .from("bank_accounts")
    .select("status")
    .eq("user_id", shipperId)
    .maybeSingle();

  if (bankAccount?.status !== "approved") {
    return {
      error:
        "계좌 인증이 완료되어야 계좌를 전송할 수 있습니다. 마이페이지에서 계좌를 등록하고 승인을 받아주세요.",
    };
  }

  const { data: existing } = await admin
    .from("trade_transactions")
    .select("id, account_shared_at")
    .eq("chat_room_id", chatRoomId)
    .maybeSingle();

  if (existing?.account_shared_at) {
    return { error: "이미 계좌를 전송했습니다." };
  }

  if (existing) {
    await admin
      .from("trade_transactions")
      .update({ account_shared_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await admin.from("trade_transactions").insert({
      chat_room_id: chatRoomId,
      post_id: postId,
      payer_id: payerId,
      shipper_id: shipperId,
      account_shared_at: new Date().toISOString(),
    });
  }

  await admin.from("posts").update({ status: "reserved" }).eq("id", postId);

  revalidatePath(`/chat/${chatRoomId}`);
}

export async function confirmPayment(chatRoomId: string): Promise<ActionResult> {
  const ctx = await getRoomContext(chatRoomId);
  if ("error" in ctx) {
    return { error: ctx.error };
  }
  const { userId, payerId } = ctx;

  if (userId !== payerId) {
    return { error: "본인이 입금하는 쪽일 때만 입금완료를 표시할 수 있습니다." };
  }

  const admin = createAdminClient();
  const { data: tx } = await admin
    .from("trade_transactions")
    .select("id, account_shared_at, payment_confirmed_at")
    .eq("chat_room_id", chatRoomId)
    .maybeSingle();

  if (!tx?.account_shared_at) {
    return { error: "아직 계좌 정보를 받지 못했습니다." };
  }
  if (tx.payment_confirmed_at) {
    return { error: "이미 입금완료를 표시했습니다." };
  }

  await admin
    .from("trade_transactions")
    .update({ payment_confirmed_at: new Date().toISOString() })
    .eq("id", tx.id);

  revalidatePath(`/chat/${chatRoomId}`);
}

export async function shareTracking(
  chatRoomId: string,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await getRoomContext(chatRoomId);
  if ("error" in ctx) {
    return { error: ctx.error };
  }
  const { userId, shipperId } = ctx;

  if (userId !== shipperId) {
    return { error: "본인이 물건을 보내는 쪽일 때만 송장번호를 전송할 수 있습니다." };
  }

  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
  if (!trackingNumber || trackingNumber.length > 50) {
    return { error: "송장번호를 올바르게 입력해주세요." };
  }

  const admin = createAdminClient();
  const { data: tx } = await admin
    .from("trade_transactions")
    .select("id, payment_confirmed_at, shipped_at")
    .eq("chat_room_id", chatRoomId)
    .maybeSingle();

  if (!tx?.payment_confirmed_at) {
    return { error: "아직 입금이 확인되지 않았습니다." };
  }
  if (tx.shipped_at) {
    return { error: "이미 송장번호를 전송했습니다." };
  }

  await admin
    .from("trade_transactions")
    .update({
      tracking_number: trackingNumber,
      shipped_at: new Date().toISOString(),
    })
    .eq("id", tx.id);

  revalidatePath(`/chat/${chatRoomId}`);
}

export async function confirmReceipt(chatRoomId: string): Promise<ActionResult> {
  const ctx = await getRoomContext(chatRoomId);
  if ("error" in ctx) {
    return { error: ctx.error };
  }
  const { userId, payerId } = ctx;

  if (userId !== payerId) {
    return { error: "본인이 입금하는 쪽일 때만 수령확인을 할 수 있습니다." };
  }

  const admin = createAdminClient();
  const { data: tx } = await admin
    .from("trade_transactions")
    .select("id, shipped_at, completed_at")
    .eq("chat_room_id", chatRoomId)
    .maybeSingle();

  if (!tx?.shipped_at) {
    return { error: "아직 송장번호가 전송되지 않았습니다." };
  }
  if (tx.completed_at) {
    return { error: "이미 거래가 완료되었습니다." };
  }

  await admin
    .from("trade_transactions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", tx.id);

  revalidatePath(`/chat/${chatRoomId}`);
}

export async function submitReview(
  chatRoomId: string,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await getRoomContext(chatRoomId);
  if ("error" in ctx) {
    return { error: ctx.error };
  }
  const { userId, payerId, shipperId } = ctx;

  const revieweeId =
    userId === payerId ? shipperId : userId === shipperId ? payerId : null;

  if (!revieweeId) {
    return { error: "거래 참여자만 후기를 남길 수 있습니다." };
  }

  const rating = Number(formData.get("rating"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "별점을 선택해주세요." };
  }

  const comment = String(formData.get("comment") ?? "").trim().slice(0, 300);

  const admin = createAdminClient();
  const { data: tx } = await admin
    .from("trade_transactions")
    .select("id, completed_at")
    .eq("chat_room_id", chatRoomId)
    .maybeSingle();

  if (!tx?.completed_at) {
    return { error: "거래가 완료된 후에만 후기를 남길 수 있습니다." };
  }

  const { error } = await admin.from("trade_reviews").insert({
    trade_transaction_id: tx.id,
    reviewer_id: userId,
    reviewee_id: revieweeId,
    rating,
    comment: comment || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 후기를 작성했습니다." };
    }
    return { error: "후기 작성 중 오류가 발생했습니다." };
  }

  revalidatePath(`/chat/${chatRoomId}`);
}

export async function getSharedAccountInfo(chatRoomId: string) {
  const ctx = await getRoomContext(chatRoomId);
  if ("error" in ctx) {
    return null;
  }
  const { shipperId } = ctx;

  const admin = createAdminClient();
  const { data: tx } = await admin
    .from("trade_transactions")
    .select("account_shared_at")
    .eq("chat_room_id", chatRoomId)
    .maybeSingle();

  if (!tx?.account_shared_at) {
    return null;
  }

  const { data: bankAccount } = await admin
    .from("bank_accounts")
    .select("bank_name, account_holder_name, account_number_encrypted")
    .eq("user_id", shipperId)
    .maybeSingle();

  if (!bankAccount) {
    return null;
  }

  try {
    return {
      bankName: bankAccount.bank_name,
      accountHolderName: bankAccount.account_holder_name,
      accountNumber: decrypt(bankAccount.account_number_encrypted),
    };
  } catch {
    return null;
  }
}
