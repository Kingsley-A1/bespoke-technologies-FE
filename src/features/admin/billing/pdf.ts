import "server-only";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { calculateDocumentTotals, calculateLine, formatAdminDate, formatMoney } from "./money";
import type { BillingDocument, Payment } from "../types";

const A4 = { width: 595.28, height: 841.89 };
const blue = rgb(0.039, 0.518, 1);
const dark = rgb(0.063, 0.094, 0.157);
const grey = rgb(0.4, 0.455, 0.522);
const light = rgb(0.91, 0.933, 0.965);
const paleBlue = rgb(0.957, 0.976, 1);

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length > 0 ? lines : [""];
}

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
  const label = document.type === "standard" ? "Invoice" : document.type === "proforma" ? "Proforma invoice" : "Recurring invoice";
  drawRight(page, document.type === "proforma" ? "FOR APPROVAL" : "BILLING DOCUMENT", A4.width - 46, 778, bold, 7, blue);
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
    page.drawText("SERVICE DESCRIPTION", { x: 55, y: y + 9, font: bold, size: 6.2, color: blue });
    page.drawText("QTY", { x: 338, y: y + 9, font: bold, size: 6.2, color: blue });
    drawRight(page, "RATE", 430, y + 9, bold, 6.2, blue);
    drawRight(page, "AMOUNT", A4.width - 55, y + 9, bold, 6.2, blue);
    y -= 4;
  };
  drawTableHeader();

  for (const item of document.items) {
    const description = wrapText(item.description, regular, 6.7, 255).slice(0, 3);
    const rowHeight = Math.max(43, 29 + description.length * 9);
    if (y - rowHeight < 205) {
      footer(page, regular, bold, document, pageNumber);
      page = pdf.addPage([A4.width, A4.height]);
      pageNumber += 1;
      header(page, regular, bold, document, logo);
      y = 650;
      drawTableHeader();
    }
    const top = y - 15;
    page.drawText(item.name, { x: 55, y: top, font: bold, size: 8, color: dark });
    description.forEach((line, index) => page.drawText(line, { x: 55, y: top - 13 - index * 9, font: regular, size: 6.7, color: grey }));
    page.drawText(String(item.quantity), { x: 341, y: top, font: regular, size: 7.5, color: grey });
    drawRight(page, formatMoney(item.rate, document.currency), 430, top, regular, 7.5, grey);
    drawRight(page, formatMoney(calculateLine(item).total, document.currency), A4.width - 55, top, bold, 7.5, dark);
    page.drawLine({ start: { x: 46, y: y - rowHeight }, end: { x: A4.width - 46, y: y - rowHeight }, color: light, thickness: 0.7 });
    y -= rowHeight;
  }

  const totals = calculateDocumentTotals(document, payments);
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
  page.drawText(document.type === "proforma" ? "PROPOSED TOTAL" : "BALANCE DUE", { x: totalsX, y: y + 10, font: bold, size: 6, color: rgb(0.78, 0.87, 1) });
  drawRight(page, formatMoney(totals.balance, document.currency), totalsRight - 10, y - 7, bold, 13, rgb(1, 1, 1));

  let noteY = y + 6;
  for (const [label, value] of [["PAYMENT INSTRUCTIONS", document.paymentInstructions], ["NOTES", document.notes], ["TERMS", document.terms]] as const) {
    if (!value) continue;
    page.drawText(label, { x: 46, y: noteY, font: bold, size: 6.5, color: grey });
    noteY -= 14;
    for (const line of wrapText(value, regular, 7, 290).slice(0, 4)) {
      page.drawText(line, { x: 46, y: noteY, font: regular, size: 7, color: grey });
      noteY -= 10;
    }
    noteY -= 8;
  }

  footer(page, regular, bold, document, pageNumber);
  pdf.setTitle(`${document.documentNumber} — ${document.client.name}`);
  pdf.setAuthor(document.company.name);
  pdf.setCreator("Bespoke Technologies Admin System");
  pdf.setSubject(`${document.type} issued to ${document.client.name}`);
  return pdf.save();
}
