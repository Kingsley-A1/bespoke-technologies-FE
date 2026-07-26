import "server-only";

import { randomUUID } from "node:crypto";
import type { QueryResultRow } from "pg";
import { calculateDocumentTotals } from "../billing/money";
import { adminQuery, withAdminTransaction } from "../db";
import { getPortfolioProject } from "../portfolio/repository";
import { appendAudit, getAdminSnapshot } from "../repository";
import type {
  AdminSession,
  CertificateOwnerKind,
  CommercialMode,
  CurrencyCode,
  OwnershipCertificate,
} from "../types";
import { hashCertificateToken } from "./security";
import { DEFAULT_OWNERSHIP_STATEMENT } from "./constants";

interface Row extends QueryResultRow {
  [key: string]: unknown;
}

function optional(value: unknown) {
  return value === null || value === undefined || value === "" ? undefined : String(value);
}

function iso(value: unknown) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function json<T>(value: unknown): T {
  if (typeof value === "string") return JSON.parse(value) as T;
  return value as T;
}

function mapCertificate(row: Row): OwnershipCertificate {
  return {
    id: String(row.id),
    certificateNumber: String(row.certificate_number),
    projectId: optional(row.project_id),
    portfolioProjectId: optional(row.portfolio_project_id),
    clientId: optional(row.client_id),
    billingDocumentId: optional(row.billing_document_id),
    status: String(row.status) as OwnershipCertificate["status"],
    owner: json(row.owner_snapshot),
    project: json(row.project_snapshot),
    commercial: json(row.commercial_snapshot),
    company: json(row.company_snapshot),
    ownershipStatement: String(row.ownership_statement),
    verificationToken: optional(row.verification_token),
    pdfKey: optional(row.pdf_key),
    pdfSha256: optional(row.pdf_sha256),
    issuedAt: iso(row.issued_at),
    issuedBy: optional(row.issued_by),
    deliveredTo: optional(row.delivered_to),
    deliveryState: String(row.delivery_state) as OwnershipCertificate["deliveryState"],
    deliveryProviderId: optional(row.delivery_provider_id),
    deliveryError: optional(row.delivery_error),
    deliveredAt: iso(row.delivered_at),
    revokedAt: iso(row.revoked_at),
    revokedBy: optional(row.revoked_by),
    revocationReason: optional(row.revocation_reason),
    replacesCertificateId: optional(row.replaces_certificate_id),
    createdAt: iso(row.created_at) ?? new Date().toISOString(),
    updatedAt: iso(row.updated_at) ?? new Date().toISOString(),
  };
}

export async function listOwnershipCertificates() {
  const result = await adminQuery<Row>("SELECT * FROM ownership_certificates ORDER BY created_at DESC");
  return result.rows.map(mapCertificate);
}

export async function getOwnershipCertificate(id: string) {
  const result = await adminQuery<Row>("SELECT * FROM ownership_certificates WHERE id=$1 LIMIT 1", [id]);
  return result.rows[0] ? mapCertificate(result.rows[0]) : null;
}

export async function getOwnershipCertificateByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{40,80}$/.test(token)) return null;
  const result = await adminQuery<Row>(
    "SELECT * FROM ownership_certificates WHERE verification_token_hash=$1 AND status IN ('issued','revoked') LIMIT 1",
    [hashCertificateToken(token)],
  );
  return result.rows[0] ? mapCertificate(result.rows[0]) : null;
}

export function certificateReadiness(
  project: Awaited<ReturnType<typeof getAdminSnapshot>>["projects"][number],
  documents: Awaited<ReturnType<typeof getAdminSnapshot>>["documents"],
) {
  const invoice = project.finalInvoiceId ? documents.find((candidate) => candidate.id === project.finalInvoiceId) : undefined;
  const missing: string[] = [];
  if (project.status !== "completed") missing.push("Project is not completed");
  if (!project.completedAt) missing.push("Actual completion date");
  if (!project.startDate) missing.push("Project start date");
  if (!project.projectType) missing.push("Project type");
  if (!project.summary.trim()) missing.push("Project description");
  if (!project.projectLogoKey) missing.push("Project logo");
  if (project.commercialMode === "paid" && (!invoice || invoice.type !== "standard" || invoice.status !== "paid")) {
    missing.push("Paid final standard invoice");
  }
  return { ready: missing.length === 0, missing, invoice };
}

async function allocateCertificateNumber(client: Parameters<Parameters<typeof withAdminTransaction>[0]>[0]) {
  const prefix = "BT-OWN";
  const year = new Date().getFullYear();
  const result = await client.query<{ allocated: string }>(
    `INSERT INTO document_sequences (prefix, sequence_year, next_value)
     VALUES ($1,$2,2)
     ON CONFLICT (prefix, sequence_year)
     DO UPDATE SET next_value=document_sequences.next_value+1
     RETURNING (next_value-1)::STRING AS allocated`,
    [prefix, year],
  );
  return `${prefix}-${year}-${String(result.rows[0]?.allocated ?? "1").padStart(4, "0")}`;
}

export async function createOwnershipCertificateDraft(
  input: {
    projectId?: string;
    portfolioProjectId?: string;
    ownerKind: CertificateOwnerKind;
    ownerName: string;
    ownerEmail?: string;
    ownerAddress?: string;
    ownershipStatement?: string;
    invoiceTotalIncludesTaxAndDiscounts: boolean;
    portfolioStartDate?: string;
    portfolioCompletionDate?: string;
    portfolioCommercialMode?: CommercialMode;
    portfolioAmount?: number;
    portfolioCurrency?: CurrencyCode;
    portfolioDisplayValuePublicly?: boolean;
    portfolioValueNote?: string;
  },
  session: AdminSession,
) {
  const snapshot = await getAdminSnapshot();
  if (Boolean(input.projectId) === Boolean(input.portfolioProjectId)) {
    throw new Error("Choose one delivery project or portfolio project.");
  }

  const deliveryProject = input.projectId
    ? snapshot.projects.find((candidate) => candidate.id === input.projectId)
    : undefined;
  if (input.projectId && !deliveryProject) throw new Error("Project not found.");

  const portfolioProject = input.portfolioProjectId
    ? await getPortfolioProject(input.portfolioProjectId)
    : undefined;
  if (input.portfolioProjectId && !portfolioProject) throw new Error("Portfolio project not found.");

  const readiness = deliveryProject
    ? certificateReadiness(deliveryProject, snapshot.documents)
    : undefined;
  if (readiness && !readiness.ready) {
    throw new Error(`Certificate is not ready: ${readiness.missing.join(", ")}.`);
  }

  const client = deliveryProject
    ? snapshot.clients.find((candidate) => candidate.id === deliveryProject.clientId)
    : undefined;
  if (deliveryProject && !client) throw new Error("Project client not found.");
  if (portfolioProject?.comingSoon) {
    throw new Error("Coming-soon portfolio projects cannot receive ownership certificates.");
  }
  if (portfolioProject && (!input.portfolioStartDate || !input.portfolioCompletionDate)) {
    throw new Error("Project start and completion dates are required.");
  }
  if (
    portfolioProject
    && input.portfolioStartDate!
      > input.portfolioCompletionDate!
  ) {
    throw new Error("Completion date cannot be earlier than the start date.");
  }
  if (
    portfolioProject
    && !portfolioProject.imageKey
    && !isSupportedPortfolioLogo(portfolioProject.imageUrl)
  ) {
    throw new Error("The portfolio project needs a PNG or JPEG logo before certificate preparation.");
  }

  const totals = readiness?.invoice
    ? calculateDocumentTotals(readiness.invoice, snapshot.payments)
    : undefined;
  const id = randomUUID();
  const replaced = (await listOwnershipCertificates()).find(
    (candidate) =>
      candidate.status === "revoked"
      && (
        (deliveryProject && candidate.projectId === deliveryProject.id)
        || (portfolioProject && candidate.portfolioProjectId === portfolioProject.id)
      ),
  );
  const certificate = await withAdminTransaction(async (db) => {
    const certificateNumber = await allocateCertificateNumber(db);
    const owner = {
      kind: input.ownerKind,
      name: input.ownerName,
      email: input.ownerEmail || undefined,
      address: input.ownerAddress || undefined,
    };
    const projectSnapshot = deliveryProject
      ? {
          name: deliveryProject.name,
          type: deliveryProject.projectType!,
          description: deliveryProject.summary,
          startDate: deliveryProject.startDate!,
          completionDate: deliveryProject.completedAt!,
          portfolioProjectId: deliveryProject.portfolioProjectId,
          projectLogoKey: deliveryProject.projectLogoKey,
          projectLogoMime: deliveryProject.projectLogoMime,
        }
      : {
          name: portfolioProject!.name,
          type: portfolioProject!.type,
          description: portfolioProject!.description,
          startDate: input.portfolioStartDate!,
          completionDate: input.portfolioCompletionDate!,
          portfolioProjectId: portfolioProject!.id,
          projectLogoKey: portfolioProject!.imageKey,
          projectLogoMime: portfolioProject!.imageMime,
          projectLogoUrl: portfolioProject!.imageKey ? undefined : portfolioProject!.imageUrl,
        };
    const commercial = deliveryProject
      ? {
          mode: deliveryProject.commercialMode,
          amount: deliveryProject.commercialMode === "free"
            ? 0
            : totals?.total
              || (deliveryProject.commercialMode === "donation" ? deliveryProject.commercialValue : undefined),
          currency: deliveryProject.commercialMode === "free"
            ? deliveryProject.currency
            : readiness?.invoice?.currency || deliveryProject.currency,
          displayPublicly: deliveryProject.showValuePublicly,
          valueNote: deliveryProject.valueNote,
          invoiceNumber: readiness?.invoice?.documentNumber,
          invoiceTotalIncludesTaxAndDiscounts: input.invoiceTotalIncludesTaxAndDiscounts,
        }
      : {
          mode: input.portfolioCommercialMode ?? "undisclosed",
          amount: input.portfolioCommercialMode === "free"
            ? 0
            : input.portfolioCommercialMode === "undisclosed"
              ? undefined
              : input.portfolioAmount,
          currency: input.portfolioCurrency ?? snapshot.settings.defaultCurrency,
          displayPublicly: Boolean(
            input.portfolioDisplayValuePublicly
            && input.portfolioCommercialMode !== "undisclosed"
            && (
              input.portfolioCommercialMode === "free"
              || input.portfolioCommercialMode === "donation"
              || input.portfolioAmount !== undefined
            ),
          ),
          valueNote: input.portfolioValueNote || undefined,
          invoiceTotalIncludesTaxAndDiscounts: false,
        };
    const company = {
      name: snapshot.settings.name,
      website: snapshot.settings.website,
      phone: snapshot.settings.phone,
      email: snapshot.settings.email,
      registrationNumber: snapshot.settings.registrationNumber,
      motto: snapshot.settings.motto,
      address: snapshot.settings.address,
      ceoName: snapshot.settings.ceoName,
      ceoTitle: snapshot.settings.ceoTitle,
    };
    const result = await db.query<Row>(
      `INSERT INTO ownership_certificates
       (id, certificate_number, project_id, portfolio_project_id, client_id, billing_document_id, owner_kind,
        owner_snapshot, project_snapshot, commercial_snapshot, company_snapshot,
        ownership_statement, replaces_certificate_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::JSONB,$9::JSONB,$10::JSONB,$11::JSONB,$12,$13,$14)
       RETURNING *`,
      [
        id,
        certificateNumber,
        deliveryProject?.id || null,
        portfolioProject?.id || null,
        client?.id || null,
        readiness?.invoice?.id || null,
        input.ownerKind,
        JSON.stringify(owner),
        JSON.stringify(projectSnapshot),
        JSON.stringify(commercial),
        JSON.stringify(company),
        input.ownershipStatement || DEFAULT_OWNERSHIP_STATEMENT,
        replaced?.id || null,
        session.userId,
      ],
    );
    return mapCertificate(result.rows[0]);
  });
  await appendAudit(session, "ownership_certificate.draft_created", "ownership_certificate", id, undefined, {
    projectId: deliveryProject?.id,
    portfolioProjectId: portfolioProject?.id,
    certificateNumber: certificate.certificateNumber,
  });
  return certificate;
}

function isSupportedPortfolioLogo(value?: string) {
  if (!value?.startsWith("/") || value.includes("..")) return false;
  return /\.(png|jpe?g)$/i.test(value);
}

export async function discardOwnershipCertificateDraft(id: string, session: AdminSession) {
  const result = await adminQuery<Row>(
    "DELETE FROM ownership_certificates WHERE id=$1 AND status='draft' RETURNING *",
    [id],
  );
  if (!result.rows[0]) throw new Error("Only an unissued certificate draft can be discarded.");
  const certificate = mapCertificate(result.rows[0]);
  await appendAudit(session, "ownership_certificate.draft_discarded", "ownership_certificate", id, undefined, {
    certificateNumber: certificate.certificateNumber,
  });
  return certificate;
}

export async function issueOwnershipCertificate(
  id: string,
  input: { token: string; tokenHash: string; pdfKey: string; pdfSha256: string; issuedAt: string },
  session: AdminSession,
) {
  const result = await adminQuery<Row>(
    `UPDATE ownership_certificates SET status='issued', verification_token=$2, verification_token_hash=$3,
       pdf_key=$4, pdf_sha256=$5, issued_at=$6, issued_by=$7, updated_at=now()
     WHERE id=$1 AND status='draft' RETURNING *`,
    [id, input.token, input.tokenHash, input.pdfKey, input.pdfSha256, input.issuedAt, session.userId],
  );
  if (!result.rows[0]) throw new Error("Only an active draft can be issued.");
  const certificate = mapCertificate(result.rows[0]);
  await appendAudit(session, "ownership_certificate.issued", "ownership_certificate", id, undefined, {
    certificateNumber: certificate.certificateNumber,
    pdfSha256: input.pdfSha256,
  });
  return certificate;
}

export async function recordCertificateDelivery(
  id: string,
  input: { to: string; ok: boolean; providerId?: string; error?: string },
  session: AdminSession,
) {
  const result = await adminQuery<Row>(
    `UPDATE ownership_certificates SET delivered_to=$2, delivery_state=$3,
       delivery_provider_id=$4, delivery_error=$5,
       delivered_at=CASE WHEN $3='sent' THEN now() ELSE delivered_at END, updated_at=now()
     WHERE id=$1 AND status='issued' RETURNING *`,
    [id, input.to, input.ok ? "sent" : "failed", input.providerId || null, input.error || null],
  );
  if (!result.rows[0]) throw new Error("An issued certificate is required.");
  await appendAudit(session, input.ok ? "ownership_certificate.delivered" : "ownership_certificate.delivery_failed", "ownership_certificate", id, input.error, { to: input.to });
  return mapCertificate(result.rows[0]);
}

export async function revokeOwnershipCertificate(id: string, reason: string, session: AdminSession) {
  const result = await adminQuery<Row>(
    `UPDATE ownership_certificates SET status='revoked', revoked_at=now(), revoked_by=$2,
       revocation_reason=$3, updated_at=now()
     WHERE id=$1 AND status='issued' RETURNING *`,
    [id, session.userId, reason],
  );
  if (!result.rows[0]) throw new Error("Only an issued certificate can be revoked.");
  await appendAudit(session, "ownership_certificate.revoked", "ownership_certificate", id, reason);
  return mapCertificate(result.rows[0]);
}
