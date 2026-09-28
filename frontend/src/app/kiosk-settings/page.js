"use client";
/* eslint-disable react-hooks/set-state-in-effect -- reads browser-only state after mount */
import { useEffect, useState } from "react";
import Link from "next/link";

const btn = { minHeight: 56, padding: "0 1.25rem", fontSize: "1rem", borderRadius: 12, border: "2px solid #000", background: "#fff", color: "#000", cursor: "pointer" };
const on = { ...btn, background: "#000", color: "#fff" };

export default function KioskSettingsPage() {
  const [fsSupported, setFsSupported] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const [contrast, setContrast] = useState(false);
  const [large, setLarge] = useState(false);

  useEffect(() => {
    setFsSupported(!!document.fullscreenEnabled);
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    try {
      setContrast(localStorage.getItem("ask.contrast") === "1");
      setLarge(localStorage.getItem("ask.large") === "1");
    } catch {}
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  function setPref(key, value, setter) {
    setter(value);
    try { localStorage.setItem(key, value ? "1" : "0"); } catch {}
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  }

  return (
    <div style={{ maxWidth: 640, fontSize: 20 }}>
      <h1>Kiosk Settings</h1>
      <p>Set up the display for a touch screen, then open the archive.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", margin: "1.5rem 0" }}>
        {fsSupported && (
          <button type="button" style={isFs ? on : btn} onClick={toggleFullscreen}>
            {isFs ? "Exit fullscreen" : "Enter fullscreen"}
          </button>
        )}
        <button type="button" style={contrast ? on : btn} aria-pressed={contrast} onClick={() => setPref("ask.contrast", !contrast, setContrast)}>
          High contrast: {contrast ? "on" : "off"}
        </button>
        <button type="button" style={large ? on : btn} aria-pressed={large} onClick={() => setPref("ask.large", !large, setLarge)}>
          Large text: {large ? "on" : "off"}
        </button>
      </div>
      <Link href="/ask" style={{ ...btn, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
        Open Ask Ambedkar →
      </Link>
    </div>
  );
}