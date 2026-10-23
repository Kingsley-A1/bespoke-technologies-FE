/**
 * Publishing rules for What's New posts. Pure functions so the transition
 * rules are tested once and enforced identically by every server boundary.
 */

export type NewsStoredStatus = "draft" | "published" | "archived";
/** What a reader or editor actually experiences right now. */
export type NewsState = "draft" | "scheduled" | "published" | "archived";

export type NewsStatusCommand =
  | { action: "publish" }
  | { action: "schedule"; publishAt: Date }
  | { action: "unpublish" }
  | { action: "archive" }
  | { action: "restore" };

export interface NewsPublishingFacts {
  status: NewsStoredStatus;
  publishedAt?: string;
  firstPublishedAt?: string;
}

export interface NewsPublishPlan {
  status: NewsStoredStatus;
  publishedAt: string | null;
  firstPublishedAt: string | null;
}

export class NewsTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NewsTransitionError";
  }
}

/** The minimum lead time for a scheduled post, so "schedule" never means "publish now". */
export const MIN_SCHEDULE_LEAD_MS = 2 * 60 * 1000;
/** Scheduling further out than this is almost certainly a typing error. */
export const MAX_SCHEDULE_LEAD_MS = 366 * 24 * 60 * 60 * 1000;

function time(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function deriveNewsState(facts: Pick<NewsPublishingFacts, "status" | "publishedAt">, now = new Date()): NewsState {
  if (facts.status !== "published") return facts.status;
  const publishedAt = time(facts.publishedAt);
  return publishedAt !== undefined && publishedAt > now.getTime() ? "scheduled" : "published";
}

/** True when the post has been visible to the public at some point. */
export function wasEverPublic(facts: NewsPublishingFacts, now = new Date()) {
  const first = time(facts.firstPublishedAt);
  return first !== undefined && first <= now.getTime();
}

export function planNewsTransition(facts: NewsPublishingFacts, command: NewsStatusCommand, now = new Date()): NewsPublishPlan {
  const state = deriveNewsState(facts, now);
  // A scheduled post that is withdrawn before going live was never public, so
  // it loses its pending dates; a post that has been live keeps them.
  const keep =
    state === "scheduled"
      ? { publishedAt: null, firstPublishedAt: null }
      : { publishedAt: facts.publishedAt ?? null, firstPublishedAt: facts.firstPublishedAt ?? null };

  switch (command.action) {
    case "publish": {
      if (state === "published") throw new NewsTransitionError("This post is already live.");
      // Re-publishing keeps the original publication date; a first publication is dated now.
      const publishedAt = wasEverPublic(facts, now) ? facts.firstPublishedAt! : now.toISOString();
      return { status: "published", publishedAt, firstPublishedAt: publishedAt };
    }
    case "schedule": {
      if (state === "published") throw new NewsTransitionError("This post is already live. Unpublish it before scheduling.");
      if (wasEverPublic(facts, now)) {
        throw new NewsTransitionError("This post has been public before. Publish it now to keep its original date.");
      }
      const at = command.publishAt.getTime();
      if (Number.isNaN(at)) throw new NewsTransitionError("Choose a valid date and time.");
      if (at < now.getTime() + MIN_SCHEDULE_LEAD_MS) {
        throw new NewsTransitionError("Choose a time at least a few minutes in the future, or publish now.");
      }
      if (at > now.getTime() + MAX_SCHEDULE_LEAD_MS) throw new NewsTransitionError("Schedule within the next 12 months.");
      const publishedAt = command.publishAt.toISOString();
      // firstPublishedAt in the future means "not yet public"; it becomes true history once the time passes.
      return { status: "published", publishedAt, firstPublishedAt: publishedAt };
    }
    case "unpublish":
      if (state !== "published" && state !== "scheduled")
        throw new NewsTransitionError("Only live or scheduled posts can be unpublished.");
      return { status: "draft", ...keep };
    case "archive":
      if (state === "archived") throw new NewsTransitionError("This post is already archived.");
      return { status: "archived", ...keep };
    case "restore":
      if (state !== "archived") throw new NewsTransitionError("Only archived posts can be restored.");
      return { status: "draft", ...keep };
  }
}

export interface NewsReadinessInput {
  title: string;
  bodyText: string;
  hasImages: boolean;
  coverAssetId?: string;
  shareAssetId?: string;
  coverAlt?: string;
}

/** Everything that must be true before a post can be published or scheduled. */
export function newsPublishBlockers(post: NewsReadinessInput) {
  const blockers: string[] = [];
  if (post.title.trim().length < 3) blockers.push("Add a headline.");
  if (post.bodyText.trim().length < 40 && !post.hasImages) blockers.push("Write the article body.");
  if (!post.coverAssetId || !post.shareAssetId) blockers.push("Add a cover image. It becomes the WhatsApp and social preview.");
  else if (!post.coverAlt?.trim()) blockers.push("Describe the cover image (alt text).");
  return blockers;
}

/** Converts a `datetime-local` value entered in Lagos time (UTC+1, no DST) to a Date. */
export function parseLagosDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+01:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Formats a Date for a `datetime-local` input in Lagos time. */
export function toLagosDateTimeInput(date: Date) {
  const lagos = new Date(date.getTime() + 60 * 60 * 1000);
  return lagos.toISOString().slice(0, 16);
}
