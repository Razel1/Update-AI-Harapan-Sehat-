import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Send,
  Stethoscope,
  User2,
  Loader2,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Phone,
  MapPin,
  Mail,
  Heart,
  Activity,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Klinik Harapan Sehat — Konsultasi Dokter Online" },
      {
        name: "description",
        content:
          "Konsultasi keluhan kesehatan Anda dengan dokter virtual Klinik Harapan Sehat kapan saja, gratis dan responsif.",
      },
      { property: "og:title", content: "Klinik Harapan Sehat" },
      {
        property: "og:description",
        content: "Konsultasi dokter online 24/7 di Klinik Harapan Sehat.",
      },
    ],
  }),
  component: Index,
});

type ChatMessage = {
  id: string;
  role: "user" | "doctor";
  content: string;
};

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const QUICK_PROMPTS = [
  "Saya demam dan pusing sejak kemarin",
  "Bagaimana pola makan sehat?",
  "Anak saya batuk pilek, apa yang harus dilakukan?",
  "Tips menjaga imun tubuh",
];

const SOCIALS = [
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/klinik.hs?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==", color: "hover:text-pink-500" },
  { icon: Facebook, label: "Facebook", href: "https://www.facebook.com/klinik.hs", color: "hover:text-blue-600" },
  { icon: Twitter, label: "Twitter", href: "https://x.com/SehatHarapan?s=20", color: "hover:text-sky-500" },
  { icon: Youtube, label: "YouTube", href: "https://www.youtube.com/@klinikharapansehatcianjur", color: "hover:text-red-500" },
];

function Avatar({ role }: { role: "user" | "doctor" }) {
  const isDoctor = role === "doctor";
  return (
    <div
      className={
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-md ring-2 ring-white " +
        (isDoctor
          ? "bg-gradient-to-br from-teal-500 to-emerald-600 text-white"
          : "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700")
      }
    >
      {isDoctor ? <Stethoscope className="h-4 w-4" /> : <User2 className="h-4 w-4" />}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`flex items-end gap-2 animate-fade-in ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && <Avatar role="doctor" />}
      <div
        className={
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed transition-all " +
          (isUser
            ? "rounded-br-sm bg-gradient-to-br from-teal-500 to-emerald-600 text-white"
            : "rounded-bl-sm bg-white text-slate-800 border border-slate-100")
        }
      >
        <ReactMarkdown
          components={{
            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
            ul: ({ node, ...props }) => (
              <ul className="list-disc ml-4 mb-2 space-y-1" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal ml-4 mb-2 space-y-1" {...props} />
            ),
            li: ({ node, ...props }) => <li {...props} />,
            strong: ({ node, ...props }) => (
              <strong className="font-semibold" {...props} />
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
      {isUser && <Avatar role="user" />}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <Avatar role="doctor" />
      <div className="rounded-2xl rounded-bl-sm bg-white border border-slate-100 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-teal-500 animate-bounce" />
        </div>
      </div>
    </div>
  );
}

function Index() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: makeId(),
      role: "doctor",
      content:
        "Selamat datang di **Klinik Harapan Sehat** 👋\n\nSaya Dokter virtual Anda. Silakan ceritakan keluhan atau gejala yang Anda rasakan, dan saya akan bantu sebisa mungkin.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text || loading) return;
    const userMsg: ChatMessage = { id: makeId(), role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/konsultasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      if (!res.ok) throw new Error("Server sedang sibuk");
      const data = await res.json();
      setMessages([
        ...updated,
        { id: makeId(), role: "doctor", content: data.pesan },
      ]);
    } catch {
      setError("Gagal menghubungi server. Coba lagi sebentar.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    sendMessage(input.trim());
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-teal-50 via-slate-50 to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/30">
              <Heart className="h-5 w-5" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Klinik Harapan Sehat
              </h1>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Dokter online sekarang
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-1 sm:flex">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:scale-110 ${s.color}`}
              >
                <s.icon className="h-4 w-4" />
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* Chat area */}
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {/* Info card */}
          <div className="rounded-2xl border border-teal-100 bg-white/70 p-4 shadow-sm backdrop-blur">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  Konsultasi gratis & rahasia
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Ceritakan gejala Anda. Untuk kondisi darurat, segera hubungi
                  fasilitas kesehatan terdekat.
                </p>
              </div>
            </div>
          </div>

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {loading && <TypingIndicator />}

          {error && (
            <div className="mx-auto rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Quick prompts */}
          {messages.length <= 1 && !loading && (
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="rounded-full border border-teal-200 bg-white px-3 py-1.5 text-xs text-teal-700 shadow-sm transition-all hover:bg-teal-50 hover:scale-105"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 border-t border-slate-200/60 bg-white/90 backdrop-blur-md px-4 py-3"
      >
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              rows={1}
              className="w-full resize-none rounded-2xl bg-transparent px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none max-h-32"
              placeholder="Tulis keluhan Anda..."
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/30 transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            aria-label="Kirim pesan"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Activity className="h-4 w-4 text-teal-600" />
                Klinik Harapan Sehat
              </div>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Layanan konsultasi kesehatan online yang membantu Anda memahami
                gejala dan tindakan awal.
              </p>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <p className="font-semibold text-slate-900 text-sm">Kontak</p>
              <a href="tel:+622112345678" className="flex items-center gap-2 hover:text-teal-600">
                <Phone className="h-3.5 w-3.5" /> +62 21 1234 5678
              </a>
              <a href="mailto:halo@harapansehat.id" className="flex items-center gap-2 hover:text-teal-600">
                <Mail className="h-3.5 w-3.5" /> halo@harapansehat.id
              </a>
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> Jakarta, Indonesia
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Ikuti kami</p>
              <div className="mt-2 flex gap-2">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className={`flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:scale-110 ${s.color}`}
                  >
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Klinik Harapan Sehat. Konsultasi ini
            bukan pengganti diagnosis medis profesional.
          </p>
        </div>
      </footer>
    </div>
  );
}
