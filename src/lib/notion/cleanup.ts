import {
  getCoverBasePrefix,
  getDerivedDir,
  getOriginalDir,
  removeFilesByPrefix,
} from "./fs";

export async function removeCoverCacheByPageId(pageId: string) {
  const prefix = getCoverBasePrefix(pageId);

  await Promise.all([
    removeFilesByPrefix(getOriginalDir(), prefix),
    removeFilesByPrefix(getDerivedDir(), prefix),
  ]);
}