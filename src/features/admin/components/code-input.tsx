"use client";

import { useRef, useState } from "react";

export function CodeInput() {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label htmlFor="admin-code" className="mb-2 block text-sm font-semibold text-slate-800">Six-digit access code</label>
      <div className="relative" onClick={() => inputRef.current?.focus()}>
        <input
          ref={inputRef}
          id="admin-code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          value={value}
          onChange={(event) => setValue(event.target.value.replace(/\D/g, "").slice(0, 6))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
          aria-describedby="admin-code-hint"
        />
        <div className="grid grid-cols-6 gap-2" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <span
              key={index}
              className={`flex aspect-square max-h-14 items-center justify-center rounded-lg border bg-white text-xl font-bold shadow-sm transition ${
                focused && index === Math.min(value.length, 5) ? "border-ktf-blue ring-2 ring-ktf-blue/20" : "border-slate-200"
              }`}
            >
              {value[index] ? "•" : ""}
            </span>
          ))}
        </div>
      </div>
      <p id="admin-code-hint" className="mt-2 text-xs leading-5 text-slate-500">Enter the rotating code from your approved authenticator. Full-code paste is supported.</p>
    </div>
  );
}
