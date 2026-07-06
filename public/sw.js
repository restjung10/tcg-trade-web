self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "새 메시지";
  const url = data.url || "/chat";

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      const alreadyViewing = clientsList.some(
        (client) =>
          client.visibilityState === "visible" && client.url.includes(url),
      );

      if (alreadyViewing) {
        return;
      }

      await self.registration.showNotification(title, {
        body: data.body || "",
        icon: "/icon.svg",
        data: { url },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/chat";

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of clientsList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }

      return self.clients.openWindow(url);
    })(),
  );
});
