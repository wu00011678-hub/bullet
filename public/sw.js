self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 這裡是一個空的 fetch 監聽器，為了滿足 PWA 安裝標準
  // 它允許你的 APP 被安裝，但目前不快取任何東西
});