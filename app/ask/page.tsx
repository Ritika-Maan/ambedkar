"use client";
import { useState } from "react";

type Message = { role: "user" | "assistant"; text: string; citation?: string };

const dummyMessages: Message[] = [
  { role: "user", text: "What did Ambedkar say about fundamental rights?" },
  {
    role: "assistant",
    text: "He argued fundamental rights must be justiciable.",
    citation: "Draft Constitution, 4 Nov 1948",
  },
];

export default function AskPage() {
  const [messages] = useState(dummyMessages);
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="min-h-[calc(100vh-73px)] px-6 py-10">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <h1 className="font-serif-display text-2xl mb-2" style={{ color: "var(--indigo-deep)" }}>
          Ask the archive
        </h1>

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[75%] px-4 py-3 rounded-md"
              style={
                m.role === "user"
                  ? { background: "var(--indigo)", color: "var(--paper-raised)" }
                  : {
                      background: "var(--paper-raised)",
                      color: "var(--ink)",
                      borderLeft: "3px solid var(--brass)",
                    }
              }
            >
              <p className="leading-relaxed">{m.text}</p>
              {m.citation && (
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="text-xs mt-2 block"
                  style={{ color: "var(--brass)" }}
                >
                  {expanded === i ? `— ${m.citation}` : "view source"}
                </button>
              )}
            </div>
          </div>
        ))}

        <input
          className="mt-6 px-4 py-3 rounded-md outline-none"
          style={{
            background: "var(--paper-raised)",
            border: "1px solid var(--rule)",
            color: "var(--ink)",
          }}
          placeholder="Ask about a speech, debate, or writing…"
        />
      </div>
    </div>
  );
}
