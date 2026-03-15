import fs from "node:fs/promises";
import sharp from "sharp";
import { notion } from "./client";
import {
  ensureImageCacheDirs,
  fileExists,
  getBlockDerivedPath,
  getBlockOriginalMetaPath,
  getBlockOriginalPath,
} from "./fs";

export type NotionAssetSource = {
  kind: "image" | "video" | "file" | "pdf";
  sourceType: "external" | "file";
  url: string;
  expiryTime?: string | null;
  contentType?: string | null;
};

function normalizeFileSource(
  kind: "image" | "video" | "file" | "pdf",
  data: any
): NotionAssetSource {
  if (data?.type === "external") {
    return {
      kind,
      sourceType: "external",
      url: data.external?.url ?? "",
      expiryTime: null,
      contentType: null,
    };
  }

  if (data?.type === "file") {
    return {
      kind,
      sourceType: "file",
      url: data.file?.url ?? "",
      expiryTime: data.file?.expiry_time ?? null,
      contentType: null,
    };
  }

  throw new Error(`Tipo de asset não suportado para ${kind}.`);
}

export async function getBlockAssetSource(blockId: string): Promise<NotionAssetSource> {
  const block: any = await notion.blocks.retrieve({ block_id: blockId });

  if (block?.type === "image") {
    return normalizeFileSource("image", block.image);
  }

  if (block?.type === "video") {
    return normalizeFileSource("video", block.video);
  }

  if (block?.type === "file") {
    return normalizeFileSource("file", block.file);
  }

  if (block?.type === "pdf") {
    return normalizeFileSource("pdf", block.pdf);
  }

  throw new Error(`Bloco ${blockId} não é um asset suportado.`);
}

export async function ensureOriginalBlockAsset(
  pageId: string,
  blockId: string,
  version: string
) {
  await ensureImageCacheDirs();

  const filePath = getBlockOriginalPath(pageId, blockId, version);
  const metaPath = getBlockOriginalMetaPath(pageId, blockId, version);

  if (await fileExists(filePath)) {
    return { filePath, metaPath };
  }

  const source = await getBlockAssetSource(blockId);

  if (!source.url) {
    throw new Error(`O asset do bloco ${blockId} não possui URL válida.`);
  }

  const response = await fetch(source.url);
  if (!response.ok) {
    throw new Error(`Falha ao baixar asset do bloco ${blockId}: ${response.status}`);
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
        blockId,
        version,
        kind: source.kind,
        sourceType: source.sourceType,
        originalUrl: source.url,
        expiryTime: source.expiryTime ?? null,
        contentType,
        cachedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  return {
    filePath,
    metaPath,
    kind: source.kind,
    contentType,
  };
}

export async function ensureDerivedBlockImage(
  pageId: string,
  blockId: string,
  version: string,
  originalFilePath: string,
  width = 1200,
  format: "webp" = "webp"
) {
  await ensureImageCacheDirs();

  const outPath = getBlockDerivedPath(pageId, blockId, version, width, format);
  if (await fileExists(outPath)) {
    return outPath;
  }

  await sharp(originalFilePath)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(outPath);

  return outPath;
}