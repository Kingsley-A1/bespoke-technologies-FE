import { LEARN_ORIGIN } from "@/lib/subdomain-seo";

export function learnCanonicalUrl(pathname: string) {
  const path = pathname === "/" ? "/" : `/${pathname.replace(/^\/+/, "")}`;
  return new URL(path, LEARN_ORIGIN).toString();
}
