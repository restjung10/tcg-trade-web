import { z } from "zod";

export const boardTypeSchema = z.enum(["sell", "buy"]);
export type BoardType = z.infer<typeof boardTypeSchema>;

export const BOARD_TITLE: Record<BoardType, string> = {
  sell: "판매 게시판",
  buy: "구매 게시판",
};

export const postStatusSchema = z.enum(["trading", "reserved", "completed"]);
export type PostStatus = z.infer<typeof postStatusSchema>;

export const postSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "제목은 2자 이상이어야 합니다.")
    .max(100, "제목은 100자 이하여야 합니다."),
  content: z
    .string()
    .trim()
    .min(1, "본문을 입력해주세요.")
    .max(5000, "본문은 5000자 이하여야 합니다."),
  price: z
    .union([z.literal(""), z.coerce.number().int().min(0, "가격은 0 이상이어야 합니다.")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
});
