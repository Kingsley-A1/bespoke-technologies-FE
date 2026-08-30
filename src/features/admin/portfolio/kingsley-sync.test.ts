import { describe, expect, it } from "vitest";
import {
  buildKingsleyRefreshRequest,
  notifyKingsleyPortfolioChange,
} from "./kingsley-sync";

const payload = {
  event: "portfolio.updated" as const,
  projectId: "savemi",
  occurredAt: "2026-08-30T12:00:00.000Z",
};

const config = {
  url: "https://kingsley.example/api/revalidate/portfolio",
  secret: "portfolio-sync-secret-with-at-least-32-characters",
};

describe("buildKingsleyRefreshRequest", () => {
  it("creates the timestamped signed request contract", () => {
    expect(buildKingsleyRefreshRequest(payload, config, 1788091200000)).toEqual({
      url: config.url,
      body: '{"event":"portfolio.updated","projectId":"savemi","occurredAt":"2026-08-30T12:00:00.000Z"}',
      headers: {
        "content-type": "application/json",
        "x-portfolio-signature":
          "dca2a8ac7069ee2e94b1c82ccd519ac21f8a171bd95455739863374486779f9b",
        "x-portfolio-timestamp": "1788091200000",
      },
    });
  });

  it.each([
    { url: "", secret: config.secret },
    { url: config.url, secret: "short" },
    { url: "not-a-url", secret: config.secret },
  ])("disables invalid configuration", (invalidConfig) => {
    expect(buildKingsleyRefreshRequest(payload, invalidConfig, 1788091200000)).toBeNull();
  });
});

describe("notifyKingsleyPortfolioChange", () => {
  it("reports disabled configuration without sending", async () => {
    const result = await notifyKingsleyPortfolioChange(payload, {
      url: "",
      secret: "",
    });

    expect(result).toEqual({ status: "disabled" });
  });

  it("reports a failed secondary refresh without throwing", async () => {
    const result = await notifyKingsleyPortfolioChange(
      payload,
      config,
      async () => new Response(null, { status: 503 }),
    );

    expect(result).toEqual({ status: "failed" });
  });

  it("reports a successful secondary refresh", async () => {
    const result = await notifyKingsleyPortfolioChange(
      payload,
      config,
      async () => new Response(null, { status: 200 }),
    );

    expect(result).toEqual({ status: "sent" });
  });
});
