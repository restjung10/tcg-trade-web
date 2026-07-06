import { z } from "zod";

export const bankAccountSchema = z.object({
  bankName: z
    .string()
    .trim()
    .min(1, "은행명을 입력해주세요.")
    .max(20, "은행명은 20자 이하여야 합니다."),
  accountHolderName: z
    .string()
    .trim()
    .min(1, "예금주명을 입력해주세요.")
    .max(20, "예금주명은 20자 이하여야 합니다."),
  accountNumber: z
    .string()
    .transform((v) => v.replace(/-/g, "").trim())
    .refine((v) => /^\d{8,20}$/.test(v), {
      message: "계좌번호는 8~20자리 숫자여야 합니다.",
    }),
});
