"use client";

import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      
      <div className="text-center max-w-xl mx-auto space-y-3">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
          Fale Conosco
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tem alguma dúvida sobre seu pedido, produtos ou parcerias? Entre em contato com a equipe da ACAIABA.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Contact info details */}
        <div className="space-y-8 bg-slate-50 dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight border-b border-gray-200 dark:border-slate-700 pb-3">
            Canais de Atendimento
          </h2>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <MessageSquare className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase">Atendimento WhatsApp</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Segunda a Sexta, das 9h às 18h</p>
                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-amber-600 font-bold hover:underline block mt-1"
                >
                  +55 (11) 99999-9999
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Mail className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase">E-mail de Suporte</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Respondemos em até 24 horas úteis</p>
                <a href="mailto:suporte@acaiaba.com" className="text-sm text-amber-600 font-bold hover:underline block mt-1">
                  suporte@acaiaba.com
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <MapPin className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase">Sede Administrativa</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-1">
                  Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight border-b border-gray-100 dark:border-slate-800 pb-3">
            Envie uma Mensagem
          </h2>

          {status === "success" ? (
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-6 text-emerald-700 font-semibold text-sm">
              ✓ Mensagem enviada com sucesso! Um de nossos especialistas entrará em contato em breve.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Mariana Silva"
                  className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 py-2.5 px-4 text-sm outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">E-mail de Contato</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: mariana@email.com"
                  className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 py-2.5 px-4 text-sm outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">Mensagem</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Como podemos te ajudar?"
                  className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 py-2.5 px-4 text-sm outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full h-11 flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow transition-all disabled:opacity-50"
              >
                <span>{status === "loading" ? "Enviando..." : "Enviar Mensagem"}</span>
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}
