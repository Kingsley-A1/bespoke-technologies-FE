"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AuthSubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const form = buttonRef.current?.form;
    if (!form) return;

    const handleSubmit = () => {
      /*
       * Let the browser accept the native form submission before disabling its
       * submitter. Disabling during the click event can cancel the POST in
       * Chromium, leaving the UI in a permanent loading state.
       */
      window.setTimeout(() => setPending(true), 0);
    };
    const handlePageShow = () => setPending(false);

    form.addEventListener("submit", handleSubmit);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      form.removeEventListener("submit", handleSubmit);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      type="submit"
      disabled={pending}
      className={cn("inline-flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-70", className)}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {pending ? pendingLabel : children}
    </button>
  );
}
