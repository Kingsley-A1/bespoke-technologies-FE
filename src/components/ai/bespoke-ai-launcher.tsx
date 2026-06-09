"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
import { BespokeAIIcon } from "./bespoke-ai-icon";
import { BespokeAIPanel } from "./bespoke-ai-panel";

const MIN_WIDTH = 380;
const MAX_WIDTH = 560;

export function BespokeAILauncher() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(420);
  const [resizing, setResizing] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const shouldHide = pathname === "/bespoke-ai";

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

    panelRef.current
      ?.querySelector<HTMLButtonElement>("[data-bespoke-ai-close]")
      ?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!resizing) return;

    const onPointerMove = (event: PointerEvent) => {
      const nextWidth = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, window.innerWidth - event.clientX),
      );
      setWidth(nextWidth);
    };

    const stopResizing = () => setResizing(false);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopResizing);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopResizing);
    };
  }, [resizing]);

  if (shouldHide) return null;

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={handleOpen}
        className="group fixed bottom-24 right-6 z-[250] flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-ktf-navy text-white shadow-2xl transition-colors hover:bg-ktf-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
        aria-label="Ask Bespoke AI"
      >
        <BespokeAIIcon inverse className="h-7 w-7 text-white" />
        <span className="pointer-events-none absolute right-16 hidden whitespace-nowrap rounded-lg bg-ktf-obsidian px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 lg:block">
          Ask Bespoke AI
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-300 hidden lg:block" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-ktf-obsidian/25"
            aria-label="Close Bespoke AI overlay"
            onClick={closePanel}
          />
          <aside
            ref={panelRef}
            className="absolute inset-y-0 right-0 flex max-w-[calc(100vw-2rem)] flex-col border-l border-ktf-gray-200 bg-white shadow-2xl"
            style={{ width }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bespoke-ai-panel-title"
          >
            <button
              type="button"
              className="absolute left-0 top-1/2 z-10 flex h-16 w-7 -translate-x-full -translate-y-1/2 items-center justify-center rounded-l-lg border border-r-0 border-ktf-gray-200 bg-white text-ktf-gray-500 hover:text-ktf-blue"
              aria-label="Resize Bespoke AI panel"
              onPointerDown={(event) => {
                event.preventDefault();
                setResizing(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") {
                  setWidth((current) => Math.min(MAX_WIDTH, current + 20));
                }
                if (event.key === "ArrowRight") {
                  setWidth((current) => Math.max(MIN_WIDTH, current - 20));
                }
              }}
            >
              <GripVertical className="h-4 w-4" aria-hidden="true" />
            </button>
            <BespokeAIPanel mode="panel" onClose={closePanel} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
