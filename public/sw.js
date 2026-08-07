const CACHE_NAME = "leave-by-v1";

self.addEventListener("install", (event) => {
console.log("Service worker installed");
});

self.addEventListener("activate", (event) => {
console.log("Service worker activated");
});

self.addEventListener("fetch", (event) => {
event.respondWith(
fetch(event.request)
);
});
