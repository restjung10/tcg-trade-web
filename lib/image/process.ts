import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAiGenerated } from "@/lib/image/sightengine";
import { applyWatermark } from "@/lib/image/watermark";

const AI_SCORE_THRESHOLD = 0.7;
const PENDING_BUCKET = "post-images-pending";
const FINAL_BUCKET = "post-images-final";

export type ProcessedImage = {
  originalPath: string;
  finalPath: string | null;
  status: "approved" | "rejected";
  score: number;
};

export async function processPendingImage(
  pendingPath: string,
  watermarkText: string,
): Promise<ProcessedImage> {
  const admin = createAdminClient();

  const { data: fileData, error: downloadError } = await admin.storage
    .from(PENDING_BUCKET)
    .download(pendingPath);

  if (downloadError || !fileData) {
    throw new Error("업로드된 이미지를 찾을 수 없습니다.");
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const { score } = await checkAiGenerated(buffer);

  if (score >= AI_SCORE_THRESHOLD) {
    return {
      originalPath: pendingPath,
      finalPath: null,
      status: "rejected",
      score,
    };
  }

  const watermarked = await applyWatermark(buffer, watermarkText);
  const finalPath = `${crypto.randomUUID()}.jpg`;

  const { error: uploadError } = await admin.storage
    .from(FINAL_BUCKET)
    .upload(finalPath, watermarked, { contentType: "image/jpeg" });

  if (uploadError) {
    throw new Error("이미지 업로드 중 오류가 발생했습니다.");
  }

  return { originalPath: pendingPath, finalPath, status: "approved", score };
}
