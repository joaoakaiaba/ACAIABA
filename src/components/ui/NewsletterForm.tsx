"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";

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
    <div className="w-full">
      {status === "success" ? (
        <div
          role="status"
          className="border-b border-noir-50 pb-4 font-display text-sm font-bold uppercase tracking-label text-noir-50"
        >
          ✓ Inscrição confirmada. Bem-vindo ao movimento.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="group flex items-end gap-4">
          <div className="flex-1">
            <label htmlFor="newsletter-email" className="sr-only">
              Seu melhor e-mail
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="SEU MELHOR E-MAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading"}
              className="w-full border-b border-white/25 bg-transparent pb-4 font-display text-sm font-bold uppercase tracking-label text-noir-50 placeholder-noir-500 outline-none transition-colors focus:border-noir-50 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={status === "loading"}
            aria-label="Inscrever"
            className="flex h-12 w-12 shrink-0 items-center justify-center border border-white/25 text-noir-50 transition-all duration-300 hover:border-noir-50 hover:bg-noir-50 hover:text-noir-950 disabled:opacity-50"
          >
            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
        </form>
      )}
    </div>
  );
}
