import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Container } from "@/components/layout/container";

export default function OfflinePage() {
  return <section className="flex min-h-[65vh] items-center py-20"><Container size="sm"><div className="rounded-lg border border-ktf-gray-200 bg-white p-8 text-center shadow-card"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-ktf-blue/10 text-ktf-blue"><WifiOff className="h-5 w-5" /></span><h1 className="mt-5 text-2xl font-bold text-ktf-navy">You’re offline</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ktf-gray-600">Previously visited public pages may still be available. Reconnect to send enquiries or load current project information.</p><Link href="/" className="mt-6 inline-flex h-10 items-center rounded-lg bg-ktf-blue px-5 text-sm font-semibold text-white">Try the homepage</Link></div></Container></section>;
}
