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

  const { data: existing } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("post_id", postId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (existing) {
    redirect(`/chat/${existing.id}`);
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
