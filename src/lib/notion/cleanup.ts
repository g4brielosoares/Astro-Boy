import {
  getDerivedDir,
  getOriginalDir,
  removeFilesByPrefix,
} from "./fs";

export async function removeCoverCacheByPageId(pageId: string) {
  const prefix = `page_${pageId}__cover`;

  await Promise.all([
    removeFilesByPrefix(getOriginalDir(), prefix),
    removeFilesByPrefix(getDerivedDir(), prefix),
  ]);
}
