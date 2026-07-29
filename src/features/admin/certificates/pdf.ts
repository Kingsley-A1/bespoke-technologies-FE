import "server-only";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import type { OwnershipCertificate } from "../types";
import { formatAdminDate, formatMoney } from "../billing/money";
import { certificateOwnerKindLabel, projectTypeDisplayLabel } from "../documents/display";
import { formatCertificateToken } from "./security";

const PAGE = { width: 841.89, height: 595.28 };
const NAVY = rgb(0.025, 0.071, 0.13);
const BLUE = rgb(0.039, 0.518, 1);
const BLUE_DEEP = rgb(0.005, 0.255, 0.66);
const INK = rgb(0.06, 0.09, 0.15);
const MUTED = rgb(0.34, 0.4, 0.48);
const HAIRLINE = rgb(0.82, 0.87, 0.93);
const PALE = rgb(0.95, 0.975, 1);

export interface CertificatePdfAssets {
  brandLogo: ArrayBuffer;
  projectLogo: ArrayBuffer;
  projectLogoMime: string;
  signature?: ArrayBuffer;
  qrCode: ArrayBuffer;
  regularFont: ArrayBuffer;
  boldFont: ArrayBuffer;
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) current = next;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawRight(page: PDFPage, text: string, right: number, y: number, font: PDFFont, size: number, color = INK) {
  page.drawText(text, { x: right - font.widthOfTextAtSize(text, size), y, font, size, color });
}

async function embedImage(pdf: PDFDocument, bytes: ArrayBuffer, mime: string): Promise<PDFImage> {
  return mime === "image/jpeg" ? pdf.embedJpg(bytes) : pdf.embedPng(bytes);
}

function valueLabel(certificate: OwnershipCertificate) {
  const value = certificate.commercial;
  if (value.valueLabel?.trim()) return value.valueLabel.trim();
  if (value.mode === "free") return "Provided free of charge";
  if (value.mode === "undisclosed") return "Commercial value undisclosed";
  if (value.mode === "donation" && !value.amount) return "Donated project";
  if (value.amount !== undefined && value.currency) {
    const formatted = formatMoney(value.amount, value.currency);
    return value.mode === "donation" ? `Donation value ${formatted}` : formatted;
  }
  return value.mode === "donation" ? "Donated project" : "Commercial value recorded";
}

function drawSecurityPattern(page: PDFPage) {
  for (let x = 18; x < PAGE.width; x += 24) {
    page.drawLine({ start: { x, y: 18 }, end: { x, y: PAGE.height - 18 }, color: rgb(0.9, 0.95, 1), thickness: 0.22 });
  }
  for (let y = 18; y < PAGE.height; y += 24) {
    page.drawLine({ start: { x: 18, y }, end: { x: PAGE.width - 18, y }, color: rgb(0.9, 0.95, 1), thickness: 0.22 });
  }
  page.drawCircle({ x: PAGE.width - 72, y: PAGE.height - 68, size: 118, borderColor: rgb(0.75, 0.87, 1), borderWidth: 1 });
  page.drawCircle({ x: PAGE.width - 72, y: PAGE.height - 68, size: 82, borderColor: rgb(0.82, 0.91, 1), borderWidth: 0.7 });
}

export async function generateOwnershipCertificatePdf(
  certificate: OwnershipCertificate,
  assets: CertificatePdfAssets,
) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(assets.regularFont, { subset: true });
  const bold = await pdf.embedFont(assets.boldFont, { subset: true });
  const brandLogo = await pdf.embedPng(assets.brandLogo);
  const projectLogo = await embedImage(pdf, assets.projectLogo, assets.projectLogoMime);
  const qr = await pdf.embedPng(assets.qrCode);
  const signature = assets.signature ? await pdf.embedPng(assets.signature) : undefined;
  const page = pdf.addPage([PAGE.width, PAGE.height]);

  page.drawRectangle({ x: 0, y: 0, width: PAGE.width, height: PAGE.height, color: rgb(1, 1, 1) });
  drawSecurityPattern(page);
  page.drawRectangle({ x: 0, y: 0, width: 20, height: PAGE.height, color: NAVY });
  page.drawRectangle({ x: 20, y: 0, width: 5, height: PAGE.height, color: BLUE });
  page.drawRectangle({ x: 39, y: 38, width: PAGE.width - 77, height: PAGE.height - 76, borderColor: BLUE_DEEP, borderWidth: 1.2 });
  page.drawRectangle({ x: 46, y: 45, width: PAGE.width - 91, height: PAGE.height - 90, borderColor: HAIRLINE, borderWidth: 0.5 });

  const brandScale = brandLogo.scale(0.19);
  page.drawImage(brandLogo, { x: 62, y: 497, width: brandScale.width, height: brandScale.height });
  drawRight(page, "CERTIFICATE OF PROJECT OWNERSHIP", PAGE.width - 62, 527, bold, 8.5, BLUE_DEEP);
  drawRight(page, certificate.certificateNumber, PAGE.width - 62, 507, bold, 9.5, INK);

  page.drawText("THIS CERTIFIES THE COMPLETION AND DELIVERY OF", { x: 62, y: 459, font: bold, size: 7.2, color: MUTED });
  const titleLines = wrap(certificate.project.name, bold, 28, 500).slice(0, 2);
  titleLines.forEach((line, index) => page.drawText(line, { x: 62, y: 422 - index * 31, font: bold, size: 28, color: NAVY }));
  const titleBottom = 422 - (titleLines.length - 1) * 31;

  const logoBox = { x: 650, y: 355, width: 112, height: 112 };
  page.drawRectangle({ ...logoBox, color: rgb(1, 1, 1), borderColor: HAIRLINE, borderWidth: 0.8 });
  const logoScale = Math.min((logoBox.width - 22) / projectLogo.width, (logoBox.height - 22) / projectLogo.height);
  page.drawImage(projectLogo, {
    x: logoBox.x + (logoBox.width - projectLogo.width * logoScale) / 2,
    y: logoBox.y + (logoBox.height - projectLogo.height * logoScale) / 2,
    width: projectLogo.width * logoScale,
    height: projectLogo.height * logoScale,
  });

  page.drawText("OWNED BY", { x: 62, y: titleBottom - 38, font: bold, size: 7, color: BLUE_DEEP });
  page.drawText(certificate.owner.name, { x: 62, y: titleBottom - 62, font: bold, size: 16, color: INK });
  page.drawText(certificateOwnerKindLabel(certificate.owner.kind), { x: 62, y: titleBottom - 78, font: regular, size: 7, color: MUTED });

  const descriptionY = titleBottom - 116;
  wrap(certificate.project.description, regular, 8.5, 525).slice(0, 3).forEach((line, index) => {
    page.drawText(line, { x: 62, y: descriptionY - index * 13, font: regular, size: 8.5, color: MUTED });
  });

  const factsY = 190;
  page.drawRectangle({ x: 62, y: factsY, width: 700, height: 66, color: PALE });
  const facts = [
    ["PROJECT TYPE", projectTypeDisplayLabel(certificate.project.type)],
    ["STARTED", formatAdminDate(certificate.project.startDate)],
    ["COMPLETED", formatAdminDate(certificate.project.completionDate)],
    ["PROJECT VALUE", valueLabel(certificate)],
  ];
  facts.forEach(([label, value], index) => {
    const x = 78 + index * 171;
    if (index) page.drawLine({ start: { x: x - 16, y: factsY + 12 }, end: { x: x - 16, y: factsY + 54 }, color: HAIRLINE, thickness: 0.7 });
    page.drawText(label, { x, y: factsY + 43, font: bold, size: 6.3, color: BLUE_DEEP });
    wrap(value, bold, 8.2, 145).slice(0, 2).forEach((line, lineIndex) => page.drawText(line, { x, y: factsY + 23 - lineIndex * 10, font: bold, size: 8.2, color: INK }));
  });
  const valueNote = certificate.commercial.valueNote
    || (certificate.commercial.invoiceTotalIncludesTaxAndDiscounts ? "Displayed invoice total includes recorded tax and discounts." : "");
  if (valueNote) page.drawText(valueNote, { x: 62, y: 176, font: regular, size: 6.3, color: MUTED });

  wrap(certificate.ownershipStatement, regular, 6.8, 480).slice(0, 4).forEach((line, index) => {
    page.drawText(line, { x: 62, y: 142 - index * 9.5, font: regular, size: 6.8, color: MUTED });
  });

  if (signature) {
    const sigScale = Math.min(115 / signature.width, 42 / signature.height);
    page.drawImage(signature, { x: 522, y: 102, width: signature.width * sigScale, height: signature.height * sigScale });
  } else {
    page.drawLine({ start: { x: 522, y: 113 }, end: { x: 635, y: 113 }, color: HAIRLINE, thickness: 0.8 });
  }
  page.drawText(certificate.company.ceoName, { x: 522, y: 91, font: bold, size: 8.5, color: INK });
  page.drawText(certificate.company.ceoTitle, { x: 522, y: 78, font: regular, size: 6.7, color: MUTED });

  page.drawImage(qr, { x: 674, y: 76, width: 68, height: 68 });
  page.drawText("SCAN TO VERIFY", { x: 680, y: 64, font: bold, size: 5.5, color: BLUE_DEEP });
  if (certificate.verificationToken) {
    const verificationCode = formatCertificateToken(certificate.verificationToken);
    const codeSize = 3.5;
    const codeWidth = regular.widthOfTextAtSize(verificationCode, codeSize);
    page.drawText(verificationCode, {
      x: 708 - codeWidth / 2,
      y: 55,
      font: regular,
      size: codeSize,
      color: MUTED,
    });
  }
  page.drawText(`Issued ${formatAdminDate(certificate.issuedAt || new Date().toISOString())}`, { x: 62, y: 66, font: regular, size: 6.5, color: MUTED });
  page.drawText(`Business Name Registration Number ${certificate.company.registrationNumber}`, { x: 178, y: 66, font: regular, size: 6.5, color: MUTED });
  page.drawText(certificate.company.motto.toUpperCase(), { x: 62, y: 52, font: bold, size: 5.2, color: MUTED });

  pdf.setTitle(`${certificate.certificateNumber} — ${certificate.project.name}`);
  pdf.setAuthor(certificate.company.name);
  pdf.setCreator("Bespoke Technologies Ownership System");
  pdf.setSubject(`Project ownership certificate issued to ${certificate.owner.name}`);
  pdf.setKeywords(["ownership", "project delivery", certificate.certificateNumber]);
  pdf.setCreationDate(new Date(certificate.issuedAt || Date.now()));
  return pdf.save();
}
