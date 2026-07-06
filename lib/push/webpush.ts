import "server-only";
import webpush from "web-push";

let configured = false;

export function getWebPush() {
  if (!configured) {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;

    if (!publicKey || !privateKey || !subject) {
      throw new Error("VAPID 환경변수가 설정되지 않았습니다.");
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  }

  return webpush;
}
