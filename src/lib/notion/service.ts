import { notion, DATA_SOURCE_ID } from "./client";
import type { BlogPostMeta, BlogPost } from "./types";
import { getPageBlocksTree } from "./blocks.service";
import {
  getCover,
  getCreatedBy,
  getCreatedTime,
  getLastEditedBy,
  getLastEditedTime,
  getMultiSelect,
  getRichText,
  getStatus,
  getTitle,
  getUniqueId,
} from "./properties";

function mapPostMeta(page: any): BlogPostMeta {
  const properties = page.properties ?? {};

  return {
    pageId: page.id,
    id: getUniqueId(properties["ID"]),
    title: getTitle(properties["Nome"]),
    slug: getRichText(properties["Slug"]),
    status: getStatus(properties["Status"]),
    tags: getMultiSelect(properties["Tags"]),
    author: getCreatedBy(properties["Author"]),
    cover: getCover(properties["Capa"]),
    publishedAt: getCreatedTime(properties["Data de publicação"]),
    lastEditedAt: getLastEditedTime(properties["Última edição"]),
    lastEditedBy: getLastEditedBy(properties["Última edição por"]),
  };
}

async function queryPosts(body: Record<string, unknown>) {
  const response: any = await notion.request({
    path: `data_sources/${DATA_SOURCE_ID}/query`,
    method: "post",
    body,
  });

  return response.results ?? [];
}

export async function getAllPosts(): Promise<BlogPostMeta[]> {
  const pages = await queryPosts({
    sorts: [{ timestamp: "created_time", direction: "descending" }],
  });

  return pages.map(mapPostMeta);
}

export async function getPublishedPosts(): Promise<BlogPostMeta[]> {
  const pages = await queryPosts({
    filter: {
      property: "Status",
      status: { equals: "Publicado" },
    },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
  });

  return pages.map(mapPostMeta);
}

export async function getPostBySlug(slug: string): Promise<BlogPostMeta | null> {
  const pages = await queryPosts({
    filter: {
      property: "Slug",
      rich_text: { equals: slug },
    },
    page_size: 1,
  });

  return pages[0] ? mapPostMeta(pages[0]) : null;
}

export async function getPostWithContent(slug: string): Promise<BlogPost | null> {
  const post = await getPostBySlug(slug);
  if (!post) return null;

  const blocks = await getPageBlocksTree(post.pageId);

  return {
    ...post,
    blocks,
  };
}