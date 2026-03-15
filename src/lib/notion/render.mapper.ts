import type { NotionBlock } from "./types";
import type { RenderNode, RenderText } from "./render.types";
import { getFileUrl } from "./properties";

function mapRichText(richText: any[] = []): RenderText[] {
  return richText.map((item) => ({
    text: item.plain_text ?? "",
    href: item.href || item.text?.link?.url || null,
    bold: item.annotations?.bold ?? false,
    italic: item.annotations?.italic ?? false,
    underline: item.annotations?.underline ?? false,
    strikethrough: item.annotations?.strikethrough ?? false,
    code: item.annotations?.code ?? false,
    color: item.annotations?.color ?? "default",
  }));
}

function mapChildren(children: NotionBlock[] = []): RenderNode[] {
  return mapBlocksToRenderTree(children);
}

function getBlockProxyUrl(block: NotionBlock, width = 1200) {
  const pageId = block?.__pageId;
  const version = block?.__version || "default";
  const blockId = block?.id;

  if (!pageId || !blockId) return "";

  const params = new URLSearchParams({
    v: String(version),
  });

  if (block.type === "image") {
    params.set("w", String(width));
  }

  return `/img/notion/block/${encodeURIComponent(pageId)}/${encodeURIComponent(
    blockId
  )}?${params.toString()}`;
}

function getBlockAssetUrl(block: NotionBlock, data: any, width = 1200) {
  const proxiedTypes = new Set(["image", "video", "file", "pdf"]);

  if (proxiedTypes.has(block.type)) {
    const proxyUrl = getBlockProxyUrl(block, width);
    if (proxyUrl) return proxyUrl;
  }

  return getFileUrl(data);
}

function mapListItem(block: NotionBlock): RenderNode {
  const data = block[block.type] ?? {};
  return {
    kind: "list-item",
    text: mapRichText(data.rich_text),
    children: block.children?.length ? mapChildren(block.children) : undefined,
  };
}

function mapTableRows(children: NotionBlock[] = []): RenderText[][][] {
  return children.map((row: any) => {
    const cells = row?.table_row?.cells ?? [];
    return cells.map((cell: any[]) => mapRichText(cell));
  });
}

function mapSingleBlock(block: NotionBlock): RenderNode {
  const type = block.type;
  const data = block[type] ?? {};

  switch (type) {
    case "paragraph":
      return {
        kind: "paragraph",
        text: mapRichText(data.rich_text),
      };

    case "heading_1":
      return {
        kind: "heading-1",
        text: mapRichText(data.rich_text),
      };

    case "heading_2":
      return {
        kind: "heading-2",
        text: mapRichText(data.rich_text),
      };

    case "heading_3":
      return {
        kind: "heading-3",
        text: mapRichText(data.rich_text),
      };

    case "quote":
      return {
        kind: "quote",
        text: mapRichText(data.rich_text),
      };

    case "divider":
      return {
        kind: "divider",
      };

    case "bulleted_list_item":
    case "numbered_list_item":
      return mapListItem(block);

    case "to_do":
      return {
        kind: "todo",
        text: mapRichText(data.rich_text),
        checked: data.checked ?? false,
        children: block.children?.length ? mapChildren(block.children) : undefined,
      };

    case "toggle":
      return {
        kind: "toggle",
        text: mapRichText(data.rich_text),
        children: block.children?.length ? mapChildren(block.children) : undefined,
      };

    case "callout":
      return {
        kind: "callout",
        text: mapRichText(data.rich_text),
        icon:
          data.icon?.type === "emoji"
            ? data.icon.emoji
            : getFileUrl(data.icon),
        children: block.children?.length ? mapChildren(block.children) : undefined,
      };

    case "code":
      return {
        kind: "code",
        code: (data.rich_text ?? [])
          .map((item: any) => item.plain_text ?? "")
          .join(""),
        language: data.language ?? "",
      };

    case "image":
      return {
        kind: "image",
        src: getBlockAssetUrl(block, data, 1200),
        caption: data.caption?.length ? mapRichText(data.caption) : undefined,
      };

    case "video":
      return {
        kind: "video",
        src: getBlockAssetUrl(block, data),
        caption: data.caption?.length ? mapRichText(data.caption) : undefined,
      };

    case "embed":
      return {
        kind: "embed",
        url: data.url ?? "",
      };

    case "bookmark":
    case "link_preview":
      return {
        kind: "bookmark",
        url: data.url ?? "",
      };

    case "file":
      return {
        kind: "file",
        url: getBlockAssetUrl(block, data),
        label: data.name ?? "Baixar arquivo",
      };

    case "pdf":
      return {
        kind: "pdf",
        url: getBlockAssetUrl(block, data),
      };

    case "table":
      return {
        kind: "table",
        rows: mapTableRows(block.children ?? []),
      };

    default:
      return {
        kind: "unsupported",
        blockType: type,
      };
  }
}

export function mapBlocksToRenderTree(blocks: NotionBlock[]): RenderNode[] {
  const result: RenderNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === "bulleted_list_item") {
      const items: RenderNode[] = [];

      while (i < blocks.length && blocks[i].type === "bulleted_list_item") {
        items.push(mapSingleBlock(blocks[i]));
        i++;
      }

      result.push({
        kind: "bulleted-list",
        items,
      });
      continue;
    }

    if (block.type === "numbered_list_item") {
      const items: RenderNode[] = [];

      while (i < blocks.length && blocks[i].type === "numbered_list_item") {
        items.push(mapSingleBlock(blocks[i]));
        i++;
      }

      result.push({
        kind: "numbered-list",
        items,
      });
      continue;
    }

    result.push(mapSingleBlock(block));
    i++;
  }

  return result;
}