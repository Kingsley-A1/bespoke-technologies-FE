import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import { getR2ObjectBytes } from "@/lib/storage/r2";
import type { OwnershipCertificate } from "../types";

async function readSignature() {
  const signaturePath = path.join(process.cwd(), "public", "ceo-signature.png");
  try {
    const bytes = await readFile(signaturePath);
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  } catch {
    console.warn("[ownership-certificate] public/ceo-signature.png is missing. The PDF will use an unsigned signature line until the transparent PNG is added.");
    return undefined;
  }
}

function arrayBuffer(buffer: Buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

export async function loadCertificatePdfAssets(certificate: OwnershipCertificate, verificationUrl: string) {
  if (!certificate.project.projectLogoKey) throw new Error("The project logo is required before issuing a certificate.");
  const [brandLogo, regularFont, boldFont, signature, projectLogo, qrBuffer] = await Promise.all([
    readFile(path.join(process.cwd(), "public", "brand", "bespoke-technologies-logo.png")),
    readFile(path.join(process.cwd(), "public", "fonts", "DejaVuSans.ttf")),
    readFile(path.join(process.cwd(), "public", "fonts", "DejaVuSans-Bold.ttf")),
    readSignature(),
    getR2ObjectBytes(certificate.project.projectLogoKey),
    QRCode.toBuffer(verificationUrl, { type: "png", width: 320, margin: 1, color: { dark: "#071321", light: "#ffffff" } }),
  ]);
  if (!projectLogo) throw new Error("The stored project logo could not be read.");
  const projectMime = projectLogo.contentType || certificate.project.projectLogoMime || "";
  if (!["image/png", "image/jpeg"].includes(projectMime)) throw new Error("Project logo must be PNG or JPEG.");
  return {
    brandLogo: arrayBuffer(brandLogo),
    projectLogo: projectLogo.bytes.buffer.slice(projectLogo.bytes.byteOffset, projectLogo.bytes.byteOffset + projectLogo.bytes.byteLength) as ArrayBuffer,
    projectLogoMime: projectMime,
    signature,
    qrCode: arrayBuffer(qrBuffer),
    regularFont: arrayBuffer(regularFont),
    boldFont: arrayBuffer(boldFont),
  };
}

