import { readFile } from "node:fs/promises";
import path from "node:path";

let cachedIconDataUri: string | null = null;

/**
 * The approved Bespoke Technologies BT mark as a data URI, for server-rendered
 * share cards (OG images) where remote asset fetching is unreliable.
 */
export async function getBrandIconDataUri(): Promise<string> {
  if (!cachedIconDataUri) {
    const file = await readFile(
      path.join(process.cwd(), "public", "icons", "bespoke-technologies-icon.png"),
    );
    cachedIconDataUri = `data:image/png;base64,${file.toString("base64")}`;
  }
  return cachedIconDataUri;
}
