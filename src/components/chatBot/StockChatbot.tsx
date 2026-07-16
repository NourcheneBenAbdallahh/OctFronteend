"use client";

import { useState, useCallback } from "react";
import { MessageCircle, Send } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { askStockBot } from "@/lib/chatbot.api";

export type StockChatbotVariant = "widget" | "page";

type StockChatbotProps = {
  /** widget = bulle flottante (défaut) ; page = panneau large intégré dans une page */
  variant?: StockChatbotVariant;
};

export default function StockChatbot({ variant = "widget" }: StockChatbotProps) {
  const token = useAuthStore((s) => s.token);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(variant === "page");

  const sendQuestion = useCallback(async () => {
    if (!question.trim()) return;

    const currentQuestion = question.trim();
    const historyPayload = messages.map((m) => ({
      role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.text,
    }));

    setMessages((prev) => [...prev, { role: "user", text: currentQuestion }]);
    setQuestion("");
    setLoading(true);

    try {
      const answer = await askStockBot(currentQuestion, historyPayload);
      setMessages((prev) => [...prev, { role: "bot", text: answer }]);
    } catch (e) {
      const err = e instanceof Error ? e.message : "Erreur inconnue.";
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: `Je n’ai pas pu répondre pour le moment. ${err.includes("Connectez-vous") ? err : "Vérifiez votre connexion ou réessayez. Vous pouvez aussi utiliser : « bilan », « stock faible »."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [question, messages]);

  const panelClass =
    variant === "page"
      ? "relative z-0 mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
      : "fixed bottom-24 right-6 z-50 w-[min(100vw-2rem,380px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900";

  const messagesAreaClass =
    variant === "page"
      ? "form-scroll min-h-[min(55vh,420px)] max-h-[min(65vh,520px)] space-y-3 p-4"
      : "form-scroll h-[min(50vh,320px)] space-y-3 p-4";

  return (
    <>
      {variant === "widget" && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#00A09D] text-white shadow-lg shadow-[#00A09D]/30 transition hover:bg-[#008e8b]"
          aria-label="Ouvrir l’assistant stock"
        >
          <MessageCircle className="h-7 w-7" />
        </button>
      )}

      {(variant === "page" || open) && (
        <div className={panelClass}>
          <div className="flex items-center justify-between border-b border-gray-100 bg-[#F8FAFA] px-4 py-3 dark:border-gray-800 dark:bg-gray-800/50">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#00A09D]">
                Assistant
              </p>
              <p className="text-sm font-[1000] text-[#1C2434] dark:text-white">
                Assistant stock OCT
              </p>
            </div>
            {!token && (
              <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                Non connecté
              </span>
            )}
          </div>

          <div className={messagesAreaClass}>
            {messages.length === 0 && (
              <div className="space-y-2 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                <p>
                  Posez une question sur vos <strong>stocks</strong>,{" "}
                  <strong>commandes</strong>, <strong>contrats</strong> ou{" "}
                  <strong>entrepôts</strong>. Réponse basée sur les données enregistrées dans
                  l&apos;application.
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-500">
                  Les questions de <strong>facturation</strong> ne sont pas traitées par cet
                  assistant.
                </p>
                <p className="rounded-lg bg-[#F8FAFA] px-3 py-2 text-[11px] dark:bg-gray-800/80">
                  <span className="font-bold text-[#1C2434] dark:text-gray-200">
                    Exemples à taper :
                  </span>{" "}
                  « bilan », « combien de contrats », « stock faible », « état des commandes ».
                  Vous pouvez aussi poser votre question en phrase complète.
                </p>
              </div>
            )}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-[#00A09D] text-white"
                      : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <p className="text-xs font-medium text-gray-500">Analyse en cours…</p>
            )}
          </div>

          <div className="flex gap-2 border-t border-gray-100 p-3 dark:border-gray-800">
            <input
              className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Posez n’importe quelle question…"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendQuestion();
                }
              }}
            />
            <button
              type="button"
              onClick={() => void sendQuestion()}
              disabled={loading || !question.trim()}
              className="flex shrink-0 items-center justify-center rounded-xl bg-[#1C2434] px-4 py-2 text-white disabled:opacity-40 dark:bg-[#00A09D]"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
