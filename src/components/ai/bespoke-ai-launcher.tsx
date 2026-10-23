"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { BESPOKE_AI_OPEN_HREF, WHATSAPP_INQUIRY_MESSAGE, WHATSAPP_NUMBER } from "@/lib/constants";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { useMediaQuery } from "@/hooks";
import { BespokeAIIcon } from "./bespoke-ai-icon";

// The chat panel (AI SDK, streaming, markdown) is loaded only when a visitor
// opens it, so it is not part of every page's JavaScript. Hovering or focusing
// the launcher starts the download early.
const loadPanel = () => import("./bespoke-ai-panel");
const BespokeAIPanel = dynamic(() => loadPanel().then((module) => module.BespokeAIPanel), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center text-sm text-ktf-gray-500" role="status">
      Loading Bespoke AI…
    </div>
  ),
});

const DEFAULT_WIDTH = 420;
const MIN_WIDTH = 360;
const MAX_WIDTH = 560;
/** Downward drag (px) that closes the mobile sheet. */
const SHEET_CLOSE_DISTANCE = 110;
const SHEET_CLOSE_MS = 220;
const SESSION_KEY = "bespoke-ai-panel-state";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Ask Bespoke AI.
 *
 * Desktop: a full-height panel on the right, like a browser side panel — the
 * page narrows to make room, and the left edge can be dragged to resize.
 * Mobile: a bottom sheet covering most of the screen; drag the handle or the
 * header down, tap the backdrop, press Escape or use the close button.
 *
 * Any link to BESPOKE_AI_OPEN_HREF opens the panel in place, and a page loaded
 * with ?ask=ai (including the retired /bespoke-ai URL) opens with it showing.
 */
export function BespokeAILauncher() {
  const pathname = usePathname();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const surfaceRef = useRef<HTMLElement>(null);
  const restored = useRef(false);
  const shouldHideWhatsapp = pathname === "/contact";
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_INQUIRY_MESSAGE)}`;

  // The desktop panel stays open across page navigations within the session.
  useEffect(() => {
    const url = new URL(window.location.href);
    const askedFor = url.searchParams.get("ask") === "ai";
    if (askedFor) {
      url.searchParams.delete("ask");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
      setOpen(true);
    }
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) ?? "{}") as { open?: boolean; width?: number };
      if (typeof saved.width === "number") setWidth(clamp(saved.width, MIN_WIDTH, MAX_WIDTH));
      if (saved.open === true && window.matchMedia("(min-width: 1024px)").matches) setOpen(true);
    } catch {
      window.sessionStorage.removeItem(SESSION_KEY);
    } finally {
      restored.current = true;
    }
  }, []);

  // "Ask Bespoke AI" links anywhere on the page open the panel instead of
  // navigating. Captured before Next.js handles the click; modified clicks
  // (new tab, new window) keep their normal behaviour.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest(`a[href="${BESPOKE_AI_OPEN_HREF}"]`)) return;
      event.preventDefault();
      void loadPanel();
      setOpen(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ open: open && isDesktop, width }));
    } catch {
      // Storage unavailable (private mode); the panel simply won't persist.
    }
  }, [open, isDesktop, width]);

  const finishClose = useCallback(() => {
    setOpen(false);
    setClosing(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  const closePanel = useCallback(() => {
    if (isDesktop) return finishClose();
    // Let the sheet slide down before it unmounts.
    setClosing(true);
    window.setTimeout(finishClose, SHEET_CLOSE_MS);
  }, [finishClose, isDesktop]);

  // Desktop: the page makes room for the panel. Mobile: the page behind the sheet stops scrolling.
  useEffect(() => {
    if (!open) return;
    const { body, documentElement } = document;
    body.classList.add("bespoke-ai-dock-open");
    if (isDesktop) {
      body.classList.add("bespoke-ai-side-panel-open");
      documentElement.style.setProperty("--bespoke-ai-side-panel-width", `${width}px`);
    } else {
      body.style.overflow = "hidden";
    }
    return () => {
      body.classList.remove("bespoke-ai-dock-open", "bespoke-ai-side-panel-open");
      documentElement.style.removeProperty("--bespoke-ai-side-panel-width");
      body.style.overflow = "";
    };
  }, [isDesktop, open, width]);

  // Escape closes; focus moves to the close button once the lazy panel renders.
  useEffect(() => {
    if (!open) return;
    const surface = surfaceRef.current;
    const focusClose = () => {
      const close = surface?.querySelector<HTMLButtonElement>("[data-bespoke-ai-close]");
      close?.focus();
      return Boolean(close);
    };
    const observer = new MutationObserver(() => {
      if (focusClose()) observer.disconnect();
    });
    if (surface && !focusClose()) observer.observe(surface, { childList: true, subtree: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Escape closes the history list first when it is open.
      if (surface?.querySelector("[data-bespoke-ai-history-drawer]")) return;
      closePanel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closePanel, open]);

  const beginResize = (event: React.PointerEvent) => {
    const startX = event.clientX;
    const startWidth = width;
    event.preventDefault();
    const onMove = (moveEvent: PointerEvent) => {
      setWidth(clamp(startWidth + (startX - moveEvent.clientX), MIN_WIDTH, Math.min(MAX_WIDTH, window.innerWidth - 320)));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
    };
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // Mobile sheet: drag down from the handle or the header to dismiss.
  const beginSheetDrag = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (isDesktop) return;
      if ((event.target as HTMLElement).closest("button, a, input, textarea, select")) return;
      const sheet = surfaceRef.current;
      if (!sheet) return;
      const startY = event.clientY;
      const startTime = performance.now();
      let distance = 0;
      sheet.style.transition = "none";
      const onMove = (moveEvent: PointerEvent) => {
        distance = Math.max(0, moveEvent.clientY - startY);
        sheet.style.transform = `translateY(${distance}px)`;
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        const velocity = distance / Math.max(1, performance.now() - startTime);
        sheet.style.transition = "";
        if (distance > SHEET_CLOSE_DISTANCE || (distance > 24 && velocity > 0.6)) {
          sheet.style.transform = "translateY(100%)";
          window.setTimeout(finishClose, SHEET_CLOSE_MS);
        } else {
          sheet.style.transform = "";
        }
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [finishClose, isDesktop],
  );

  return (
    <>
      {!open ? (
        <div
          data-bespoke-contact-dock="true"
          className="fixed bottom-5 right-5 z-[250] flex items-center gap-1.5 rounded-full border border-ktf-gray-200 bg-white/95 p-1.5 shadow-[0_10px_30px_-12px_rgba(11,31,58,0.35)] backdrop-blur-xl"
        >
          <button
            ref={launcherRef}
            type="button"
            onClick={() => setOpen(true)}
            onPointerEnter={() => void loadPanel()}
            onFocus={() => void loadPanel()}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-ktf-obsidian px-3.5 text-sm font-medium text-white transition-colors hover:bg-ktf-charcoal sm:px-4"
            aria-label="Ask Bespoke AI"
            aria-haspopup="dialog"
          >
            <BespokeAIIcon inverse className="h-5 w-5 text-white" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>

          {!shouldHideWhatsapp ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25d366] text-white transition-transform hover:scale-[1.03] focus-visible:outline-[#25d366]"
              aria-label="Chat with Bespoke Technologies on WhatsApp"
            >
              <WhatsAppIcon className="h-5 w-5" />
            </a>
          ) : null}
        </div>
      ) : null}

      {open && isDesktop ? (
        <aside
          ref={surfaceRef}
          style={{ width }}
          className="ktf-panel-in fixed inset-y-0 right-0 z-300 flex flex-col border-l border-ktf-gray-200 bg-white"
          aria-label="Bespoke AI"
        >
          <BespokeAIPanel mode="panel" onClose={closePanel} />
          <div
            role="separator"
            aria-label="Resize Bespoke AI panel"
            aria-orientation="vertical"
            onPointerDown={beginResize}
            className="absolute inset-y-0 -left-1 z-20 w-2 cursor-ew-resize touch-none transition-colors hover:bg-ktf-blue/15"
          />
        </aside>
      ) : null}

      {open && !isDesktop ? (
        <>
          <div
            aria-hidden="true"
            onClick={closePanel}
            className={`fixed inset-0 z-[390] bg-ktf-obsidian/45 transition-opacity duration-200 ${closing ? "opacity-0" : "ktf-fade-in"}`}
          />
          <section
            ref={surfaceRef}
            role="dialog"
            aria-modal="true"
            aria-label="Bespoke AI"
            className={`fixed inset-x-0 bottom-0 z-[400] flex h-[92dvh] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-12px_40px_-12px_rgba(11,31,58,0.35)] transition-transform duration-200 ease-out ${closing ? "translate-y-full" : "ktf-sheet-in"}`}
          >
            <div onPointerDown={beginSheetDrag} className="flex shrink-0 cursor-grab touch-none justify-center pb-1 pt-2.5 active:cursor-grabbing">
              <span aria-hidden="true" className="h-1.5 w-10 rounded-full bg-ktf-gray-300" />
            </div>
            <BespokeAIPanel mode="sheet" onClose={closePanel} onHeaderPointerDown={beginSheetDrag} />
          </section>
        </>
      ) : null}
    </>
  );
}
