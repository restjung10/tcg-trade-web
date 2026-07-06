import "server-only";

const SIGHTENGINE_ENDPOINT = "https://api.sightengine.com/1.0/check.json";

export async function checkAiGenerated(
  buffer: Buffer,
): Promise<{ score: number }> {
  const apiUser = process.env.SIGHTENGINE_API_USER;
  const apiSecret = process.env.SIGHTENGINE_API_SECRET;

  if (!apiUser || !apiSecret) {
    throw new Error("Sightengine API 키가 설정되지 않았습니다.");
  }

  const formData = new FormData();
  formData.append("media", new Blob([new Uint8Array(buffer)]), "image.jpg");
  formData.append("models", "genai");
  formData.append("api_user", apiUser);
  formData.append("api_secret", apiSecret);

  const response = await fetch(SIGHTENGINE_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Sightengine API 오류: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== "success") {
    throw new Error(`Sightengine API 실패 응답: ${JSON.stringify(data)}`);
  }

  return { score: data.type.ai_generated as number };
}
