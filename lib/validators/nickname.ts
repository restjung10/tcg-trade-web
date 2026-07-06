import { z } from "zod";

export const nicknameSchema = z
  .string()
  .trim()
  .min(2, "닉네임은 2자 이상이어야 합니다.")
  .max(12, "닉네임은 12자 이하여야 합니다.")
  .regex(/^[a-zA-Z0-9가-힣_]+$/, "한글/영문/숫자/밑줄만 사용할 수 있습니다.");
