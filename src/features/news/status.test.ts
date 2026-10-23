import { describe, expect, it } from "vitest";
import {
  deriveNewsState,
  newsPublishBlockers,
  NewsTransitionError,
  parseLagosDateTime,
  planNewsTransition,
  toLagosDateTimeInput,
  wasEverPublic,
} from "./status";

const NOW = new Date("2026-10-23T10:00:00.000Z");
const PAST = "2026-10-01T09:00:00.000Z";
const FUTURE = "2026-10-30T08:00:00.000Z";

describe("deriveNewsState", () => {
  it("separates live and scheduled published posts by date", () => {
    expect(deriveNewsState({ status: "published", publishedAt: PAST }, NOW)).toBe("published");
    expect(deriveNewsState({ status: "published", publishedAt: FUTURE }, NOW)).toBe("scheduled");
    expect(deriveNewsState({ status: "draft", publishedAt: PAST }, NOW)).toBe("draft");
    expect(deriveNewsState({ status: "archived" }, NOW)).toBe("archived");
  });
});

describe("planNewsTransition", () => {
  it("dates a first publication now", () => {
    expect(planNewsTransition({ status: "draft" }, { action: "publish" }, NOW)).toEqual({
      status: "published",
      publishedAt: NOW.toISOString(),
      firstPublishedAt: NOW.toISOString(),
    });
  });

  it("keeps the original date when a once-public post is republished", () => {
    const plan = planNewsTransition({ status: "draft", publishedAt: PAST, firstPublishedAt: PAST }, { action: "publish" }, NOW);
    expect(plan.publishedAt).toBe(PAST);
  });

  it("schedules only in the future and only for never-public posts", () => {
    const at = new Date(FUTURE);
    expect(planNewsTransition({ status: "draft" }, { action: "schedule", publishAt: at }, NOW)).toEqual({
      status: "published",
      publishedAt: FUTURE,
      firstPublishedAt: FUTURE,
    });
    expect(() =>
      planNewsTransition({ status: "draft" }, { action: "schedule", publishAt: new Date(NOW.getTime() + 30_000) }, NOW),
    ).toThrow(NewsTransitionError);
    expect(() =>
      planNewsTransition({ status: "draft", firstPublishedAt: PAST, publishedAt: PAST }, { action: "schedule", publishAt: at }, NOW),
    ).toThrow(/public before/);
  });

  it("publishing a scheduled post early dates it now", () => {
    const plan = planNewsTransition(
      { status: "published", publishedAt: FUTURE, firstPublishedAt: FUTURE },
      { action: "publish" },
      NOW,
    );
    expect(plan.publishedAt).toBe(NOW.toISOString());
  });

  it("clears pending dates when a scheduled post is withdrawn before going live", () => {
    const plan = planNewsTransition(
      { status: "published", publishedAt: FUTURE, firstPublishedAt: FUTURE },
      { action: "unpublish" },
      NOW,
    );
    expect(plan).toEqual({ status: "draft", publishedAt: null, firstPublishedAt: null });
    expect(wasEverPublic({ status: plan.status, firstPublishedAt: undefined }, new Date(FUTURE))).toBe(false);
  });

  it("keeps history when a live post is unpublished or archived", () => {
    const live = { status: "published" as const, publishedAt: PAST, firstPublishedAt: PAST };
    expect(planNewsTransition(live, { action: "unpublish" }, NOW)).toEqual({ status: "draft", publishedAt: PAST, firstPublishedAt: PAST });
    expect(planNewsTransition(live, { action: "archive" }, NOW).status).toBe("archived");
  });

  it("rejects transitions that do not apply", () => {
    expect(() => planNewsTransition({ status: "published", publishedAt: PAST }, { action: "publish" }, NOW)).toThrow(/already live/);
    expect(() => planNewsTransition({ status: "draft" }, { action: "unpublish" }, NOW)).toThrow(NewsTransitionError);
    expect(() => planNewsTransition({ status: "draft" }, { action: "restore" }, NOW)).toThrow(NewsTransitionError);
    expect(() => planNewsTransition({ status: "archived" }, { action: "archive" }, NOW)).toThrow(NewsTransitionError);
    expect(planNewsTransition({ status: "archived" }, { action: "restore" }, NOW).status).toBe("draft");
  });
});

describe("newsPublishBlockers", () => {
  const ready = {
    title: "Bespoke Learn opens",
    bodyText: "A complete article body that is comfortably longer than forty characters.",
    hasImages: false,
    coverAssetId: "cover",
    shareAssetId: "share",
    coverAlt: "Students at work",
  };

  it("allows a complete post", () => {
    expect(newsPublishBlockers(ready)).toEqual([]);
  });

  it("requires a cover with alt text, because it is the share image", () => {
    expect(newsPublishBlockers({ ...ready, coverAssetId: undefined })).toEqual([
      "Add a cover image. It becomes the WhatsApp and social preview.",
    ]);
    expect(newsPublishBlockers({ ...ready, coverAlt: " " })).toEqual(["Describe the cover image (alt text)."]);
  });

  it("requires a headline and a body", () => {
    expect(newsPublishBlockers({ ...ready, title: "", bodyText: "" })).toEqual(["Add a headline.", "Write the article body."]);
    expect(newsPublishBlockers({ ...ready, bodyText: "", hasImages: true })).toEqual([]);
  });
});

describe("Lagos scheduling time", () => {
  it("interprets datetime-local input as West Africa Time (UTC+1)", () => {
    expect(parseLagosDateTime("2026-10-30T09:00")?.toISOString()).toBe("2026-10-30T08:00:00.000Z");
    expect(parseLagosDateTime("2026-10-30 09:00")).toBeNull();
    expect(parseLagosDateTime("tomorrow")).toBeNull();
  });

  it("round-trips through the input format", () => {
    expect(toLagosDateTimeInput(new Date("2026-10-30T08:00:00.000Z"))).toBe("2026-10-30T09:00");
  });
});
