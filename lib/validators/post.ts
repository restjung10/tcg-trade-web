import { z } from "zod";

export const boardTypeSchema = z.enum(["sell", "buy"]);
export type BoardType = z.infer<typeof boardTypeSchema>;

export const BOARD_TITLE: Record<BoardType, string> = {
  sell: "판매 게시판",
  buy: "구매 게시판",
};

export const cardTypeSchema = z.enum(["deck", "single"]);
export type CardType = z.infer<typeof cardTypeSchema>;

export const CARD_TYPE_LABEL: Record<CardType, string> = {
  deck: "완덱",
  single: "낱장",
};

export const postStatusSchema = z.enum(["trading", "reserved", "completed"]);
export type PostStatus = z.infer<typeof postStatusSchema>;

// "거래완료"는 채팅방에서의 실제 거래 절차(lib/actions/tradeTransaction.ts)를 통해서만
// 전환되어야 하므로, 작성자가 상태 셀렉트에서 직접 고를 수 있는 값은 이 둘로 제한한다.
export const authorSettablePostStatusSchema = z.enum(["trading", "reserved"]);
export type AuthorSettablePostStatus = z.infer<
  typeof authorSettablePostStatusSchema
>;

export const postSchema = z.object({
  cardType: cardTypeSchema,
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
