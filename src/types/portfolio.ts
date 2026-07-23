export type ProjectType = "web" | "mobile" | "ios" | "desktop" | "web+mobile";

/** The public portfolio metadata contract used by the website, seed, and admin editor. */
export interface PortfolioProject {
  id: string;
  name: string;
  type: ProjectType;
  category: string;
  description: string;
  image: string;
  imageUrl?: string;
  liveUrl?: string;
  tags: readonly string[];
  year: string;
  comingSoon: boolean;
  featured: boolean;
  published?: boolean;
  sortOrder?: number;
  imageKey?: string;
  imageMime?: string;
  createdAt?: string;
  updatedAt?: string;
}
