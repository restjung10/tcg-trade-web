"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BoardType } from "@/lib/validators/post";

export async function startChat(boardType: BoardType, postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .single();

  if (!post) {
    redirect(`/boards/${boardType}`);
  }

  if (post.author_id === user.id) {
    redirect(`/boards/${boardType}/${postId}`);
  }

  // 계좌 인증(관리자 승인)이 완료된 사용자만 채팅을 시작할 수 있다 (RLS에서도 동일하게 강제됨).
  const { data: bankAccount } = await supabase
    .from("bank_accounts")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (bankAccount?.status !== "approved") {
    redirect(`/boards/${boardType}/${postId}?bankRequired=1`);
  }

  const { data: existing } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("post_id", postId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (existing) {
    redirect(`/chat/${existing.id}`);
  }

  const { data: allowed } = await supabase.rpc("check_rate_limit", {
    p_action: "start_chat",
    p_max_count: 10,
    p_window_seconds: 300,
  });

  if (!allowed) {
    redirect(`/boards/${boardType}/${postId}?chatLimited=1`);
  }

  const { data: created, error } = await supabase
    .from("chat_rooms")
    .insert({ post_id: postId, buyer_id: user.id, seller_id: post.author_id })
    .select("id")
    .single();

  if (error || !created) {
    redirect(`/boards/${boardType}/${postId}`);
  }

  redirect(`/chat/${created.id}`);
}
