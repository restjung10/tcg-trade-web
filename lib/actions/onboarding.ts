"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { nicknameSchema } from "@/lib/validators/nickname";

type OnboardingState = { error?: string } | undefined;

export async function setNickname(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
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
    .update({ nickname: parsed.data, onboarded: true })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 사용 중인 닉네임입니다." };
    }
    return { error: "닉네임 설정 중 오류가 발생했습니다." };
  }

  redirect("/mypage");
}
