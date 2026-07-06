"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reportSchema } from "@/lib/validators/report";
import type { BoardType } from "@/lib/validators/post";

type ReportFormState = { error?: string } | undefined;

export async function submitReport(
  boardType: BoardType,
  postId: string,
  _prevState: ReportFormState,
  formData: FormData,
): Promise<ReportFormState> {
  const parsed = reportSchema.safeParse({
    reason: formData.get("reason"),
    detail: formData.get("detail"),
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

  const { error } = await supabase.from("reports").insert({
    post_id: postId,
    reporter_id: user.id,
    reason: parsed.data.reason,
    detail: parsed.data.detail || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 신고한 게시글입니다." };
    }
    return { error: "신고 접수 중 오류가 발생했습니다." };
  }

  redirect(`/boards/${boardType}/${postId}?reported=1`);
}
