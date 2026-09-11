/// <reference path="../worker-configuration.d.ts" />

function mime(key: string): string {
  if (key.endsWith(".json")) return "application/json; charset=utf-8";
  if (key.endsWith(".jsdos")) return "application/zip";
  return "application/octet-stream";
}

function objectKey(pathname: string): string | null | "invalid" {
  let key: string;
  try {
    key = decodeURIComponent(pathname).replace(/^\/+/, "");
  } catch {
    return "invalid";
  }
  if (!key || key.includes("..") || key.startsWith("/")) return null;
  if (key !== "src/games.json" && !key.startsWith("games/")) return null;
  return key;
}

async function fromR2(bucket: R2Bucket, key: string, request: Request): Promise<Response> {
  if (request.method === "HEAD") {
    const obj = await bucket.head(key);
    if (!obj) return new Response(null, { status: 404 });
    return new Response(null, {
      status: 200,
      headers: {
        "content-type": mime(key),
        etag: obj.httpEtag,
        "content-length": String(obj.size),
        "cache-control": "public, max-age=3600",
      },
    });
  }

  if (request.method !== "GET") {
    return new Response("method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  }

  const obj = await bucket.get(key);
  if (!obj) return new Response("not found", { status: 404 });

  if (request.headers.get("if-none-match") === obj.httpEtag) {
    return new Response(null, { status: 304, headers: { etag: obj.httpEtag } });
  }

  return new Response(obj.body, {
    headers: {
      "content-type": mime(key),
      etag: obj.httpEtag,
      "cache-control": "public, max-age=3600",
    },
  });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const key = objectKey(url.pathname);
    if (key === "invalid") return new Response("bad request", { status: 400 });
    if (key) return fromR2(env.GAMES, key, request);
    if (url.pathname === "/") {
      return env.ASSETS.fetch(new URL("/index.html", url));
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
