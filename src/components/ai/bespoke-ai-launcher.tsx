"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, GripVertical, X } from "lucide-react";
import { BespokeAIPanel } from "./bespoke-ai-panel";

const MIN_WIDTH = 380;
const MAX_WIDTH = 560;

export function BespokeAILauncher() {
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(420);
  const [resizing, setResizing] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const closePanel = () => {
    setOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

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

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-300 hidden min-h-12 items-center gap-2 rounded-lg bg-ktf-obsidian px-4 text-sm font-semibold text-white shadow-xl transition-colors hover:bg-ktf-blue lg:inline-flex"
        aria-label="Open Bespoke AI"
      >
        <Bot className="h-4 w-4" aria-hidden="true" />
        Bespoke AI
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
            <button
              ref={closeButtonRef}
              type="button"
              className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-md text-ktf-gray-600 hover:bg-ktf-surface hover:text-ktf-obsidian"
              aria-label="Close Bespoke AI"
              onClick={closePanel}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <BespokeAIPanel mode="panel" />
          </aside>
        </div>
      ) : null}
    </>
  );
}
