import fs from "node:fs/promises";
import { notion } from "./client";
import {
  ensureImageCacheDirs,
  fileExists,
  getOriginalMetaPath,
  getOriginalPath,
} from "./fs";

export type CoverSource = {
  type: "external" | "file";
  url: string;
  expiryTime?: string | null;
};

async function getCoverSourceFromPage(pageId: string): Promise<CoverSource> {
  const page: any = await notion.pages.retrieve({ page_id: pageId });
  const cover = page?.cover;

  if (!cover) {
    throw new Error(`Nenhuma cover encontrada para a página ${pageId}.`);
  }

  if (cover.type === "external") {
    return {
      type: "external",
      url: cover.external?.url ?? "",
      expiryTime: null,
    };
  }

  if (cover.type === "file") {
    return {
      type: "file",
      url: cover.file?.url ?? "",
      expiryTime: cover.file?.expiry_time ?? null,
    };
  }

  throw new Error(`Tipo de cover não suportado: ${cover.type}`);
}

export async function ensureOriginalCover(pageId: string) {
  await ensureImageCacheDirs();

  const filePath = getOriginalPath(pageId);
  const metaPath = getOriginalMetaPath(pageId);

  if (await fileExists(filePath)) {
    return { filePath, metaPath };
  }

  const source = await getCoverSourceFromPage(pageId);
  if (!source.url) {
    throw new Error(`A cover da página ${pageId} não possui URL válida.`);
  }

  const response = await fetch(source.url);
  if (!response.ok) {
    throw new Error(`Falha ao baixar a cover da página ${pageId}: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get("content-type") ?? "application/octet-stream";

  await fs.writeFile(filePath, buffer);
  await fs.writeFile(
    metaPath,
    JSON.stringify(
      {
        pageId,
        contentType,
        sourceType: source.type,
        originalUrl: source.url,
        expiryTime: source.expiryTime ?? null,
        cachedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  return { filePath, metaPath };
}
