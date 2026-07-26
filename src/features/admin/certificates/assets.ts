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

function arrayBuffer(buffer: Uint8Array) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

async function readProjectLogo(certificate: OwnershipCertificate) {
  if (certificate.project.projectLogoKey) {
    const stored = await getR2ObjectBytes(certificate.project.projectLogoKey);
    if (!stored) throw new Error("The stored project logo could not be read.");
    return {
      bytes: stored.bytes,
      mime: stored.contentType || certificate.project.projectLogoMime || "",
    };
  }

  const logoUrl = certificate.project.projectLogoUrl;
  if (!logoUrl?.startsWith("/") || logoUrl.includes("..") || !/\.(png|jpe?g)$/i.test(logoUrl)) {
    throw new Error("The project logo is required before issuing a certificate.");
  }
  const publicRoot = path.resolve(process.cwd(), "public");
  const logoPath = path.resolve(publicRoot, `.${logoUrl}`);
  if (!logoPath.startsWith(`${publicRoot}${path.sep}`)) {
    throw new Error("The project logo path is invalid.");
  }
  return {
    bytes: await readFile(logoPath),
    mime: /\.jpe?g$/i.test(logoPath) ? "image/jpeg" : "image/png",
  };
}

export async function loadCertificatePdfAssets(certificate: OwnershipCertificate, verificationUrl: string) {
  const [brandLogo, regularFont, boldFont, signature, projectLogo, qrBuffer] = await Promise.all([
    readFile(path.join(process.cwd(), "public", "brand", "bespoke-technologies-logo.png")),
    readFile(path.join(process.cwd(), "public", "fonts", "DejaVuSans.ttf")),
    readFile(path.join(process.cwd(), "public", "fonts", "DejaVuSans-Bold.ttf")),
    readSignature(),
    readProjectLogo(certificate),
    QRCode.toBuffer(verificationUrl, { type: "png", width: 320, margin: 1, color: { dark: "#071321", light: "#ffffff" } }),
  ]);
  const projectMime = projectLogo.mime;
  if (!["image/png", "image/jpeg"].includes(projectMime)) throw new Error("Project logo must be PNG or JPEG.");
  return {
    brandLogo: arrayBuffer(brandLogo),
    projectLogo: arrayBuffer(projectLogo.bytes),
    projectLogoMime: projectMime,
    signature,
    qrCode: arrayBuffer(qrBuffer),
    regularFont: arrayBuffer(regularFont),
    boldFont: arrayBuffer(boldFont),
  };
}
