"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ShieldCheck, Pause, Play, ArrowLeft, Loader2 } from "lucide-react";

const DEMO_QUESTIONS = [
  "O que você faz?",
  "Como funciona seu trabalho?",
  "Quais produtos você oferece?",
  "Qual o preço dos seus serviços?",
  "Como posso falar com você?",
  "Você tem algum desconto?",
  "Conte mais sobre sua experiência",
];

export function PresentView({ handle }: { handle?: string }) {
  const [config, setConfig] = useState<any>(null);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [playing, setPlaying] = useState(true);
  const [idx, setIdx] = useState(0);
  const [typing, setTyping] = useState(false);
  const timer = useRef<any>(null);
  const h = handle || "demo";

  useEffect(() => {
    fetch(`/api/chat/config?handle=${h}`).then((r) => r.json()).then((d) => { if (d.config) setConfig(d.config); });
  }, [h]);

  useEffect(() => {
    if (!playing || !config) return;
    if (idx >= DEMO_QUESTIONS.length) {
      setPlaying(false);
      return;
    }
    async function run() {
      const q = DEMO_QUESTIONS[idx];
      setMessages((m) => [...m, { role: "user", content: q }]);
      setTyping(true);
      try {
        const res = await fetch("/api/chat/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handle: h, message: q, visitorId: `present-${Date.now()}`, history: messages }),
        });
        const data = await res.json();
        setTyping(false);
        setMessages((m) => [...m, { role: "assistant", content: data.reply || "..." }]);
      } catch {
        setTyping(false);
        setMessages((m) => [...m, { role: "assistant", content: "Não foi possível responder agora." }]);
      }
      setIdx((i) => i + 1);
    }
    timer.current = setTimeout(run, 1500);
    return () => clearTimeout(timer.current);
  }, [playing, idx, config]);

  function reset() {
    setMessages([]);
    setIdx(0);
    setPlaying(true);
  }

  if (!config) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border px-4 py-3 flex items-center gap-3">
        <a href={`/?chat=${h}`} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></a>
        <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/30">
          {config.avatarBase64 ? <img src={config.avatarBase64} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary flex items-center justify-center text-black font-bold">{config.personaName?.[0]}</div>}
        </div>
        <div className="flex-1">
          <div className="font-bold text-sm">{config.personaName} — Modo Apresentação</div>
          <div className="text-xs text-muted-foreground">Demonstração automática</div>
        </div>
        <Badge className="gap-1 animate-badge-glow"><Sparkles className="w-3 h-3" /> Demo</Badge>
        <Button variant="outline" size="sm" onClick={() => setPlaying(!playing)}>
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button variant="outline" size="sm" onClick={reset}>Reiniciar</Button>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl px-4 py-3 flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-typing-bounce" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-typing-bounce delay-200" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-typing-bounce delay-400" />
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="border-t border-border p-3 text-center">
        <Badge variant="secondary" className="gap-1"><ShieldCheck className="w-3 h-3" /> IA Anti-Alucinação • RAG</Badge>
      </footer>
    </div>
  );
}
