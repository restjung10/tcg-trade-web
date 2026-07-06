"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { postSchema, type BoardType } from "@/lib/validators/post";

type PostFormState = { error?: string } | undefined;

export async function createPost(
  boardType: BoardType,
  _prevState: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const parsed = postSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    price: formData.get("price"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      board_type: boardType,
      title: parsed.data.title,
      content: parsed.data.content,
      price: parsed.data.price,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "게시글 작성 중 오류가 발생했습니다." };
  }

  redirect(`/boards/${boardType}/${data.id}`);
}

export async function updatePost(
  boardType: BoardType,
  postId: string,
  _prevState: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const parsed = postSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    price: formData.get("price"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

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

  if (!post || post.author_id !== user.id) {
    return { error: "본인 게시글만 수정할 수 있습니다." };
  }

  const { error } = await supabase
    .from("posts")
    .update({
      title: parsed.data.title,
      content: parsed.data.content,
      price: parsed.data.price,
    })
    .eq("id", postId);

  if (error) {
    return { error: "게시글 수정 중 오류가 발생했습니다." };
  }

  redirect(`/boards/${boardType}/${postId}`);
}

export async function deletePost(boardType: BoardType, postId: string) {
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

  if (!post || post.author_id !== user.id) {
    redirect(`/boards/${boardType}/${postId}`);
  }

  await supabase.from("posts").delete().eq("id", postId);

  redirect(`/boards/${boardType}`);
}
