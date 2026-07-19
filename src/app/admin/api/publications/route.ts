import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { assertRecentAdminPermission, isSameOrigin } from "@/features/admin/access";
import { isR2Configured, putR2Object } from "@/lib/storage/r2";
import { createPublication } from "@/features/admin/publications/repository";
import {
  ALLOWED_COVER_MIME,
  ALLOWED_DOCUMENT_MIME,
  MAX_COVER_BYTES,
  MAX_DOCUMENT_BYTES,
  publicationFormSchema,
} from "@/features/admin/publications/schema";

export const runtime = "nodejs";

function extensionForMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "application/pdf") return "pdf";
  return "bin";
}

export async function POST(request: Request) {
  const access = await assertRecentAdminPermission("publications.manage");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "Document storage is not configured. Add the Cloudflare R2 environment variables." },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart form submission." }, { status: 400 });
  }

  const parsed = publicationFormSchema.safeParse({
    kind: form.get("kind"),
    title: form.get("title"),
    summary: form.get("summary") ?? "",
    pageCount: form.get("pageCount") ?? undefined,
    clientLabel: form.get("clientLabel") ?? "",
    projectLabel: form.get("projectLabel") ?? "",
    authorLabel: form.get("authorLabel") ?? "",
    cardVariant: form.get("cardVariant") ?? "standard",
    isFree: form.get("isFree") ?? "true",
    priceAmount: form.get("priceAmount") ?? undefined,
    priceCurrency: form.get("priceCurrency") ?? "NGN",
    publish: form.get("publish") ?? "false",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form fields." }, { status: 400 });
  }
  const data = parsed.data;

  const cover = form.get("cover");
  const document = form.get("document");
  const keyPrefix = randomUUID();

  let coverKey: string | undefined;
  let coverUrl: string | undefined;
  if (cover instanceof File && cover.size > 0) {
    if (!ALLOWED_COVER_MIME.includes(cover.type)) {
      return NextResponse.json({ error: "Cover must be a PNG, JPEG, or WebP image." }, { status: 400 });
    }
    if (cover.size > MAX_COVER_BYTES) {
      return NextResponse.json({ error: "Cover image exceeds the 5 MB limit." }, { status: 400 });
    }
    coverKey = `publications/covers/${keyPrefix}.${extensionForMime(cover.type)}`;
    coverUrl = await putR2Object({
      key: coverKey,
      body: Buffer.from(await cover.arrayBuffer()),
      contentType: cover.type,
    });
  }

  let documentKey: string | undefined;
  let documentMime = "application/pdf";
  if (document instanceof File && document.size > 0) {
    if (!ALLOWED_DOCUMENT_MIME.includes(document.type)) {
      return NextResponse.json({ error: "The document must be a PDF." }, { status: 400 });
    }
    if (document.size > MAX_DOCUMENT_BYTES) {
      return NextResponse.json({ error: "The document exceeds the 25 MB limit." }, { status: 400 });
    }
    documentMime = document.type;
    documentKey = `publications/docs/${keyPrefix}.${extensionForMime(document.type)}`;
    await putR2Object({
      key: documentKey,
      body: Buffer.from(await document.arrayBuffer()),
      contentType: document.type,
    });
  }

  if (!documentKey) {
    return NextResponse.json({ error: "A PDF document is required." }, { status: 400 });
  }

  const publication = await createPublication(
    {
      kind: data.kind,
      title: data.title,
      summary: data.summary || undefined,
      coverKey,
      coverUrl,
      documentKey,
      documentMime,
      pageCount: data.pageCount,
      clientLabel: data.clientLabel || undefined,
      projectLabel: data.projectLabel || undefined,
      authorLabel: data.authorLabel || undefined,
      priceAmount: data.priceAmount,
      priceCurrency: data.priceCurrency,
      isFree: data.isFree,
      cardVariant: data.cardVariant,
      status: data.publish ? "published" : "draft",
    },
    access.session,
  );

  return NextResponse.json({ ok: true, id: publication.id, slug: publication.slug }, { status: 201 });
}
