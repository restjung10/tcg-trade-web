"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return { supabase, user };
}

export async function reviewBankAccount(
  accountId: string,
  decision: "approved" | "rejected",
  formData: FormData,
) {
  const { user } = await assertAdmin();

  const rejectionReason =
    decision === "rejected"
      ? String(formData.get("rejectionReason") ?? "").slice(0, 500)
      : null;

  // 세션 클라이언트로 하면 auth.uid()가 본인 소유 행일 때(자기 자신의 신청을 심사하는 극단적인 경우)
  // protect_bank_account_review_columns 트리거가 "본인 수정"으로 오인해 status를 다시 pending으로 되돌린다.
  // role 검증은 이미 마쳤으므로 실제 update는 admin(service role) 클라이언트로 수행한다.
  await createAdminClient()
    .from("bank_accounts")
    .update({
      status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: rejectionReason,
    })
    .eq("id", accountId);

  redirect("/admin/bank-accounts");
}

export async function deleteReportedPost(reportId: string, postId: string) {
  await assertAdmin();

  const admin = createAdminClient();
  await admin.from("posts").delete().eq("id", postId);
  await admin.from("reports").update({ status: "resolved" }).eq("id", reportId);

  redirect("/admin/reports");
}

export async function suspendReportedUser(
  reportId: string,
  userId: string,
  formData: FormData,
) {
  await assertAdmin();

  const reason =
    String(formData.get("suspensionReason") ?? "").slice(0, 500) ||
    "커뮤니티 가이드라인 위반";

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ suspended_at: new Date().toISOString(), suspension_reason: reason })
    .eq("id", userId);
  await admin.from("reports").update({ status: "resolved" }).eq("id", reportId);

  redirect("/admin/reports");
}

export async function dismissReport(reportId: string) {
  const { supabase } = await assertAdmin();

  await supabase.from("reports").update({ status: "dismissed" }).eq("id", reportId);

  redirect("/admin/reports");
}
