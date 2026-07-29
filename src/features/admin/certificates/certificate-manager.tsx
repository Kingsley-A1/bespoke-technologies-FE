"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, Download, Mail, QrCode, ShieldAlert } from "lucide-react";
import { formatAdminDate, formatMoney } from "@/features/admin/billing/money";
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  StatusPill,
  textareaClass,
} from "@/features/admin/components/admin-ui";
import type {
  CertificateOwnerKind,
  CommercialMode,
  CurrencyCode,
  OwnershipCertificate,
} from "@/features/admin/types";
import { DEFAULT_OWNERSHIP_STATEMENT } from "./constants";
import { documentVerificationUrl } from "@/lib/company";

export interface ReadyCertificateProject {
  id: string;
  source: "delivery" | "portfolio";
  name: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  commercialMode: string;
  amount?: number;
  currency: CurrencyCode;
  portfolioYear?: string;
}

export function CertificateManager({
  readyProjects,
  certificates,
  canIssue,
}: {
  readyProjects: ReadyCertificateProject[];
  certificates: OwnershipCertificate[];
  canIssue: boolean;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <h2 className="font-bold text-slate-950">Ready for certificate preparation</h2>
          <p className="mt-1 text-xs text-slate-500">
            Completed delivery projects and finished portfolio work use the same controlled certificate register.
          </p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
          {readyProjects.map((project) => (
            <DraftCard key={`${project.source}:${project.id}`} project={project} />
          ))}
          {!readyProjects.length && (
            <p className="text-sm text-slate-500">No projects are currently ready for a new certificate.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <h2 className="font-bold text-slate-950">Ownership certificate register</h2>
          <p className="mt-1 text-xs text-slate-500">
            {certificates.length} managed drafts and immutable issued records.
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {certificates.map((certificate) => (
            <CertificateRow key={certificate.id} certificate={certificate} canIssue={canIssue} />
          ))}
          {!certificates.length && (
            <p className="p-8 text-center text-sm text-slate-500">No certificates have been prepared.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function DraftCard({ project }: { project: ReadyCertificateProject }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [ownerKind, setOwnerKind] = useState<CertificateOwnerKind>("company");
  const [portfolioCommercialMode, setPortfolioCommercialMode] = useState<CommercialMode>("undisclosed");

  async function create(formData: FormData) {
    const amount = String(formData.get("portfolioAmount") || "").trim();
    setPending(true);
    setError("");
    const response = await fetch("/admin/api/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project.source === "delivery" ? project.id : undefined,
        portfolioProjectId: project.source === "portfolio" ? project.id : undefined,
        ownerKind,
        ownerName: String(formData.get("ownerName") || ""),
        ownerEmail: String(formData.get("ownerEmail") || ""),
        ownerAddress: String(formData.get("ownerAddress") || ""),
        ownershipStatement: String(formData.get("ownershipStatement") || ""),
        invoiceTotalIncludesTaxAndDiscounts:
          formData.get("invoiceTotalIncludesTaxAndDiscounts") === "on",
        portfolioStartDate: String(formData.get("portfolioStartDate") || "") || undefined,
        portfolioCompletionDate:
          String(formData.get("portfolioCompletionDate") || "") || undefined,
        portfolioCommercialMode:
          project.source === "portfolio" ? portfolioCommercialMode : undefined,
        portfolioAmount: amount ? Number(amount) : undefined,
        portfolioCurrency:
          project.source === "portfolio"
            ? String(formData.get("portfolioCurrency") || project.currency)
            : undefined,
        portfolioDisplayValuePublicly:
          formData.get("portfolioDisplayValuePublicly") === "on",
        portfolioValueLabel: String(formData.get("portfolioValueLabel") || ""),
        portfolioValueNote: String(formData.get("portfolioValueNote") || ""),
      }),
    });
    const body = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(body.error || "The certificate draft could not be created.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  const value =
    project.commercialMode === "free"
      ? "Free"
      : project.commercialMode === "undisclosed"
        ? "Undisclosed"
        : project.amount !== undefined
          ? formatMoney(project.amount, project.currency)
          : project.commercialMode;

  return (
    <article className="rounded-xl border border-blue-100 bg-blue-50/45 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
            {project.source === "portfolio" ? "Portfolio project" : project.commercialMode}
          </p>
          <h3 className="mt-2 font-bold text-slate-950">{project.name}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {project.source === "portfolio"
              ? `Showcase ${project.portfolioYear || ""}`
              : `${project.clientName} · ${value}`}
          </p>
        </div>
        <BadgeCheck className="h-5 w-5 text-emerald-600" />
      </div>
      <button
        type="button"
        className={`${primaryButtonClass} mt-4 w-full`}
        onClick={() => setOpen(true)}
      >
        Prepare certificate
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[75] overflow-y-auto bg-slate-950/60 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`certificate-title-${project.id}`}
        >
          <button
            type="button"
            className="fixed inset-0"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />
          <form
            action={create}
            className="relative mx-auto max-w-2xl space-y-4 rounded-xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 id={`certificate-title-${project.id}`} className="font-bold">
                  Prepare {project.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {project.source === "portfolio"
                    ? "Confirm completion, ownership, and commercial details for this showcase project."
                    : "Review the legal owner before creating the managed draft."}
                </p>
              </div>
              <button type="button" className={secondaryButtonClass} onClick={() => setOpen(false)}>
                Close
              </button>
            </div>

            {project.source === "portfolio" && (
              <div className="grid gap-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4 sm:grid-cols-2">
                <label>
                  <span className={labelClass}>Project started</span>
                  <input className={inputClass} name="portfolioStartDate" type="date" required />
                </label>
                <label>
                  <span className={labelClass}>Project completed</span>
                  <input className={inputClass} name="portfolioCompletionDate" type="date" required />
                </label>
                <label>
                  <span className={labelClass}>Commercial basis</span>
                  <select
                    className={inputClass}
                    name="portfolioCommercialMode"
                    value={portfolioCommercialMode}
                    onChange={(event) =>
                      setPortfolioCommercialMode(event.target.value as CommercialMode)
                    }
                  >
                    <option value="paid">Paid</option>
                    <option value="free">Free</option>
                    <option value="donation">Donation</option>
                    <option value="undisclosed">Undisclosed</option>
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Currency</span>
                  <select className={inputClass} name="portfolioCurrency" defaultValue={project.currency}>
                    <option value="NGN">NGN</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                  </select>
                </label>
                {(portfolioCommercialMode === "paid" ||
                  portfolioCommercialMode === "donation") && (
                  <label>
                    <span className={labelClass}>
                      {portfolioCommercialMode === "donation"
                        ? "Donation value (optional)"
                        : "Project value (optional)"}
                    </span>
                    <input
                      className={inputClass}
                      name="portfolioAmount"
                      type="number"
                      min="0"
                      step="0.01"
                    />
                  </label>
                )}
                <label>
                  <span className={labelClass}>Project value wording (optional)</span>
                  <input
                    className={inputClass}
                    name="portfolioValueLabel"
                    maxLength={120}
                    placeholder="For example: But Jesus Paid It All."
                  />
                </label>
                <label>
                  <span className={labelClass}>Value note (optional)</span>
                  <input
                    className={inputClass}
                    name="portfolioValueNote"
                    maxLength={240}
                    placeholder="Context shown beneath the value"
                  />
                </label>
                <label className="flex gap-2 text-xs leading-5 text-slate-600 sm:col-span-2">
                  <input
                    type="checkbox"
                    name="portfolioDisplayValuePublicly"
                    className="mt-1"
                    disabled={portfolioCommercialMode === "undisclosed"}
                  />
                  Allow the value to appear on the public verification page
                </label>
              </div>
            )}

            <label>
              <span className={labelClass}>Owner type</span>
              <select
                className={inputClass}
                value={ownerKind}
                onChange={(event) => setOwnerKind(event.target.value as CertificateOwnerKind)}
              >
                <option value="company">Organization / entity</option>
                <option value="contact">Contact person</option>
                <option value="other">Another legal owner</option>
              </select>
            </label>
            <label>
              <span className={labelClass}>Legal owner name</span>
              <input
                className={inputClass}
                name="ownerName"
                defaultValue={project.clientName}
                required
              />
            </label>
            <label>
              <span className={labelClass}>Delivery email</span>
              <input
                className={inputClass}
                name="ownerEmail"
                type="email"
                defaultValue={project.clientEmail}
              />
            </label>
            <label>
              <span className={labelClass}>Owner address</span>
              <input
                className={inputClass}
                name="ownerAddress"
                defaultValue={project.clientAddress}
              />
            </label>
            <label>
              <span className={labelClass}>Ownership statement</span>
              <textarea
                className={textareaClass}
                name="ownershipStatement"
                minLength={40}
                defaultValue={DEFAULT_OWNERSHIP_STATEMENT}
                required
              />
            </label>
            {project.source === "delivery" && (
              <label className="flex gap-2 text-xs leading-5 text-slate-600">
                <input
                  type="checkbox"
                  name="invoiceTotalIncludesTaxAndDiscounts"
                  className="mt-1"
                />
                State that the displayed invoice total includes recorded tax and discounts
              </label>
            )}
            {error && <p className="text-xs font-semibold text-rose-700">{error}</p>}
            <button className={`${primaryButtonClass} w-full`} disabled={pending}>
              {pending ? "Preparing…" : "Create certificate draft"}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

function CertificateRow({
  certificate,
  canIssue,
}: {
  certificate: OwnershipCertificate;
  canIssue: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");

  async function post(action: "issue" | "deliver" | "revoke", payload?: object) {
    setPending(action);
    setError("");
    const response = await fetch(`/admin/api/certificates/${certificate.id}/${action}`, {
      method: "POST",
      headers: payload ? { "Content-Type": "application/json" } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const body = await response.json().catch(() => ({}));
    setPending("");
    if (!response.ok) {
      setError(body.error || `The certificate could not be ${action}d.`);
      return;
    }
    router.refresh();
  }

  function deliver() {
    const email = window.prompt(
      "Send the issued certificate to:",
      certificate.deliveredTo || certificate.owner.email || "",
    );
    if (email) void post("deliver", { email });
  }

  function revoke() {
    const reason = window.prompt("Enter the permanent revocation reason:");
    if (reason) void post("revoke", { reason });
  }

  async function discard() {
    if (!window.confirm(`Discard draft ${certificate.certificateNumber}?`)) return;
    setPending("discard");
    setError("");
    const response = await fetch(`/admin/api/certificates/${certificate.id}`, {
      method: "DELETE",
    });
    const body = await response.json().catch(() => ({}));
    setPending("");
    if (!response.ok) {
      setError(body.error || "The draft could not be discarded.");
      return;
    }
    router.refresh();
  }

  const verifyUrl = certificate.verificationToken
    ? documentVerificationUrl(
        certificate.certificateNumber,
        certificate.verificationToken,
      )
    : undefined;

  return (
    <article className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-950">{certificate.certificateNumber}</h3>
            <StatusPill value={certificate.status} />
            <StatusPill value={certificate.deliveryState} />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-700">{certificate.project.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {certificate.owner.name}
            {certificate.issuedAt
              ? ` · issued ${formatAdminDate(certificate.issuedAt)}`
              : " · awaiting founder issue"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {certificate.status === "draft" && canIssue && (
            <button
              className={primaryButtonClass}
              disabled={Boolean(pending)}
              onClick={() => void post("issue")}
            >
              <ShieldAlert className="h-4 w-4" />
              {pending === "issue" ? "Issuing…" : "Issue certificate"}
            </button>
          )}
          {certificate.status === "draft" && (
            <button
              className={secondaryButtonClass}
              disabled={Boolean(pending)}
              onClick={() => void discard()}
            >
              {pending === "discard" ? "Discarding…" : "Discard draft"}
            </button>
          )}
          {certificate.pdfKey && (
            <Link
              className={secondaryButtonClass}
              href={`/admin/api/certificates/${certificate.id}/pdf`}
            >
              <Download className="h-4 w-4" /> PDF
            </Link>
          )}
          {verifyUrl && (
            <Link className={secondaryButtonClass} href={verifyUrl} target="_blank">
              <QrCode className="h-4 w-4" /> Verify
            </Link>
          )}
          {certificate.status === "issued" && (
            <button className={secondaryButtonClass} disabled={Boolean(pending)} onClick={deliver}>
              <Mail className="h-4 w-4" />
              {pending === "deliver" ? "Sending…" : "Send"}
            </button>
          )}
          {certificate.status === "issued" && canIssue && (
            <button
              className="inline-flex h-9 items-center rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700"
              disabled={Boolean(pending)}
              onClick={revoke}
            >
              {pending === "revoke" ? "Revoking…" : "Revoke"}
            </button>
          )}
        </div>
      </div>
      {certificate.pdfSha256 && (
        <p className="mt-3 break-all font-mono text-[9px] text-slate-400">
          SHA-256 {certificate.pdfSha256}
        </p>
      )}
      {certificate.deliveryError && (
        <p className="mt-3 flex items-center gap-2 text-xs text-rose-700">
          <ShieldAlert className="h-4 w-4" />
          {certificate.deliveryError}
        </p>
      )}
      {error && <p className="mt-3 text-xs font-semibold text-rose-700">{error}</p>}
    </article>
  );
}
