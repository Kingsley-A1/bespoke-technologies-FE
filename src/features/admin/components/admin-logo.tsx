import Image from "next/image";
import Link from "next/link";

export function AdminLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/admin" className="flex items-center gap-3" aria-label="Bespoke Technologies Admin home">
      {compact ? (
        <Image src="/icons/bespoke-technologies-logo-main.png" alt="Bespoke Technologies" width={38} height={38} className="h-9 w-9 rounded-lg object-cover" priority />
      ) : (
        <span className="relative block h-12 w-[174px] overflow-hidden" aria-hidden="true">
          <Image src="/brand/bespoke-technologies-logo.png" alt="" width={260} height={112} className="absolute -left-[43px] -top-[29px] h-[112px] w-[260px] max-w-none" priority />
        </span>
      )}
    </Link>
  );
}
