export type BlogPostMeta = {
  pageId: string;
  id: string;
  title: string;
  slug: string;
  status: string;
  tags: string[];
  author: string;
  cover: string;
  publishedAt: string;
  lastEditedAt: string;
  lastEditedBy: string;
};

export type NotionBlock = {
  id: string;
  type: string;
  has_children?: boolean;
  children?: NotionBlock[];
  [key: string]: any;
};

export type BlogPost = BlogPostMeta & {
  blocks: NotionBlock[];
};