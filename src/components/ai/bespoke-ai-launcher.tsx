"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { WHATSAPP_INQUIRY_MESSAGE, WHATSAPP_NUMBER } from "@/lib/constants";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { cn } from "@/lib/utils";
import { BespokeAIIcon } from "./bespoke-ai-icon";
import { BespokeAIPanel } from "./bespoke-ai-panel";

// The panel opens at Galaxy S22 Ultra proportions (logical CSS pixels), then
// can be dragged and resized freely by desktop users who want more room.
const DEFAULT_WIDTH = 412;
const DEFAULT_HEIGHT = 760;
const DEFAULT_DOCK_WIDTH = 400;
const MIN_WIDTH = 360;
const MIN_HEIGHT = 460;
const MAX_DOCK_WIDTH = 560;
const EDGE_MARGIN = 20;
const SESSION_KEY = "bespoke-ai-panel-state";

type Rect = { x: number; y: number; width: number; height: number };
type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const RESIZE_HANDLES: Array<{ dir: ResizeDir; className: string }> = [
  { dir: "n", className: "left-3 right-3 top-0 h-1.5 cursor-n-resize" },
  { dir: "s", className: "left-3 right-3 bottom-0 h-1.5 cursor-s-resize" },
  { dir: "e", className: "top-3 bottom-3 right-0 w-1.5 cursor-e-resize" },
  { dir: "w", className: "top-3 bottom-3 left-0 w-1.5 cursor-w-resize" },
  { dir: "nw", className: "left-0 top-0 h-3 w-3 cursor-nw-resize" },
  { dir: "ne", className: "right-0 top-0 h-3 w-3 cursor-ne-resize" },
  { dir: "sw", className: "left-0 bottom-0 h-3 w-3 cursor-sw-resize" },
  { dir: "se", className: "right-0 bottom-0 h-3 w-3 cursor-se-resize" },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function defaultRect(): Rect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(DEFAULT_WIDTH, vw - EDGE_MARGIN * 2);
  const height = Math.min(DEFAULT_HEIGHT, vh - EDGE_MARGIN * 2);
  return {
    width,
    height,
    x: vw - width - EDGE_MARGIN,
    y: Math.max(EDGE_MARGIN, vh - height - EDGE_MARGIN),
  };
}

export function BespokeAILauncher() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [docked, setDocked] = useState(true);
  const [dockWidth, setDockWidth] = useState(DEFAULT_DOCK_WIDTH);
  const [rect, setRect] = useState<Rect | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const shouldHideAI = pathname === "/bespoke-ai";
  const shouldHideWhatsapp =
    pathname === "/contact" || pathname === "/bespoke-ai";
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    WHATSAPP_INQUIRY_MESSAGE,
  )}`;

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const state = JSON.parse(saved) as {
          open?: boolean;
          docked?: boolean;
          dockWidth?: number;
          rect?: Rect | null;
        };
        setOpen(state.open === true);
        setDocked(state.docked !== false);
        if (typeof state.dockWidth === "number") {
          setDockWidth(clamp(state.dockWidth, MIN_WIDTH, MAX_DOCK_WIDTH));
        }
        if (state.rect) setRect(state.rect);
      }
    } catch {
      window.sessionStorage.removeItem(SESSION_KEY);
    } finally {
      setSessionRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!sessionRestored) return;
    window.sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ open, docked, dockWidth, rect }),
    );
  }, [dockWidth, docked, open, rect, sessionRestored]);

  const closePanel = () => {
    setOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  };

  const handleOpen = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setDocked(true);
      setOpen(true);
      return;
    }

    router.push("/bespoke-ai");
  };

  // Pointer-driven move / resize. Snapshots the rect at gesture start and
  // applies deltas against it, clamping to the viewport so the window can
  // never be dragged or grown off-screen.
  const beginGesture = useCallback(
    (event: React.PointerEvent, dir: ResizeDir | "move") => {
      if (!rect) return;
      const startX = event.clientX;
      const startY = event.clientY;
      const start = rect;
      event.preventDefault();

      const onMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        if (dir === "move") {
          setRect({
            ...start,
            x: clamp(start.x + dx, 0, vw - start.width),
            y: clamp(start.y + dy, 0, vh - start.height),
          });
          return;
        }

        let { x, y, width, height } = start;

        if (dir.includes("e")) width = start.width + dx;
        if (dir.includes("s")) height = start.height + dy;
        if (dir.includes("w")) {
          width = start.width - dx;
          x = start.x + dx;
        }
        if (dir.includes("n")) {
          height = start.height - dy;
          y = start.y + dy;
        }

        if (width < MIN_WIDTH) {
          if (dir.includes("w")) x -= MIN_WIDTH - width;
          width = MIN_WIDTH;
        }
        if (height < MIN_HEIGHT) {
          if (dir.includes("n")) y -= MIN_HEIGHT - height;
          height = MIN_HEIGHT;
        }

        x = clamp(x, 0, vw - MIN_WIDTH);
        y = clamp(y, 0, vh - MIN_HEIGHT);
        width = clamp(width, MIN_WIDTH, vw - x);
        height = clamp(height, MIN_HEIGHT, vh - y);

        setRect({ x, y, width, height });
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        document.body.style.userSelect = "";
      };

      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [rect],
  );

  const handleHeaderPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (docked) return;
      // Leave interactive controls in the header clickable.
      if ((event.target as HTMLElement).closest("button, a, input, textarea, select")) {
        return;
      }
      beginGesture(event, "move");
    },
    [beginGesture, docked],
  );

  useEffect(() => {
    if (!open) return;

    document.body.classList.add("bespoke-ai-dock-open");
    if (docked) {
      document.body.classList.add("bespoke-ai-side-panel-open");
      document.documentElement.style.setProperty("--bespoke-ai-side-panel-width", `${dockWidth}px`);
    }
    return () => {
      document.body.classList.remove("bespoke-ai-dock-open", "bespoke-ai-side-panel-open");
      document.documentElement.style.removeProperty("--bespoke-ai-side-panel-width");
    };
  }, [dockWidth, docked, open]);

  // Keep the floating window inside the viewport when it is resized.
  useEffect(() => {
    if (!open) return;

    const onResize = () => {
      setRect((current) => {
        if (!current) return current;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const width = Math.min(current.width, vw - EDGE_MARGIN);
        const height = Math.min(current.height, vh - EDGE_MARGIN);
        return {
          width,
          height,
          x: clamp(current.x, 0, vw - width),
          y: clamp(current.y, 0, vh - height),
        };
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

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

  const toggleDock = () => {
    if (docked) {
      setRect(defaultRect());
      setDocked(false);
      return;
    }
    setDocked(true);
  };

  const beginDockResize = (event: React.PointerEvent) => {
    const startX = event.clientX;
    const startWidth = dockWidth;
    event.preventDefault();

    const onMove = (moveEvent: PointerEvent) => {
      const next = startWidth + (startX - moveEvent.clientX);
      setDockWidth(clamp(next, MIN_WIDTH, Math.min(MAX_DOCK_WIDTH, window.innerWidth - 280)));
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
              <WhatsAppIcon className="h-5 w-5" />
            </a>
          ) : null}
        </div>
      ) : null}

      {open && (docked || rect) ? (
        <aside
          ref={panelRef}
          style={docked ? { right: 0, top: 0, width: dockWidth, height: "100dvh" } : {
            left: rect?.x,
            top: rect?.y,
            width: rect?.width,
            height: rect?.height,
          }}
          className={cn(
            "fixed z-300 hidden flex-col overflow-hidden border-ktf-gray-200 bg-white lg:flex",
            docked
              ? "border-l shadow-[-18px_0_45px_-34px_rgba(15,38,71,0.45)]"
              : "rounded-lg border shadow-2xl",
          )}
          aria-label={docked ? "Bespoke AI side panel" : "Bespoke AI floating panel"}
        >
          <BespokeAIPanel
            mode="panel"
            isDocked={docked}
            onClose={closePanel}
            onToggleDock={toggleDock}
            onHeaderPointerDown={handleHeaderPointerDown}
          />
          {docked ? (
            <div
              role="separator"
              aria-label="Resize Bespoke AI side panel"
              aria-orientation="vertical"
              onPointerDown={beginDockResize}
              className="absolute inset-y-0 left-0 z-20 w-1.5 cursor-ew-resize touch-none transition-colors hover:bg-ktf-blue/20"
            />
          ) : RESIZE_HANDLES.map((handle) => (
            <div
              key={handle.dir}
              role="presentation"
              onPointerDown={(event) => beginGesture(event, handle.dir)}
              className={cn("absolute z-10 touch-none", handle.className)}
            />
          ))}
        </aside>
      ) : null}
    </>
  );
}
