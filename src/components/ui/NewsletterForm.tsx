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
    <div className="w-full max-w-md mx-auto">
      {status === "success" ? (
        <div className="rounded-lg bg-emerald-950 border border-emerald-800 p-4 text-emerald-400 font-semibold text-sm">
          ✓ Obrigado por se inscrever! Fique de olho no seu e-mail para novidades exclusivas.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="Seu melhor e-mail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading"}
            className="w-full rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:ring-amber-500 outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="flex items-center justify-center space-x-2 rounded-lg bg-amber-600 hover:bg-amber-500 px-6 py-3 font-bold text-white transition-all text-sm uppercase tracking-wider disabled:opacity-50"
          >
            <span>{status === "loading" ? "Inscrito..." : "Inscrever"}</span>
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}
