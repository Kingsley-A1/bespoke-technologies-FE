import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { VerificationFailure } from "../verification-ui";

export const metadata: Metadata = {
  title: "Verification Code Required",
  description: "A document ID must be paired with its verification code before authenticity can be confirmed.",
  robots: { index: false, follow: false },
};

export default async function VerificationCodeRequiredPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  return (
    <VerificationFailure
      title="Verification code required"
      description="A readable document ID is only a filing reference and is not proof of authenticity. Scan the certificate QR code or enter the unique verification code printed beneath it."
      documentId={documentId}
      Icon={KeyRound}
      accentClassName="from-blue-700 via-cyan-500 to-blue-300"
      iconClassName="bg-blue-50 text-blue-700 ring-1 ring-blue-100"
    />
  );
}
