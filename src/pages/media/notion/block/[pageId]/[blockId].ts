import type { APIRoute } from "astro";
import fs from "node:fs/promises";
import {
  ensureDerivedBlockImage,
  ensureOriginalBlockAsset,
} from "../../../../../lib/notion/notion-asset";

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  const pageId = params.pageId;
  const blockId = params.blockId;

  if (!pageId || !blockId) {
    return new Response("Missing params", { status: 400 });
  }

  const version = String(url.searchParams.get("v") || "default");
  const widthParam = Number(url.searchParams.get("w") || "1200");
  const width = Number.isFinite(widthParam) && widthParam > 0 ? Math.round(widthParam) : 1200;

  const original = await ensureOriginalBlockAsset(pageId, blockId, version);

  if (original.kind === "image") {
    const derivedPath = await ensureDerivedBlockImage(
      pageId,
      blockId,
      version,
      original.filePath,
      width,
      "webp"
    );
    const file = await fs.readFile(derivedPath);

    return new Response(file, {
      status: 200,
      headers: {
        "content-type": "image/webp",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  }

  const file = await fs.readFile(original.filePath);

  return new Response(file, {
    status: 200,
    headers: {
      "content-type": original.contentType || "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
};