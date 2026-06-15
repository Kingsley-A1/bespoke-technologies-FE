"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { BRAND_ICON_SRC, SITE_NAME } from "@/lib/constants";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt(): Promise<void>;
}

const PROMPT_DELAY_MS = 30_000;

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Check if previously dismissed (within 7 days)
    const dismissedAt = localStorage.getItem("bt-install-dismissed");
    if (dismissedAt) {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissedAt) < sevenDays) return;
    }

    // iOS detection
    const isIOSDevice =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window.navigator as Navigator & { standalone?: boolean }).standalone;
    if (isIOSDevice) {
      const timeout = window.setTimeout(() => {
        setIsIOS(true);
        setShow(true);
      }, PROMPT_DELAY_MS);
      return () => window.clearTimeout(timeout);
    }

    // Android/Chrome — listen for native prompt
    let promptTimeout: number | undefined;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      promptTimeout = window.setTimeout(
        () => setShow(true),
        PROMPT_DELAY_MS,
      );
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      if (promptTimeout) window.clearTimeout(promptTimeout);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("bt-install-dismissed", Date.now().toString());
  };

  if (dismissed || (!deferredPrompt && !isIOS)) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-5 left-4 right-4 z-300 md:bottom-6 md:left-auto md:right-6 md:w-96"
          role="dialog"
          aria-label={`Install ${SITE_NAME} app`}
        >
          <div className="overflow-hidden rounded-2xl border border-ktf-gray-200 bg-ktf-white/95 shadow-premium backdrop-blur-xl">
            <div className="h-1 w-full bg-linear-to-r from-ktf-blue via-ktf-blue-deep to-ktf-gold" />

            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-ktf-gray-200 bg-ktf-white">
                  <Image
                    src={BRAND_ICON_SRC}
                    alt="Bespoke Technologies logo"
                    width={44}
                    height={44}
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ktf-navy leading-snug">
                    Install Bespoke Technologies
                  </p>
                  <p className="mt-1 text-caption leading-relaxed text-ktf-gray-600">
                    Keep Bespoke Technologies one tap away for a faster,
                    polished app-like experience.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="mt-0.5 shrink-0 rounded-md p-1 text-ktf-gray-500 transition-colors hover:bg-ktf-surface hover:text-ktf-navy"
                  aria-label="Dismiss install prompt"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M12 4L4 12M4 4l8 8" />
                  </svg>
                </button>
              </div>

              {isIOS ? (
                <div className="mt-4 rounded-xl border border-ktf-gray-200 bg-ktf-surface p-3">
                  <p className="text-caption leading-relaxed text-ktf-gray-700">
                    On iPhone or iPad, tap the{" "}
                    <span className="font-semibold text-ktf-blue">Share</span>{" "}
                    icon, then choose{" "}
                    <span className="font-semibold text-ktf-blue">
                      Add to Home Screen
                    </span>
                    .
                  </p>
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInstall}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-ktf-blue px-4 text-caption font-semibold text-white transition-colors hover:bg-ktf-blue-deep"
                  >
                    Install App
                  </button>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-ktf-gray-200 bg-ktf-white px-4 text-caption font-semibold text-ktf-gray-600 transition-colors hover:bg-ktf-surface hover:text-ktf-navy"
                  >
                    Maybe Later
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
