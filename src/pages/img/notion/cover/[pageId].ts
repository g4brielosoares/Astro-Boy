import type { APIRoute } from "astro";
import fs from "node:fs/promises";
import { ensureOriginalCover } from "../../../../lib/notion/notion-cover";
import { ensureDerivedCover } from "../../../../lib/notion/transform";

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  const pageId = params.pageId;

  if (!pageId) {
    return new Response("Missing pageId", { status: 400 });
  }

  const widthParam = Number(url.searchParams.get("w") || "1200");
  const width = Number.isFinite(widthParam) && widthParam > 0 ? Math.round(widthParam) : 1200;

  const version = String(url.searchParams.get("v") || "default");

  const original = await ensureOriginalCover(pageId, version);
  const derivedPath = await ensureDerivedCover(pageId, version, original.filePath, width, "webp");
  const file = await fs.readFile(derivedPath);

  return new Response(file, {
    status: 200,
    headers: {
      "content-type": "image/webp",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
};