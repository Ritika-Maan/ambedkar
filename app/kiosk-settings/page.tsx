"use client";
import { useState } from "react";

export default function KioskSettingsPage() {
  const [fullscreen, setFullscreen] = useState(false);

  if (fullscreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 p-8"
        style={{ background: "var(--indigo-deep)", color: "var(--paper)" }}
      >
        <p className="font-serif-display text-3xl text-center">Kiosk mode active</p>
        <p className="text-lg opacity-80 text-center max-w-md">
          High-contrast, touch-first view for the institutional display.
        </p>
        <button
          onClick={() => setFullscreen(false)}
          className="min-h-[56px] px-8 rounded-md text-lg font-medium"
          style={{ background: "var(--brass)", color: "var(--indigo-deep)" }}
        >
          Exit kiosk mode
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] px-6 py-10">
      <div className="max-w-xl mx-auto">
        <h1 className="font-serif-display text-2xl mb-2" style={{ color: "var(--indigo-deep)" }}>
          Kiosk settings
        </h1>
        <p className="mb-6 opacity-80">Configure the fullscreen, touch-first display mode.</p>
        <button
          onClick={() => setFullscreen(true)}
          className="min-h-[56px] px-8 rounded-md text-lg font-medium"
          style={{ background: "var(--indigo)", color: "var(--paper-raised)" }}
        >
          Enter kiosk mode
        </button>
      </div>
    </div>
  );
}
