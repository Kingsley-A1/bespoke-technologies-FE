import "server-only";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { calculateDocumentTotals, calculateLine, calculateProgressSummary, formatAdminDate, formatMoney } from "./money";
import { progressFigures, progressHeading, progressStatement, termsForBalance } from "./document-copy";
import { billingDocumentTitle, billingDocumentTypeLabel } from "./document-types";
import { clampLines, wrapText } from "./text-layout";
import type { BillingDocument, Payment } from "../types";

const A4 = { width: 595.28, height: 841.89 };
const ITEM_TEXT_X = 55;
const ITEM_TEXT_RIGHT = A4.width - 55;
const ITEM_QTY_X = 341;
const ITEM_RATE_RIGHT = 430;
const NAME_SIZE = 8;
const NAME_LEADING = 11;
const NAME_WIDTH = ITEM_QTY_X - ITEM_TEXT_X - 12;
const DESCRIPTION_SIZE = 7;
const DESCRIPTION_LEADING = 9.6;
const DESCRIPTION_WIDTH = ITEM_TEXT_RIGHT - ITEM_TEXT_X;
const NOTE_SIZE = 7;
const NOTE_LEADING = 10;
const NOTE_LABEL_HEIGHT = 14;
const NOTE_WIDTH = 315;
const NOTE_FLOOR = 78;
/** Fits inside a fresh page even at the smallest usable body size. */
const MAX_DESCRIPTION_LINES = 40;
const BAND_TEXT_X = 58;
const BAND_WIDTH = A4.width - 92 - 24;
const blue = rgb(0.039, 0.518, 1);
const dark = rgb(0.063, 0.094, 0.157);
const grey = rgb(0.4, 0.455, 0.522);
const light = rgb(0.91, 0.933, 0.965);
const paleBlue = rgb(0.957, 0.976, 1);

function drawRight(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, color = dark) {
  page.drawText(text, { x: x - font.widthOfTextAtSize(text, size), y, font, size, color });
}

function footer(page: PDFPage, regular: PDFFont, bold: PDFFont, document: BillingDocument, pageNumber: number) {
  page.drawLine({ start: { x: 46, y: 55 }, end: { x: A4.width - 46, y: 55 }, color: blue, thickness: 0.8 });
  page.drawText(document.company.motto.toUpperCase(), { x: 46, y: 35, font: bold, size: 5.6, color: grey });
  drawRight(page, `Page ${pageNumber}`, A4.width - 46, 35, regular, 7, grey);
}

function header(page: PDFPage, regular: PDFFont, bold: PDFFont, document: BillingDocument, logo: PDFImage) {
  page.drawRectangle({ x: 0, y: A4.height - 7, width: A4.width, height: 7, color: blue });
  const scaled = logo.scale(0.21);
  page.drawImage(logo, { x: 46, y: 716, width: scaled.width, height: scaled.height });
  const label = billingDocumentTitle(document.type, document.customTypeLabel);
  drawRight(page, document.type === "proforma" ? "FOR APPROVAL" : "BILLING INVOICE", A4.width - 46, 778, bold, 7, blue);
  drawRight(page, label, A4.width - 46, 748, bold, 22, dark);
  drawRight(page, document.documentNumber, A4.width - 46, 720, bold, 8.5, dark);
  drawRight(page, `Issued ${formatAdminDate(document.issueDate)}`, A4.width - 46, 704, regular, 7.5, grey);
  drawRight(page, `Due ${formatAdminDate(document.dueDate)}`, A4.width - 46, 690, regular, 7.5, grey);
  page.drawLine({ start: { x: 46, y: 675 }, end: { x: A4.width - 46, y: 675 }, color: light, thickness: 1 });
}

export async function generateBillingPdf(
  document: BillingDocument,
  payments: Payment[],
  assets: { logo: ArrayBuffer; regularFont: ArrayBuffer; boldFont: ArrayBuffer },
) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(assets.regularFont, { subset: true });
  const bold = await pdf.embedFont(assets.boldFont, { subset: true });
  const logo = await pdf.embedPng(assets.logo);
  let pageNumber = 1;
  let page = pdf.addPage([A4.width, A4.height]);
  header(page, regular, bold, document, logo);

  page.drawText("FROM", { x: 46, y: 648, font: bold, size: 6.5, color: grey });
  page.drawText(document.company.name, { x: 46, y: 628, font: bold, size: 11, color: dark });
  page.drawText(document.company.email, { x: 46, y: 612, font: regular, size: 7.5, color: grey });
  page.drawText(`${document.company.phone}  |  ${document.company.website}`, { x: 46, y: 599, font: regular, size: 7.5, color: grey });
  page.drawText(`Business Name Registration Number ${document.company.registrationNumber}`, { x: 46, y: 586, font: regular, size: 7, color: grey });

  page.drawText("BILL TO", { x: 330, y: 648, font: bold, size: 6.5, color: grey });
  page.drawText(document.client.name || "Client name", { x: 330, y: 628, font: bold, size: 11, color: dark });
  let clientY = 612;
  for (const value of [document.client.contactName, document.client.email, document.client.phone, document.client.address]) {
    if (!value) continue;
    for (const line of wrapText(value, regular, 7.5, 215).slice(0, 2)) {
      page.drawText(line, { x: 330, y: clientY, font: regular, size: 7.5, color: grey });
      clientY -= 12;
    }
  }

  let y = 548;
  const drawTableHeader = () => {
    page.drawRectangle({ x: 46, y, width: A4.width - 92, height: 25, color: paleBlue });
    page.drawLine({ start: { x: 46, y: y + 25 }, end: { x: A4.width - 46, y: y + 25 }, color: blue, thickness: 0.7 });
    page.drawLine({ start: { x: 46, y }, end: { x: A4.width - 46, y }, color: blue, thickness: 0.7 });
    page.drawText("SERVICE", { x: ITEM_TEXT_X, y: y + 9, font: bold, size: 6.2, color: blue });
    page.drawText("QTY", { x: ITEM_QTY_X - 3, y: y + 9, font: bold, size: 6.2, color: blue });
    drawRight(page, "RATE", ITEM_RATE_RIGHT, y + 9, bold, 6.2, blue);
    drawRight(page, "AMOUNT", ITEM_TEXT_RIGHT, y + 9, bold, 6.2, blue);
    y -= 4;
  };
  drawTableHeader();

  for (const item of document.items) {
    const nameLines = wrapText(item.name, bold, NAME_SIZE, NAME_WIDTH).slice(0, 2);
    const description = item.description?.trim()
      ? clampLines(wrapText(item.description, regular, DESCRIPTION_SIZE, DESCRIPTION_WIDTH), MAX_DESCRIPTION_LINES)
      : [];
    const rowHeight =
      15 +
      nameLines.length * NAME_LEADING +
      (description.length ? 2 + description.length * DESCRIPTION_LEADING : 0) +
      4;
    if (y - rowHeight < 205) {
      footer(page, regular, bold, document, pageNumber);
      page = pdf.addPage([A4.width, A4.height]);
      pageNumber += 1;
      header(page, regular, bold, document, logo);
      y = 650;
      drawTableHeader();
    }
    const top = y - 15;
    page.drawText(String(item.quantity), { x: ITEM_QTY_X, y: top, font: regular, size: 7.5, color: grey });
    drawRight(page, formatMoney(item.rate, document.currency), ITEM_RATE_RIGHT, top, regular, 7.5, grey);
    drawRight(page, formatMoney(calculateLine(item).total, document.currency), ITEM_TEXT_RIGHT, top, bold, 7.5, dark);
    let textY = top;
    for (const line of nameLines) {
      page.drawText(line, { x: ITEM_TEXT_X, y: textY, font: bold, size: NAME_SIZE, color: dark });
      textY -= NAME_LEADING;
    }
    if (description.length) {
      textY -= 2;
      for (const line of description) {
        page.drawText(line, { x: ITEM_TEXT_X, y: textY, font: regular, size: DESCRIPTION_SIZE, color: grey });
        textY -= DESCRIPTION_LEADING;
      }
    }
    page.drawLine({ start: { x: 46, y: y - rowHeight }, end: { x: A4.width - 46, y: y - rowHeight }, color: light, thickness: 0.7 });
    y -= rowHeight;
  }

  const totals = calculateDocumentTotals(document, payments);
  const effectiveTerms = termsForBalance(document.terms, totals.balance);

  const progress = calculateProgressSummary(document, totals);
  if (progress) {
    const statement = wrapText(progressStatement(progress, document.currency), regular, 7, BAND_WIDTH);
    const bandHeight = 64 + statement.length * 10;
    if (y - bandHeight - 14 < 250) {
      footer(page, regular, bold, document, pageNumber);
      page = pdf.addPage([A4.width, A4.height]);
      pageNumber += 1;
      header(page, regular, bold, document, logo);
      y = 640;
    }
    y -= 14;
    page.drawRectangle({ x: 46, y: y - bandHeight, width: A4.width - 92, height: bandHeight, color: paleBlue });
    page.drawText(progressHeading(document.type).toUpperCase(), { x: BAND_TEXT_X, y: y - 16, font: bold, size: 6.2, color: blue });
    const figures = progressFigures(progress, document.currency, document.type);
    const columnWidth = BAND_WIDTH / figures.length;
    figures.forEach((figure, index) => {
      const x = BAND_TEXT_X + index * columnWidth;
      page.drawText(figure.label.toUpperCase(), { x, y: y - 32, font: bold, size: 5.6, color: grey });
      page.drawText(figure.value, { x, y: y - 45, font: bold, size: 9.5, color: figure.emphasis ? blue : dark });
    });
    statement.forEach((line, index) =>
      page.drawText(line, { x: BAND_TEXT_X, y: y - 62 - index * 10, font: regular, size: 7, color: grey }),
    );
    y -= bandHeight + 8;
  }

  if (y < 270) {
    footer(page, regular, bold, document, pageNumber);
    page = pdf.addPage([A4.width, A4.height]);
    pageNumber += 1;
    header(page, regular, bold, document, logo);
    y = 640;
  }
  y -= 20;
  const totalsX = 390;
  const totalsRight = A4.width - 46;
  const rows: Array<[string, string, boolean]> = [
    ["Subtotal", formatMoney(totals.subtotal, document.currency), false],
    ...(totals.discount ? [["Discount", `- ${formatMoney(totals.discount, document.currency)}`, false] as [string, string, boolean]] : []),
    ...(totals.tax ? [["Tax", formatMoney(totals.tax, document.currency), false] as [string, string, boolean]] : []),
    ["Total", formatMoney(totals.total, document.currency), true],
    ...(totals.paid ? [["Amount paid", formatMoney(totals.paid, document.currency), false] as [string, string, boolean]] : []),
  ];
  for (const [label, value, strong] of rows) {
    page.drawText(label, { x: totalsX, y, font: strong ? bold : regular, size: 8, color: strong ? dark : grey });
    drawRight(page, value, totalsRight, y, strong ? bold : regular, 8, strong ? dark : grey);
    y -= 18;
  }
  page.drawRectangle({ x: totalsX - 10, y: y - 20, width: totalsRight - totalsX + 10, height: 46, color: blue });
  page.drawText(document.type === "proforma" ? "PROPOSED TOTAL" : totals.balance <= 0 ? "PROJECT VALUE" : "BALANCE DUE", { x: totalsX, y: y + 10, font: bold, size: 6, color: rgb(0.78, 0.87, 1) });
  const customValue = document.valueLabel?.trim();
  if (customValue) {
    wrapText(customValue, bold, 8.2, 125).slice(0, 2).forEach((line, index) => {
      drawRight(page, line, totalsRight - 10, y - 2 - index * 10, bold, 8.2, rgb(1, 1, 1));
    });
  } else {
    drawRight(page, formatMoney(totals.balance, document.currency), totalsRight - 10, y - 7, bold, 13, rgb(1, 1, 1));
  }

  let noteY = y + 6;
  const ensureNoteSpace = (needed: number) => {
    if (noteY - needed >= NOTE_FLOOR) return;
    footer(page, regular, bold, document, pageNumber);
    page = pdf.addPage([A4.width, A4.height]);
    pageNumber += 1;
    header(page, regular, bold, document, logo);
    noteY = 640;
  };
  for (const [label, value] of [["PAYMENT INSTRUCTIONS", document.paymentInstructions], ["NOTES", document.notes], ["TERMS", effectiveTerms]] as const) {
    if (!value?.trim()) continue;
    ensureNoteSpace(NOTE_LABEL_HEIGHT + NOTE_LEADING);
    page.drawText(label, { x: 46, y: noteY, font: bold, size: 6.5, color: grey });
    noteY -= NOTE_LABEL_HEIGHT;
    for (const line of wrapText(value, regular, NOTE_SIZE, NOTE_WIDTH)) {
      ensureNoteSpace(NOTE_LEADING);
      if (line) page.drawText(line, { x: 46, y: noteY, font: regular, size: NOTE_SIZE, color: grey });
      noteY -= NOTE_LEADING;
    }
    noteY -= 8;
  }

  footer(page, regular, bold, document, pageNumber);
  pdf.setTitle(`${document.documentNumber} — ${document.client.name}`);
  pdf.setAuthor(document.company.name);
  pdf.setCreator("Bespoke Technologies Admin System");
  pdf.setSubject(`${billingDocumentTypeLabel(document.type, document.customTypeLabel)} issued to ${document.client.name}`);
  return pdf.save();
}
