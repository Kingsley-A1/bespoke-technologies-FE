"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { WHATSAPP_INQUIRY_MESSAGE, WHATSAPP_NUMBER } from "@/lib/constants";
import { BespokeAIIcon } from "./bespoke-ai-icon";
import { BespokeAIPanel } from "./bespoke-ai-panel";

export function BespokeAILauncher() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const previousPathnameRef = useRef(pathname);
  const shouldHideAI = pathname === "/bespoke-ai";
  const shouldHideWhatsapp = pathname === "/contact";
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    WHATSAPP_INQUIRY_MESSAGE,
  )}`;

  const closePanel = () => {
    setOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  };

  const handleOpen = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setOpen(true);
      return;
    }

    router.push("/bespoke-ai");
  };

  useEffect(() => {
    if (!open) return;

    document.body.classList.add("bespoke-ai-dock-open");
    return () => document.body.classList.remove("bespoke-ai-dock-open");
  }, [open]);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;

    previousPathnameRef.current = pathname;
    requestAnimationFrame(() => setOpen(false));
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    panelRef.current
      ?.querySelector<HTMLButtonElement>("[data-bespoke-ai-close]")
      ?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (shouldHideAI && shouldHideWhatsapp) return null;

  return (
    <>
      {!open ? (
        <div
          data-bespoke-contact-dock="true"
          className="fixed bottom-6 right-6 z-[250] flex items-center gap-1.5 rounded-full border border-ktf-gray-200 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl transition-all duration-200"
        >
          {!shouldHideAI ? (
            <button
              ref={launcherRef}
              type="button"
              onClick={handleOpen}
              className="group flex h-11 items-center justify-center gap-2 rounded-full bg-ktf-navy px-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ktf-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue sm:px-4"
              aria-label="Ask Bespoke AI for a build recommendation"
            >
              <BespokeAIIcon inverse className="h-5 w-5 text-white" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          ) : null}

          {!shouldHideWhatsapp ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25d366] text-white shadow-sm transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25d366]"
              aria-label="Chat with Bespoke Technologies on WhatsApp"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      ) : null}

      {open ? (
        <aside
          ref={panelRef}
          className="fixed inset-y-0 right-0 z-300 hidden w-[min(43rem,42vw)] min-w-[410px] flex-col border-l border-ktf-gray-200 bg-white shadow-2xl lg:flex"
          aria-label="Bespoke AI side panel"
        >
          <BespokeAIPanel mode="panel" onClose={closePanel} />
        </aside>
      ) : null}
    </>
  );
}
