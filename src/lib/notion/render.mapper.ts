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

function mapListItem(block: NotionBlock): RenderNode {
  const data = block[block.type] ?? {};
  return {
    kind: "list-item",
    text: mapRichText(data.rich_text),
    children: mapChildren(block.children),
  };
}

function mapSingleBlock(block: NotionBlock): RenderNode {
  const type = block.type;
  const data = block[type] ?? {};

  switch (type) {
    case "paragraph":
      return { kind: "paragraph", text: mapRichText(data.rich_text) };

    case "heading_1":
      return { kind: "heading-1", text: mapRichText(data.rich_text) };

    case "heading_2":
      return { kind: "heading-2", text: mapRichText(data.rich_text) };

    case "heading_3":
      return { kind: "heading-3", text: mapRichText(data.rich_text) };

    case "quote":
      return { kind: "quote", text: mapRichText(data.rich_text) };

    case "divider":
      return { kind: "divider" };

    case "bulleted_list_item":
    case "numbered_list_item":
      return mapListItem(block);

    case "to_do":
      return {
        kind: "todo",
        text: mapRichText(data.rich_text),
        checked: data.checked ?? false,
        children: mapChildren(block.children),
      };

    case "toggle":
      return {
        kind: "toggle",
        text: mapRichText(data.rich_text),
        children: mapChildren(block.children),
      };

    case "callout":
      return {
        kind: "callout",
        text: mapRichText(data.rich_text),
        icon:
          data.icon?.type === "emoji"
            ? data.icon.emoji
            : getFileUrl(data.icon),
        children: mapChildren(block.children),
      };

    case "code":
      return {
        kind: "code",
        code: (data.rich_text ?? []).map((item: any) => item.plain_text ?? "").join(""),
        language: data.language ?? "",
      };

    case "image":
      return {
        kind: "image",
        src: getFileUrl(data),
        caption: mapRichText(data.caption),
      };

    case "video":
      return {
        kind: "video",
        src: getFileUrl(data),
        caption: mapRichText(data.caption),
      };

    case "embed":
      return { kind: "embed", url: data.url ?? "" };

    case "bookmark":
    case "link_preview":
      return { kind: "bookmark", url: data.url ?? "" };

    case "file":
      return {
        kind: "file",
        url: getFileUrl(data),
        label: "Baixar arquivo",
      };

    case "pdf":
      return { kind: "pdf", url: getFileUrl(data) };

    case "table":
      return {
        kind: "table",
        rows: (block.children ?? []).map((row: any) => row.table_row?.cells ?? []),
      };

    default:
      return { kind: "unsupported", blockType: type };
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
      result.push({ kind: "bulleted-list", items });
      continue;
    }

    if (block.type === "numbered_list_item") {
      const items: RenderNode[] = [];
      while (i < blocks.length && blocks[i].type === "numbered_list_item") {
        items.push(mapSingleBlock(blocks[i]));
        i++;
      }
      result.push({ kind: "numbered-list", items });
      continue;
    }

    result.push(mapSingleBlock(block));
    i++;
  }

  return result;
}