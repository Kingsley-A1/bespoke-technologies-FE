import Image from "next/image";
import Link from "next/link";

/**
 * The Bespoke Technologies logo for Admin surfaces. Pass href={null} when the
 * logo sits inside another link, so anchors are never nested.
 */
export function AdminLogo({ compact = false, href = "/admin" }: { compact?: boolean; href?: string | null }) {
  const mark = compact ? (
    <Image src="/icons/bespoke-technologies-logo-main.png" alt="Bespoke Technologies" width={38} height={38} className="h-9 w-9 rounded-lg object-cover" priority />
  ) : (
    <span className="relative block h-12 w-[174px] overflow-hidden" aria-hidden="true">
      <Image src="/brand/bespoke-technologies-logo.png" alt="" width={260} height={112} className="absolute -left-[43px] -top-[29px] h-[112px] w-[260px] max-w-none" priority />
    </span>
  );
  if (href === null) {
    return (
      <span className="flex items-center gap-3">
        {mark}
        {compact ? null : <span className="sr-only">Bespoke Technologies</span>}
      </span>
    );
  }
  return (
    <Link href={href} className="flex items-center gap-3" aria-label={href === "/admin" ? "Bespoke Technologies Admin home" : "Bespoke Technologies"}>
      {mark}
    </Link>
  );
}
