import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl?: string;
};

let client: S3Client | undefined;

export function getR2Config(): R2Config | undefined {
  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    R2_PUBLIC_BASE_URL,
  } = process.env;

  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET_NAME
  ) {
    return undefined;
  }

  return {
    accountId: R2_ACCOUNT_ID,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    bucketName: R2_BUCKET_NAME,
    publicBaseUrl: R2_PUBLIC_BASE_URL,
  };
}

export function isR2Configured() {
  return Boolean(getR2Config());
}

export function getR2Client() {
  const config = getR2Config();
  if (!config) return undefined;

  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return client;
}

export async function putR2Object({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
}) {
  const config = getR2Config();
  const r2 = getR2Client();
  if (!config || !r2) {
    throw new Error("Cloudflare R2 is not configured.");
  }

  await r2.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return config.publicBaseUrl
    ? `${config.publicBaseUrl.replace(/\/$/, "")}/${key}`
    : undefined;
}

export async function getR2Object(key: string) {
  const config = getR2Config();
  const r2 = getR2Client();
  if (!config || !r2) {
    throw new Error("Cloudflare R2 is not configured.");
  }

  return r2.send(
    new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    }),
  );
}

/**
 * Fetches a stored object fully into memory. Returns `null` when the object is
 * missing. Suitable for the size-capped documents/covers this app stores.
 */
export async function getR2ObjectBytes(
  key: string,
): Promise<{ bytes: Uint8Array; contentType?: string } | null> {
  try {
    const output = await getR2Object(key);
    if (!output.Body) return null;
    const bytes = await output.Body.transformToByteArray();
    return { bytes, contentType: output.ContentType };
  } catch (error) {
    const name = typeof error === "object" && error && "name" in error ? String(error.name) : "";
    if (name === "NoSuchKey" || name === "NotFound") return null;
    throw error;
  }
}
export async function deleteR2Object(key: string) {
  const config = getR2Config();
  const r2 = getR2Client();
  if (!config || !r2) {
    throw new Error("Cloudflare R2 is not configured.");
  }

  await r2.send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    }),
  );
}
