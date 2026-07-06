"use client";

import { useEffect, useState } from "react";
import {
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/actions/pushSubscription";
import { Button } from "@/components/ui/Button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushNotificationToggle() {
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSubscribed(false);
      return;
    }

    navigator.serviceWorker.getRegistration().then(async (registration) => {
      const existing = await registration?.pushManager.getSubscription();
      setSubscribed(Boolean(existing));
    });
  }, []);

  const handleEnable = async () => {
    setError(null);
    setPending(true);
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setError("이 브라우저는 알림을 지원하지 않습니다.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("알림 권한이 허용되지 않았습니다.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setError("알림 설정이 완료되지 않았습니다.");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const json = subscription.toJSON();
      const result = await subscribeToPush({
        endpoint: json.endpoint!,
        keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      setSubscribed(true);
    } catch {
      setError("알림 설정 중 오류가 발생했습니다.");
    } finally {
      setPending(false);
    }
  };

  const handleDisable = async () => {
    setError(null);
    setPending(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const existing = await registration?.pushManager.getSubscription();
      if (existing) {
        await unsubscribeFromPush(existing.endpoint);
        await existing.unsubscribe();
      }
      setSubscribed(false);
    } catch {
      setError("알림 해제 중 오류가 발생했습니다.");
    } finally {
      setPending(false);
    }
  };

  if (subscribed === null) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-col gap-1">
      {subscribed ? (
        <Button variant="secondary" size="sm" disabled={pending} onClick={handleDisable}>
          🔔 알림 켜짐 (끄기)
        </Button>
      ) : (
        <Button variant="secondary" size="sm" disabled={pending} onClick={handleEnable}>
          🔕 새 메시지 알림 받기
        </Button>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
