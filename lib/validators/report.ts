import { z } from "zod";

export const reportReasonSchema = z.enum([
  "fraud",
  "ai_image",
  "abusive",
  "spam",
  "other",
]);
export type ReportReason = z.infer<typeof reportReasonSchema>;

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  fraud: "사기 의심",
  ai_image: "AI 생성 이미지 의심",
  abusive: "욕설/비매너",
  spam: "도배",
  other: "기타",
};

export const reportSchema = z.object({
  reason: reportReasonSchema,
  detail: z
    .string()
    .trim()
    .max(1000, "상세 내용은 1000자 이하여야 합니다.")
    .optional(),
});
