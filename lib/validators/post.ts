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

// "거래완료"는 작성자가 직접 고를 수도 있지만(예: 묶음 판매처럼 채팅방 4단계 절차가
// 딱 맞지 않는 경우), 시세조작 악용을 막기 위해 해당 게시글에 채팅이 1건 이상 있어야
// 가능하도록 lib/actions/posts.ts와 DB 트리거(0029)에서 이중으로 강제한다.
export const authorSettablePostStatusSchema = z.enum([
  "trading",
  "reserved",
  "completed",
]);
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
