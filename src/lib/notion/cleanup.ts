import {
  getBlockBasePrefix,
  getBlockDerivedDir,
  getBlockOriginalDir,
  getCoverBasePrefix,
  getCoverDerivedDir,
  getCoverOriginalDir,
  removeFilesByPrefix,
} from "./fs";

export async function removeCoverCacheByPageId(pageId: string) {
  const prefix = getCoverBasePrefix(pageId);

  await Promise.all([
    removeFilesByPrefix(getCoverOriginalDir(), prefix),
    removeFilesByPrefix(getCoverDerivedDir(), prefix),
  ]);
}

export async function removeBlockAssetsCacheByPageId(pageId: string) {
  const prefix = `page_${pageId}__block_`;

  await Promise.all([
    removeFilesByPrefix(getBlockOriginalDir(), prefix),
    removeFilesByPrefix(getBlockDerivedDir(), prefix),
  ]);
}

export async function removeBlockAssetCacheByBlockId(pageId: string, blockId: string) {
  const prefix = getBlockBasePrefix(pageId, blockId);

  await Promise.all([
    removeFilesByPrefix(getBlockOriginalDir(), prefix),
    removeFilesByPrefix(getBlockDerivedDir(), prefix),
  ]);
}