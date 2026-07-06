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
    .select("id, account_shared_at, cancelled_at")
    .eq("chat_room_id", chatRoomId)
    .maybeSingle();

  if (existing?.account_shared_at && !existing.cancelled_at) {
    return { error: "이미 계좌를 전송했습니다." };
  }

  // 이중거래 방지: 같은 게시글의 다른 채팅방에서 이미 진행 중인(취소/완료되지 않은) 거래가 있으면 막는다.
  const { data: otherActive } = await admin
    .from("trade_transactions")
    .select("id")
    .eq("post_id", postId)
    .not("chat_room_id", "eq", chatRoomId)
    .not("account_shared_at", "is", null)
    .is("completed_at", null)
    .is("cancelled_at", null)
    .maybeSingle();

  if (otherActive) {
    return { error: "이미 다른 구매자와 거래가 진행 중입니다." };
  }

  if (existing) {
    // 취소된 거래를 재시작하는 경우, 이전 단계 값들을 전부 초기화하고 처음부터 진행한다.
    await admin
      .from("trade_transactions")
      .update({
        account_shared_at: new Date().toISOString(),
        payment_confirmed_at: null,
        tracking_number: null,
        shipped_at: null,
        completed_at: null,
        cancelled_at: null,
      })
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

export async function cancelTrade(chatRoomId: string): Promise<ActionResult> {
  const ctx = await getRoomContext(chatRoomId);
  if ("error" in ctx) {
    return { error: ctx.error };
  }
  const { userId, postId, payerId, shipperId } = ctx;

  if (userId !== payerId && userId !== shipperId) {
    return { error: "거래 참여자만 취소할 수 있습니다." };
  }

  const admin = createAdminClient();
  const { data: tx } = await admin
    .from("trade_transactions")
    .select("id, account_shared_at, completed_at, cancelled_at")
    .eq("chat_room_id", chatRoomId)
    .maybeSingle();

  if (!tx?.account_shared_at) {
    return { error: "아직 진행 중인 거래가 없습니다." };
  }
  if (tx.completed_at) {
    return { error: "이미 완료된 거래는 취소할 수 없습니다." };
  }
  if (tx.cancelled_at) {
    return { error: "이미 취소된 거래입니다." };
  }

  await admin
    .from("trade_transactions")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("id", tx.id);

  const { data: post } = await admin
    .from("posts")
    .select("status")
    .eq("id", postId)
    .single();

  if (post?.status === "reserved") {
    await admin.from("posts").update({ status: "trading" }).eq("id", postId);
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
