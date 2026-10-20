// L'application vitePOS était servie à cette adresse avant d'aller sur getvitepos.web.app.
// Les téléphones qui l'avaient installée gardent son service worker, qui continuerait d'afficher
// l'ancienne app hors ligne. Ce remplaçant efface ses caches, se désinscrit et envoie vers l'app.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) await caches.delete(key);
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: "window" });
      for (const client of windows) client.navigate("https://getvitepos.web.app/");
    })(),
  );
});
