import fs from "node:fs/promises";
import path from "node:path";

const isVercel = Boolean(process.env.VERCEL);

const ROOT = isVercel
  ? path.join("/tmp", "notion", "cover")
  : path.join(process.cwd(), "cache", "notion", "cover");

const ORIGINAL_DIR = path.join(ROOT, "original");
const DERIVED_DIR = path.join(ROOT, "derived");

function sanitizeVersion(version: string) {
  return version.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function getCacheRoot() {
  return ROOT;
}

export function getOriginalDir() {
  return ORIGINAL_DIR;
}

export function getDerivedDir() {
  return DERIVED_DIR;
}

export function getCoverBasePrefix(pageId: string) {
  return `page_${pageId}__cover`;
}

export function getVersionedCoverPrefix(pageId: string, version: string) {
  return `${getCoverBasePrefix(pageId)}__v_${sanitizeVersion(version)}`;
}

export function getOriginalPath(pageId: string, version: string) {
  return path.join(ORIGINAL_DIR, `${getVersionedCoverPrefix(pageId, version)}.bin`);
}

export function getOriginalMetaPath(pageId: string, version: string) {
  return path.join(ORIGINAL_DIR, `${getVersionedCoverPrefix(pageId, version)}.json`);
}

export function getDerivedPath(
  pageId: string,
  version: string,
  width: number,
  format: string
) {
  return path.join(
    DERIVED_DIR,
    `${getVersionedCoverPrefix(pageId, version)}__w${width}.${format}`
  );
}

export async function ensureImageCacheDirs() {
  await fs.mkdir(ORIGINAL_DIR, { recursive: true });
  await fs.mkdir(DERIVED_DIR, { recursive: true });
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