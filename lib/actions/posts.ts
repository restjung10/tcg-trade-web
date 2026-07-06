"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  postSchema,
  authorSettablePostStatusSchema,
  type BoardType,
  type AuthorSettablePostStatus,
} from "@/lib/validators/post";
import { processPendingImage } from "@/lib/image/process";

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

  // 이미지 검증(Sightengine 호출)은 비용이 드는 작업이므로, 그 전에 먼저 rate limit을 확인한다.
  const { data: allowed } = await supabase.rpc("check_rate_limit", {
    p_action: "create_post",
    p_max_count: 5,
    p_window_seconds: 300,
  });

  if (!allowed) {
    return {
      error: "게시글을 너무 자주 작성하고 있습니다. 잠시 후 다시 시도해주세요.",
    };
  }

  const imagePaths = formData
    .getAll("imagePaths")
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  if (boardType === "sell" && imagePaths.length === 0) {
    return { error: "판매글은 이미지를 최소 1장 첨부해야 합니다." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .single();
  const nickname = profile?.nickname ?? "익명";
  const watermarkText = `${nickname} · ${new Date()
    .toISOString()
    .slice(0, 16)
    .replace("T", " ")}`;

  let processedImages: Awaited<ReturnType<typeof processPendingImage>>[] = [];
  if (imagePaths.length > 0) {
    try {
      processedImages = await Promise.all(
        imagePaths.map((path) => processPendingImage(path, watermarkText)),
      );
    } catch {
      return {
        error:
          "이미지 검증 서비스에 일시적으로 문제가 있습니다. 잠시 후 다시 시도해주세요.",
      };
    }
  }

  const approvedCount = processedImages.filter(
    (img) => img.status === "approved",
  ).length;

  if (boardType === "sell" && approvedCount === 0) {
    return {
      error: "첨부한 이미지가 검증을 통과하지 못했습니다. 다른 이미지로 다시 시도해주세요.",
    };
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

  if (processedImages.length > 0) {
    const admin = createAdminClient();
    await admin.from("post_images").insert(
      processedImages.map((img, index) => ({
        post_id: data.id,
        original_path: img.originalPath,
        final_path: img.finalPath,
        verification_status: img.status,
        ai_generated_score: img.score,
        watermark_applied: img.status === "approved",
        sort_order: index,
      })),
    );
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

export async function updatePostStatus(
  boardType: BoardType,
  postId: string,
  formData: FormData,
) {
  // "거래완료"는 채팅방의 실제 거래 절차를 통해서만 전환된다 (lib/actions/tradeTransaction.ts).
  // 여기서는 작성자가 직접 고를 수 있는 거래중/예약중만 허용한다.
  const parsedStatus = authorSettablePostStatusSchema.safeParse(
    formData.get("status"),
  );
  if (!parsedStatus.success) {
    redirect(`/boards/${boardType}/${postId}`);
  }
  const status: AuthorSettablePostStatus = parsedStatus.data;

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

  await supabase.from("posts").update({ status }).eq("id", postId);

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
