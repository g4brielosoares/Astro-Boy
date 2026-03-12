import { notion } from "./client";
import type { NotionBlock } from "./types";

async function fetchBlockChildren(blockId: string, startCursor?: string) {
  return notion.blocks.children.list({
    block_id: blockId,
    start_cursor: startCursor,
    page_size: 100,
  });
}

export async function getPageBlocksTree(blockId: string): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined = undefined;

  while (true) {
    const response: any = await fetchBlockChildren(blockId, cursor);

    for (const block of response.results ?? []) {
      const hydrated: NotionBlock = { ...block };

      if (block.has_children) {
        hydrated.children = await getPageBlocksTree(block.id);
      }

      blocks.push(hydrated);
    }

    if (!response.has_more) break;
    cursor = response.next_cursor ?? undefined;
  }

  return blocks;
}