/* I Don't Give a Duck — Cloudflare Worker.
   Static app comes from ./public (assets). /api/* is handled here:
   POST /api/rooms            → create a room, returns { code }
   GET  /api/rooms/:code/ws   → WebSocket into that room's Durable Object */
import { Room } from "./room.js";
import STATIC from "./static.gen.js";
export { Room };

const NO_CACHE = new Set(["/", "/index.html", "/sw.js", "/manifest.webmanifest"]);
function serveStatic(req, url) {
  let path = url.pathname === "/" ? "/index.html" : url.pathname;
  let f = STATIC[path];
  if (!f) { f = STATIC["/index.html"]; path = "/index.html"; } // single-page app fallback
  const headers = {
    "content-type": f.type,
    etag: f.etag,
    "cache-control": NO_CACHE.has(path) ? "no-cache" : "public, max-age=3600",
    "x-content-type-options": "nosniff",
  };
  if (req.headers.get("if-none-match") === f.etag) return new Response(null, { status: 304, headers });
  const body = f.text ? f.body : Uint8Array.from(atob(f.body), (c) => c.charCodeAt(0));
  return new Response(req.method === "HEAD" ? null : body, { headers });
}

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I or O (they look like 1 and 0)
const makeCode = () => Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join("");
const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (url.pathname === "/api/rooms" && req.method === "POST") {
      for (let i = 0; i < 8; i++) {
        const code = makeCode();
        const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
        const r = await stub.fetch(`https://room/claim?code=${code}`, { method: "POST" });
        if ((await r.json()).ok) return json({ code });
      }
      return json({ error: "The pond is full. Try again!" }, 503);
    }

    const m = url.pathname.match(/^\/api\/rooms\/([A-Za-z]{4})\/ws$/);
    if (m) {
      if (req.headers.get("Upgrade") !== "websocket") return json({ error: "expected websocket" }, 426);
      const code = m[1].toUpperCase();
      return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(req);
    }

    if (url.pathname.startsWith("/api/")) return json({ error: "not found" }, 404);
    return serveStatic(req, url);
  },
};
