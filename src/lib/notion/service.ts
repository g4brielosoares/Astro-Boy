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
import { removeCoverCacheByPageId } from "./cleanup";

const NOTION_FILE_URL_MAX_AGE_MS = 50 * 60 * 1000;

function getListTags(scope: "all" | "published") {
  return ["blog:list", `blog:list:${scope}`];
}

function getPostTags(post: Pick<BlogPostMeta, "pageId" | "slug" | "id">) {
  return [
    "blog:post",
    `page:${post.pageId}`,
    `slug:${post.slug}`,
    `post-id:${post.id}`,
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
    cover: getCover(page),
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

export async function getPostByPostId(postId: string): Promise<BlogPostMeta | null> {
  const normalized = postId.trim();
  if (!normalized) return null;

  const pages = await queryPosts({
    filter: {
      property: "ID",
      unique_id: {
        equals: Number(normalized.replace(/^[^\d]*/, "")) || 0,
      },
    },
    page_size: 1,
  });

  return pages[0] ? mapPostMeta(pages[0]) : null;
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
  const tags = [
    "blog:list",
    "blog:list:all",
    "blog:list:published",
    `page:${pageId}`,
  ];

  try {
    const post = await getPostByPageId(pageId);
    if (post?.slug) tags.push(`slug:${post.slug}`);
    if (post?.id) tags.push(`post-id:${post.id}`);
  } catch (error) {
    console.warn("Não foi possível resolver slug/id do post para invalidação fina.", {
      pageId,
      error,
    });
  }

  markStaleByTags(tags);
}

export function markListsStale() {
  markStaleByTags(["blog:list", "blog:list:all", "blog:list:published"]);
}

export async function purgePostCoverByPageId(pageId: string) {
  await removeCoverCacheByPageId(pageId);
}

export async function purgePostCoverByPostId(postId: string) {
  const post = await getPostByPostId(postId);
  if (!post) return false;

  await removeCoverCacheByPageId(post.pageId);
  return true;
}

function buildCoverVersion(version?: string) {
  const normalized = String(version || "").trim();
  return normalized || "default";
}

export function getOptimizedCoverUrl(
  pageId: string,
  lastEditedAt?: string,
  width = 1200
) {
  const safeWidth = Number.isFinite(width) && width > 0 ? Math.round(width) : 1200;
  const version = buildCoverVersion(lastEditedAt);

  const params = new URLSearchParams({
    w: String(safeWidth),
    v: version,
  });

  return `/img/notion/cover/${encodeURIComponent(pageId)}?${params.toString()}`;
}