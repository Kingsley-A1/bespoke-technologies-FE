import type { NewsCategory } from "./categories";
import type { NewsDocument } from "./content";
import type { NewsStoredStatus } from "./status";

export interface NewsPost {
  id: string;
  slug: string;
  title: string;
  dek?: string;
  category: NewsCategory;
  body: NewsDocument;
  bodyText: string;
  readingMinutes: number;
  coverAssetId?: string;
  coverAlt?: string;
  shareAssetId?: string;
  seoTitle?: string;
  seoDescription?: string;
  authorName: string;
  isFeatured: boolean;
  status: NewsStoredStatus;
  publishedAt?: string;
  firstPublishedAt?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/** The fields a list or card needs; the body is left out. */
export type NewsPostSummary = Omit<NewsPost, "body">;

export interface NewsAsset {
  id: string;
  postId: string;
  purpose: "cover" | "share" | "inline";
  r2Key: string;
  mime: string;
  width: number;
  height: number;
  byteSize: number;
}
