"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bankAccountSchema } from "@/lib/validators/bankAccount";
import { encrypt } from "@/lib/crypto";

type BankAccountFormState = { error?: string } | undefined;

export async function submitBankAccount(
  _prevState: BankAccountFormState,
  formData: FormData,
): Promise<BankAccountFormState> {
  const parsed = bankAccountSchema.safeParse({
    bankName: formData.get("bankName"),
    accountHolderName: formData.get("accountHolderName"),
    accountNumber: formData.get("accountNumber"),
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

  const { data: allowed } = await supabase.rpc("check_rate_limit", {
    p_action: "submit_bank_account",
    p_max_count: 5,
    p_window_seconds: 3600,
  });

  if (!allowed) {
    return {
      error: "계좌 정보를 너무 자주 제출하고 있습니다. 잠시 후 다시 시도해주세요.",
    };
  }

  const accountNumberEncrypted = encrypt(parsed.data.accountNumber);

  const { error } = await supabase.from("bank_accounts").upsert(
    {
      user_id: user.id,
      bank_name: parsed.data.bankName,
      account_holder_name: parsed.data.accountHolderName,
      account_number_encrypted: accountNumberEncrypted,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { error: "계좌 등록 중 오류가 발생했습니다." };
  }

  redirect("/mypage");
}
