import "server-only";
import sharp from "sharp";

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
  const image = sharp(buffer).rotate();
  const metadata = await image.metadata();
  const width = metadata.width ?? 800;
  const height = metadata.height ?? 600;

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

  return image
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 88 })
    .toBuffer();
}
