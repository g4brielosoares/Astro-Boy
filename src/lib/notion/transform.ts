import sharp from "sharp";
import { ensureImageCacheDirs, fileExists, getCoverDerivedPath } from "./fs";

export type CoverImageFormat = "webp";

export async function ensureDerivedCover(
  pageId: string,
  version: string,
  originalFilePath: string,
  width = 1200,
  format: CoverImageFormat = "webp"
) {
  await ensureImageCacheDirs();

  const outPath = getCoverDerivedPath(pageId, version, width, format);
  if (await fileExists(outPath)) {
    return outPath;
  }

  await sharp(originalFilePath)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(outPath);

  return outPath;
}