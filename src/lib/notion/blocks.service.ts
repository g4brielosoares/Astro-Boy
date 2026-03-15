import { notion } from "./client";

type ExtraBlockMeta = {
  __pageId?: string;
  __version?: string;
};

export async function getPageBlocksTree(
  pageId: string,
  extraMeta?: ExtraBlockMeta
): Promise<any[]> {
  const blocks = await notion.blocks.children.list({ block_id: pageId });

  const results = await Promise.all(
    blocks.results.map(async (block: any) => {
      const enrichedBlock: any = {
        ...block,
        ...extraMeta,
      };

      if (block.has_children) {
        enrichedBlock.children = await getPageBlocksTree(block.id, extraMeta);
      }

      return enrichedBlock;
    })
  );

  return results;
}