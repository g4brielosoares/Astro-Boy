import { Client } from "@notionhq/client";

export const notion = new Client({
  auth: import.meta.env.NOTION_TOKEN,
});

export const DATA_SOURCE_ID = import.meta.env.NOTION_DATA_SOURCE_ID;