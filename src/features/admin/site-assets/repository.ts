import "server-only";

import type { QueryResultRow } from "pg";
import { adminQuery } from "../db";
import { appendAudit } from "../repository";
import type { AdminSession } from "../types";

/**
 * The fixed set of admin-manageable appearance slots. Every read and write is
 * validated against this allowlist — arbitrary keys are never accepted.
 */
export const SITE_ASSET_KEYS = [
  "hero-phone-1",
  "hero-phone-2",
  "hero-phone-3",
] as const;

export type SiteAssetKey = (typeof SITE_ASSET_KEYS)[number];

export interface SiteAsset {
  assetKey: SiteAssetKey;
  r2Key: string;
  mime: string;
  updatedAt: string;
}

export function isSiteAssetKey(value: string): value is SiteAssetKey {
  return (SITE_ASSET_KEYS as readonly string[]).includes(value);
}

interface Row extends QueryResultRow {
  [key: string]: unknown;
}

function mapSiteAsset(row: Row): SiteAsset {
  const updated = row.updated_at instanceof Date ? row.updated_at : new Date(String(row.updated_at));
  return {
    assetKey: String(row.asset_key) as SiteAssetKey,
    r2Key: String(row.r2_key),
    mime: String(row.mime),
    updatedAt: Number.isNaN(updated.getTime()) ? new Date().toISOString() : updated.toISOString(),
  };
}

export async function getSiteAsset(key: SiteAssetKey): Promise<SiteAsset | null> {
  const result = await adminQuery<Row>(
    "SELECT asset_key, r2_key, mime, updated_at FROM site_assets WHERE asset_key = $1",
    [key],
  );
  return result.rows[0] ? mapSiteAsset(result.rows[0]) : null;
}

/**
 * Public-page read: returns whatever slots are configured, and an empty map
 * when the database or table is unavailable so public rendering never breaks.
 */
export async function listSiteAssetsSafe(): Promise<Partial<Record<SiteAssetKey, SiteAsset>>> {
  try {
    const result = await adminQuery<Row>(
      "SELECT asset_key, r2_key, mime, updated_at FROM site_assets",
    );
    const assets: Partial<Record<SiteAssetKey, SiteAsset>> = {};
    for (const row of result.rows) {
      const mapped = mapSiteAsset(row);
      if (isSiteAssetKey(mapped.assetKey)) assets[mapped.assetKey] = mapped;
    }
    return assets;
  } catch {
    return {};
  }
}

/** Returns the replaced R2 key (if any) so the caller can delete the old object. */
export async function upsertSiteAsset(
  input: { assetKey: SiteAssetKey; r2Key: string; mime: string },
  session: AdminSession,
): Promise<{ previousR2Key?: string }> {
  const previous = await getSiteAsset(input.assetKey);
  await adminQuery(
    `INSERT INTO site_assets (asset_key, r2_key, mime, updated_by, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (asset_key) DO UPDATE SET r2_key = excluded.r2_key, mime = excluded.mime,
       updated_by = excluded.updated_by, updated_at = now()`,
    [input.assetKey, input.r2Key, input.mime, session.userId],
  );
  await appendAudit(session, "site_asset.updated", "site_asset", input.assetKey);
  return { previousR2Key: previous?.r2Key };
}

/** Returns the removed R2 key (if any) so the caller can delete the object. */
export async function deleteSiteAsset(
  assetKey: SiteAssetKey,
  session: AdminSession,
): Promise<{ removedR2Key?: string }> {
  const existing = await getSiteAsset(assetKey);
  if (!existing) return {};
  await adminQuery("DELETE FROM site_assets WHERE asset_key = $1", [assetKey]);
  await appendAudit(session, "site_asset.removed", "site_asset", assetKey);
  return { removedR2Key: existing.r2Key };
}
