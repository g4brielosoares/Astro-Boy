import fs from "node:fs/promises";
import path from "node:path";

const isVercel = Boolean(process.env.VERCEL);

const ROOT = isVercel
  ? path.join("/tmp", "notion", "assets")
  : path.join(process.cwd(), "cache", "notion", "assets");

const COVER_ORIGINAL_DIR = path.join(ROOT, "cover", "original");
const COVER_DERIVED_DIR = path.join(ROOT, "cover", "derived");

const BLOCK_ORIGINAL_DIR = path.join(ROOT, "block", "original");
const BLOCK_DERIVED_DIR = path.join(ROOT, "block", "derived");

function sanitizeVersion(version: string) {
  return version.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function getCacheRoot() {
  return ROOT;
}

export function getCoverOriginalDir() {
  return COVER_ORIGINAL_DIR;
}

export function getCoverDerivedDir() {
  return COVER_DERIVED_DIR;
}

export function getBlockOriginalDir() {
  return BLOCK_ORIGINAL_DIR;
}

export function getBlockDerivedDir() {
  return BLOCK_DERIVED_DIR;
}

export function getCoverBasePrefix(pageId: string) {
  return `page_${pageId}__cover`;
}

export function getVersionedCoverPrefix(pageId: string, version: string) {
  return `${getCoverBasePrefix(pageId)}__v_${sanitizeVersion(version)}`;
}

export function getCoverOriginalPath(pageId: string, version: string) {
  return path.join(COVER_ORIGINAL_DIR, `${getVersionedCoverPrefix(pageId, version)}.bin`);
}

export function getCoverOriginalMetaPath(pageId: string, version: string) {
  return path.join(COVER_ORIGINAL_DIR, `${getVersionedCoverPrefix(pageId, version)}.json`);
}

export function getCoverDerivedPath(
  pageId: string,
  version: string,
  width: number,
  format: string
) {
  return path.join(
    COVER_DERIVED_DIR,
    `${getVersionedCoverPrefix(pageId, version)}__w${width}.${format}`
  );
}

export function getBlockBasePrefix(pageId: string, blockId: string) {
  return `page_${pageId}__block_${blockId}`;
}

export function getVersionedBlockPrefix(pageId: string, blockId: string, version: string) {
  return `${getBlockBasePrefix(pageId, blockId)}__v_${sanitizeVersion(version)}`;
}

export function getBlockOriginalPath(pageId: string, blockId: string, version: string) {
  return path.join(BLOCK_ORIGINAL_DIR, `${getVersionedBlockPrefix(pageId, blockId, version)}.bin`);
}

export function getBlockOriginalMetaPath(pageId: string, blockId: string, version: string) {
  return path.join(BLOCK_ORIGINAL_DIR, `${getVersionedBlockPrefix(pageId, blockId, version)}.json`);
}

export function getBlockDerivedPath(
  pageId: string,
  blockId: string,
  version: string,
  width: number,
  format: string
) {
  return path.join(
    BLOCK_DERIVED_DIR,
    `${getVersionedBlockPrefix(pageId, blockId, version)}__w${width}.${format}`
  );
}

export async function ensureImageCacheDirs() {
  await fs.mkdir(COVER_ORIGINAL_DIR, { recursive: true });
  await fs.mkdir(COVER_DERIVED_DIR, { recursive: true });
  await fs.mkdir(BLOCK_ORIGINAL_DIR, { recursive: true });
  await fs.mkdir(BLOCK_DERIVED_DIR, { recursive: true });
}

export async function fileExists(filePath: string) {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function listFiles(dir: string) {
  try {
    return await fs.readdir(dir);
  } catch {
    return [];
  }
}

export async function removeFilesByPrefix(dir: string, prefix: string) {
  const files = await listFiles(dir);

  await Promise.all(
    files
      .filter((file) => file.startsWith(prefix))
      .map((file) => fs.rm(path.join(dir, file), { force: true }))
  );
}