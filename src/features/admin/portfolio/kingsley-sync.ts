import { createHmac } from "node:crypto";

export type PortfolioSyncEvent =
  | "portfolio.created"
  | "portfolio.updated"
  | "portfolio.deleted";

export interface PortfolioSyncPayload {
  event: PortfolioSyncEvent;
  projectId: string;
  occurredAt: string;
}

interface KingsleySyncConfig {
  url?: string;
  secret?: string;
}

interface KingsleyRefreshRequest {
  url: string;
  body: string;
  headers: Record<string, string>;
}

export type KingsleySyncResult = {
  status: "sent" | "disabled" | "failed";
};

function validConfig(config: KingsleySyncConfig) {
  if (!config.secret || config.secret.length < 32 || !config.url) return null;

  try {
    const url = new URL(config.url);
    if (url.protocol !== "https:" && url.hostname !== "localhost") return null;
    return { url: url.toString(), secret: config.secret };
  } catch {
    return null;
  }
}

export function buildKingsleyRefreshRequest(
  payload: PortfolioSyncPayload,
  config: KingsleySyncConfig,
  timestamp = Date.now(),
): KingsleyRefreshRequest | null {
  const validated = validConfig(config);
  if (!validated || !Number.isSafeInteger(timestamp)) return null;

  const body = JSON.stringify(payload);
  const signedValue = `${timestamp}.${body}`;
  const signature = createHmac("sha256", validated.secret)
    .update(signedValue)
    .digest("hex");

  return {
    url: validated.url,
    body,
    headers: {
      "content-type": "application/json",
      "x-portfolio-signature": signature,
      "x-portfolio-timestamp": String(timestamp),
    },
  };
}

export async function notifyKingsleyPortfolioChange(
  payload: PortfolioSyncPayload,
  config: KingsleySyncConfig = {
    url: process.env.KINGSLEY_PORTFOLIO_REVALIDATE_URL,
    secret: process.env.KINGSLEY_PORTFOLIO_REVALIDATION_SECRET,
  },
  fetchImpl: typeof fetch = fetch,
): Promise<KingsleySyncResult> {
  const refreshRequest = buildKingsleyRefreshRequest(payload, config);
  if (!refreshRequest) return { status: "disabled" };

  try {
    const response = await fetchImpl(refreshRequest.url, {
      method: "POST",
      body: refreshRequest.body,
      headers: refreshRequest.headers,
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    return { status: response.ok ? "sent" : "failed" };
  } catch {
    return { status: "failed" };
  }
}
