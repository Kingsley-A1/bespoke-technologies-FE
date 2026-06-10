"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BespokeAIIcon } from "./bespoke-ai-icon";
import { BespokeAIPanel } from "./bespoke-ai-panel";

export function BespokeAILauncher() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const previousPathnameRef = useRef(pathname);
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

  if (shouldHide) return null;

  return (
    <>
      {!open ? (
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
      ) : null}

      {open ? (
        <aside
          ref={panelRef}
          className="fixed inset-y-0 right-0 z-300 hidden w-[40vw] min-w-[410px] flex-col border-l border-ktf-gray-200 bg-white shadow-2xl lg:flex"
          aria-label="Bespoke AI side panel"
        >
          <BespokeAIPanel mode="panel" onClose={closePanel} />
        </aside>
      ) : null}
    </>
  );
}
