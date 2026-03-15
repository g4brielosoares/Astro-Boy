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
import { resolveWithSWR, markStaleByTags } from "./cache";

const NOTION_FILE_URL_MAX_AGE_MS = 50 * 60 * 1000;

function getListTags(scope: "all" | "published") {
  return ["blog:list", `blog:list:${scope}`];
}

function getPostTags(post: Pick<BlogPostMeta, "pageId" | "slug">) {
  return [
    "blog:post",
    `page:${post.pageId}`,
    `slug:${post.slug}`,
  ];
}

export function mapPostMeta(page: any): BlogPostMeta {
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
  return resolveWithSWR("blog:all-posts", {
    tags: getListTags("all"),
    maxAgeMs: NOTION_FILE_URL_MAX_AGE_MS,
    loader: async () => {
      const pages = await queryPosts({
        sorts: [{ timestamp: "created_time", direction: "descending" }],
      });

      return pages.map(mapPostMeta);
    },
  });
}

export async function getPublishedPosts(): Promise<BlogPostMeta[]> {
  return resolveWithSWR("blog:published-posts", {
    tags: getListTags("published"),
    maxAgeMs: NOTION_FILE_URL_MAX_AGE_MS,
    loader: async () => {
      const pages = await queryPosts({
        filter: {
          property: "Status",
          status: { equals: "Publicado" },
        },
        sorts: [{ timestamp: "created_time", direction: "descending" }],
      });

      return pages.map(mapPostMeta);
    },
  });
}

export async function getPostBySlug(slug: string): Promise<BlogPostMeta | null> {
  return resolveWithSWR(`blog:post-meta:${slug}`, {
    tags: ["blog:post-meta", `slug:${slug}`],
    maxAgeMs: NOTION_FILE_URL_MAX_AGE_MS,
    loader: async () => {
      const pages = await queryPosts({
        filter: {
          property: "Slug",
          rich_text: { equals: slug },
        },
        page_size: 1,
      });

      return pages[0] ? mapPostMeta(pages[0]) : null;
    },
  });
}

export async function getPostByPageId(pageId: string): Promise<BlogPostMeta | null> {
  const page: any = await notion.pages.retrieve({ page_id: pageId });

  if (page?.object !== "page") return null;

  const dataSourceId = page.parent?.data_source_id ?? page.parent?.database_id;
  if (DATA_SOURCE_ID && dataSourceId && dataSourceId !== DATA_SOURCE_ID) {
    return null;
  }

  return mapPostMeta(page);
}

export async function getPostWithContent(slug: string): Promise<BlogPost | null> {
  const post = await getPostBySlug(slug);
  if (!post) return null;

  return resolveWithSWR(`blog:post-content:${slug}`, {
    tags: getPostTags(post),
    maxAgeMs: NOTION_FILE_URL_MAX_AGE_MS,
    loader: async () => {
      const freshPost = await getPostByPageId(post.pageId);
      if (!freshPost) return null;

      const blocks = await getPageBlocksTree(freshPost.pageId);

      return {
        ...freshPost,
        blocks,
      };
    },
  });
}

export async function markPostAndListsStale(pageId: string) {
  const tags = ["blog:list", "blog:list:all", "blog:list:published", `page:${pageId}`];

  try {
    const post = await getPostByPageId(pageId);
    if (post?.slug) {
      tags.push(`slug:${post.slug}`);
    }
  } catch {
    // Se não conseguir resolver o slug, ainda invalida listas e a tag por pageId.
  }

  markStaleByTags(tags);
}

export function markListsStale() {
  markStaleByTags(["blog:list", "blog:list:all", "blog:list:published"]);
}
