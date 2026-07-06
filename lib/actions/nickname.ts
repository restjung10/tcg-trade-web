"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { nicknameSchema } from "@/lib/validators/nickname";

type NicknameFormState = { error?: string; success?: boolean } | undefined;

export async function changeNickname(
  _prevState: NicknameFormState,
  formData: FormData,
): Promise<NicknameFormState> {
  const parsed = nicknameSchema.safeParse(formData.get("nickname"));
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

  const { error } = await supabase
    .from("profiles")
    .update({ nickname: parsed.data })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 사용 중인 닉네임입니다." };
    }
    if (error.message === "nickname_change_too_soon") {
      return { error: "닉네임은 한 달에 한 번만 변경할 수 있습니다." };
    }
    return { error: "닉네임 변경 중 오류가 발생했습니다." };
  }

  revalidatePath("/mypage");
  return { success: true };
}
