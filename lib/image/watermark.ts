import "server-only";
import sharp from "sharp";

// Supabase 무료 플랜은 스토리지 용량(1GB)과 egress(월 10GB, DB+Storage+Functions 합산)가
// 넉넉하지 않다. 폰카메라 원본(보통 3000~4000px급)을 그대로 저장하면 둘 다 빨리 소진되므로,
// 웹에서 보기에 충분한 해상도로 줄이고 품질도 살짝 낮춰서 저장한다.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 82;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function applyWatermark(
  buffer: Buffer,
  text: string,
): Promise<Buffer> {
  // 리사이즈 결과 실제 픽셀 크기를 정확히 알아야 워터마크 위치가 어긋나지 않으므로,
  // 먼저 리사이즈를 버퍼로 확정한 뒤 그 결과물의 메타데이터를 다시 읽는다.
  const resizedBuffer = await sharp(buffer)
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toBuffer();

  const metadata = await sharp(resizedBuffer).metadata();
  const width = metadata.width ?? MAX_DIMENSION;
  const height = metadata.height ?? MAX_DIMENSION;

  const fontSize = Math.max(14, Math.round(width * 0.025));
  const paddingX = Math.round(fontSize * 0.8);
  const paddingY = Math.round(fontSize * 0.6);
  const textWidth = Math.round(text.length * fontSize * 0.6) + paddingX * 2;
  const boxHeight = fontSize + paddingY * 2;
  const margin = 12;

  const boxX = Math.max(0, width - textWidth - margin);
  const boxY = Math.max(0, height - boxHeight - margin);

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${boxX}" y="${boxY}" width="${textWidth}" height="${boxHeight}" rx="6" fill="black" fill-opacity="0.45" />
      <text x="${boxX + textWidth / 2}" y="${boxY + boxHeight / 2 + fontSize * 0.35}" font-size="${fontSize}" fill="white" text-anchor="middle" font-family="sans-serif">${escapeXml(text)}</text>
    </svg>
  `;

  return sharp(resizedBuffer)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}
