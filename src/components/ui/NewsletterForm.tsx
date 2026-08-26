"use client";

import React, { useState } from "react";
import { Send } from "lucide-react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    // Simulate API registration
    setTimeout(() => {
      setStatus("success");
      setEmail("");
    }, 1000);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      {status === "success" ? (
        <div
          role="status"
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-400"
        >
          ✓ Obrigado por se inscrever! Fique de olho no seu e-mail para novidades exclusivas.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            placeholder="Seu melhor e-mail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading"}
            aria-label="Seu melhor e-mail"
            className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-ink-500 outline-none transition-colors focus:border-electric-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="btn-electric shrink-0"
          >
            <span>{status === "loading" ? "Inscrito..." : "Inscrever"}</span>
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}
