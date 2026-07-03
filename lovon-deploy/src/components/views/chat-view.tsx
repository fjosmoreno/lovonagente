"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Paperclip, RotateCcw, FileDown, ThumbsUp, ThumbsDown, Copy, MessageCircle, ShieldCheck, Loader2, Upload, Check, X, Crown, Users } from "lucide-react";
import { toast } from "sonner";
import { shadeColor } from "@/lib/lovon-utils";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: any[];
  ts: number;
  feedback?: "up" | "down";
}

interface ChatConfig {
  handle: string;
  personaName: string;
  personaRole: string;
  personaDesc: string;
  primaryColor: string;
  forcedTheme: string;
  avatarBase64?: string;
  aiMode: string;
  leadCapture: boolean;
  pixEnabled: boolean;
  pixAmount: number;
  pixKey?: string;
  pixReceiverName?: string;
  pixBank?: string;
  pixInstructions: string;
  pixWhatsapp?: string;
  vipEnabled: boolean;
}

export function ChatView({ handle }: { handle: string }) {
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typingStart, setTypingStart] = useState(0);
  const [visitorId, setVisitorId] = useState<string>("");
  const [conversationId, setConversationId] = useState<string>("");
  const [showVipForm, setShowVipForm] = useState(false);
  const [vipStep, setVipStep] = useState<"form" | "pix" | "upload" | "done">("form");
  const [vipName, setVipName] = useState("");
  const [vipPhone, setVipPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const attachRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // visitor id
    const vid = localStorage.getItem("lovon_visitor") || `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem("lovon_visitor", vid);
    setVisitorId(vid);
    fetch(`/api/chat/config?handle=${handle}`).then((r) => r.json()).then((d) => { if (d.config) setConfig(d.config); });
  }, [handle]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", content: text, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    setTyping(true);
    setTypingStart(Date.now());

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, message: text, visitorId, history: messages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConversationId(data.conversationId);
      if (data.visitorId && data.visitorId !== visitorId) setVisitorId(data.visitorId);
      const aiMsg: Msg = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        sources: data.sources,
        ts: Date.now(),
      };
      setMessages((m) => [...m, aiMsg]);
      // Show lead form if suggested and not yet submitted
      if (data.suggestLead && !leadSubmitted) {
        setTimeout(() => setShowLeadForm(true), 800);
      }
    } catch (e: any) {
      toast.error(e.message);
      setMessages((m) => [...m, { id: `e-${Date.now()}`, role: "assistant", content: "Erro ao processar. Tente novamente.", ts: Date.now() }]);
    } finally {
      setLoading(false);
      setTyping(false);
    }
  }

  async function submitLead() {
    if (!leadName || !leadPhone) return;
    try {
      await fetch("/api/chat/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, visitorId, name: leadName, whatsapp: leadPhone, email: leadEmail, interest: messages.filter((m) => m.role === "user").map((m) => m.content).join(" | ").slice(0, 200) }),
      });
      setLeadSubmitted(true);
      setShowLeadForm(false);
      toast.success("Contato registrado! Em breve entraremos em contato.");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function sendFeedback(msgId: string, feedback: "up" | "down") {
    setMessages((m) => m.map((x) => (x.id === msgId ? { ...x, feedback } : x)));
    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, feedback }),
      });
    } catch {}
  }

  function restart() {
    setMessages([]);
    setShowVipForm(false);
    setVipStep("form");
    setWhatsapp(null);
    toast.success("Conversa reiniciada");
  }

  function exportPDF() {
    import("jspdf").then(({ jsPDF }: any) => {
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text(`Conversa com ${config?.personaName || "Agente"}`, 14, 18);
      doc.setFontSize(9);
      let y = 30;
      messages.forEach((m) => {
        const role = m.role === "user" ? "Você" : config?.personaName || "Agente";
        const lines = doc.splitTextToSize(`[${role}] ${m.content}`, 180);
        if (y + lines.length * 6 > 280) { doc.addPage(); y = 20; }
        doc.text(lines, 14, y);
        y += lines.length * 6 + 2;
      });
      doc.save(`conversa-${handle}.pdf`);
    });
  }

  function copyPix() {
    const key = config?.pixKey;
    if (!key) {
      toast.error("Chave PIX não configurada pelo vendedor");
      return;
    }
    // Fallback for browsers without clipboard API or insecure context
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(key).catch(() => fallbackCopy(key));
      } else {
        fallbackCopy(key);
      }
      toast.success("Chave PIX copiada!");
    } catch {
      fallbackCopy(key);
    }
  }

  function fallbackCopy(text: string) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(ta);
  }

  async function handlePaymentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Always reset so re-uploading the same file works
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Apenas imagens são aceitas (JPG/PNG/WebP)"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem muito grande (máx 5MB)"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setProofPreview(base64);
      toast.info("Analisando comprovante com IA...");
      try {
        const res = await fetch("/api/chat/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handle, imageBase64: base64, visitorId, leadName: vipName, leadWhatsapp: vipPhone }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro no envio");
        if (data.approved) {
          setWhatsapp(data.whatsapp);
          setVipStep("done");
          toast.success("Pagamento confirmado!");
        } else {
          setVipStep("done");
          toast.info("Comprovante recebido! Aguardando aprovação manual.");
        }
      } catch (e: any) {
        toast.error(e.message || "Falha no envio do comprovante");
        setProofPreview(null);
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      toast.error("Falha ao ler o arquivo");
      setUploading(false);
      setProofPreview(null);
    };
    reader.readAsDataURL(file);
  }

  if (!config) {
    return <div className="h-full flex items-center justify-center bg-background"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const primary = config.primaryColor || "#FF6600";
  const headerGradient = `linear-gradient(135deg, ${primary}, ${shadeColor(primary, -15)})`;

  const quickReplies = [
    "Como funciona?",
    "Quais produtos você tem?",
    "Qual o preço?",
    "Falar com humano",
  ];

  return (
    <div className="h-full flex flex-col bg-background relative">
      {/* Subtle background gradient */}
      <div
        className="fixed inset-0 pointer-events-none opacity-60"
        style={{ background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${primary}11, transparent)` }}
      />
      {/* Header */}
      <header className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3 relative overflow-hidden" style={{ background: headerGradient }}>
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "100% 4px" }} />
        <div className="relative">
          <div className="w-11 h-11 rounded-full bg-black/20 backdrop-blur flex items-center justify-center text-white font-bold ring-2 ring-white/30 relative overflow-hidden">
            {config.avatarBase64 ? <img src={config.avatarBase64} alt="" className="w-full h-full object-cover" /> : config.personaName?.[0] || "L"}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black/30" />
          <span className="absolute inset-0 rounded-full animate-ping-slow" style={{ boxShadow: `0 0 0 2px ${primary}` }} />
        </div>
        <div className="relative flex-1 min-w-0 text-white">
          <div className="font-bold text-sm flex items-center gap-1.5">{config.personaName} <ShieldCheck className="w-3.5 h-3.5 opacity-80" /></div>
          <div className="text-xs opacity-90 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            {config.personaRole}
          </div>
        </div>
        <button onClick={exportPDF} className="relative text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Exportar PDF"><FileDown className="w-4 h-4" /></button>
        <button onClick={restart} className="relative text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Reiniciar"><RotateCcw className="w-4 h-4" /></button>
        <a href={`/?shop=${handle}`} className="relative text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Ver loja"><Sparkles className="w-4 h-4" /></a>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 max-w-3xl mx-auto w-full">
        {/* Welcome hero */}
        {messages.length === 0 && (
          <div className="space-y-3 animate-fade-in-up">
            {/* Big hero card */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 blur-3xl" style={{ background: primary }} />
              <div className="relative flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shrink-0 ring-2 ring-white/20" style={{ background: headerGradient }}>
                  {config.avatarBase64 ? <img src={config.avatarBase64} alt="" className="w-full h-full object-cover rounded-2xl" /> : config.personaName?.[0] || "L"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-bold text-base">{config.personaName}</h2>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{config.personaRole}</p>
                  <p className="text-sm text-foreground/80 line-clamp-3 leading-relaxed">{config.personaDesc || `Olá! Sou ${config.personaName}, ${config.personaRole}. Pergunte qualquer coisa sobre meu trabalho!`}</p>
                </div>
              </div>
              <div className="relative flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t border-border/50">
                <Badge variant="secondary" className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><ShieldCheck className="w-3 h-3" /> Anti-alucinação</Badge>
                <Badge variant="secondary" className="text-[10px] gap-1"><Sparkles className="w-3 h-3" /> RAG</Badge>
                {config.pixEnabled && <Badge variant="secondary" className="text-[10px] gap-1"><Crown className="w-3 h-3" /> VIP disponível</Badge>}
                <span className="text-[10px] text-muted-foreground ml-auto">Responde em segundos</span>
              </div>
            </div>
            {/* Greeting bubble */}
            <div className="flex justify-start animate-msg-in">
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-2.5 bg-card border border-border">
                <p className="text-sm">Oi! 👋 Sou <strong>{config.personaName}</strong>. Posso te ajudar com dúvidas sobre meu trabalho, produtos e serviços. O que você gostaria de saber?</p>
              </div>
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-msg-in`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 group ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] opacity-50">{new Date(m.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                {m.role === "assistant" && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => sendFeedback(m.id, "up")} className={`hover:text-emerald-500 ${m.feedback === "up" ? "text-emerald-500" : ""}`}><ThumbsUp className="w-3 h-3" /></button>
                    <button onClick={() => sendFeedback(m.id, "down")} className={`hover:text-red-500 ${m.feedback === "down" ? "text-red-500" : ""}`}><ThumbsDown className="w-3 h-3" /></button>
                  </div>
                )}
              </div>
              {m.sources && m.sources.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/50">
                  {m.sources.map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-[9px] gap-1"><Sparkles className="w-2.5 h-2.5" /> {s.title}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="flex justify-start animate-msg-in">
            <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-typing-bounce" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-typing-bounce delay-200" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-typing-bounce delay-400" />
              </div>
              <span className="text-[10px] text-muted-foreground ml-1">
                {typingStart ? `${Math.floor((Date.now() - typingStart) / 1000)}s` : ""}
              </span>
            </div>
          </div>
        )}

        {/* Lead capture form */}
        {showLeadForm && !leadSubmitted && (
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-card p-4 animate-slide-in-bottom max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-semibold text-sm">Quer receber novidades?</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Deixe seu contato e receba conteúdos exclusivos do(a) {config.personaName}.</p>
            <div className="space-y-2">
              <Input placeholder="Seu nome *" value={leadName} onChange={(e) => setLeadName(e.target.value)} />
              <Input placeholder="WhatsApp (com DDD) *" value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} />
              <Input type="email" placeholder="Email (opcional)" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} />
              <div className="flex gap-2">
                <Button className="flex-1" style={{ background: primary }} onClick={submitLead} disabled={!leadName || !leadPhone}>
                  Quero receber
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowLeadForm(false)}>Agora não</Button>
              </div>
            </div>
          </div>
        )}

        {leadSubmitted && (
          <div className="flex justify-center animate-fade-in-up">
            <div className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-4 py-1.5 text-xs text-emerald-500 flex items-center gap-1.5">
              <Check className="w-3 h-3" /> Contato registrado!
            </div>
          </div>
        )}

        {/* VIP flow */}
        {showVipForm && (
          <div className="rounded-2xl border-2 border-primary/30 bg-card p-4 animate-slide-in-bottom max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">Conteúdo VIP</span>
            </div>

            {vipStep === "form" && (
              <div className="space-y-3">
                <Input placeholder="Seu nome" value={vipName} onChange={(e) => setVipName(e.target.value)} />
                <Input placeholder="WhatsApp (com DDD)" value={vipPhone} onChange={(e) => setVipPhone(e.target.value)} />
                <Button className="w-full" style={{ background: primary }} onClick={() => setVipStep("pix")} disabled={!vipName || !vipPhone}>
                  Continuar
                </Button>
              </div>
            )}

            {vipStep === "pix" && config.pixEnabled && (
              <div className="space-y-3">
                <div className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">
                  {(config.pixInstructions || "Pague {valor} para a chave PIX {chave} ({nome}).")
                    .replace("{valor}", `R$ ${(config.pixAmount || 0).toFixed(2)}`)
                    .replace("{chave}", config.pixKey || "(chave não configurada)")
                    .replace("{nome}", config.pixReceiverName || "")}
                </div>
                <Button variant="outline" className="w-full" onClick={copyPix}><Copy className="w-4 h-4 mr-2" /> Copiar chave PIX</Button>

                {/* Proof preview after selection */}
                {proofPreview && (
                  <div className="rounded-lg border border-border bg-background p-2 animate-fade-in-up">
                    <div className="flex items-center gap-2">
                      <img src={proofPreview} alt="Comprovante" className="w-12 h-12 rounded-md object-cover border border-border" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium">Comprovante selecionado</div>
                        <div className="text-[10px] text-muted-foreground">
                          {uploading ? <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Enviando e analisando...</span> : "Pronto para enviar"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Use a real label + input id so the file picker opens reliably across all browsers (incl. iOS Safari).
                    Hidden input is at the same DOM level as the label, not nested inside a button. */}
                <input id="lovon-payment-upload" ref={fileRef} type="file" accept="image/*" onChange={handlePaymentUpload} disabled={uploading} className="sr-only" />
                <label htmlFor="lovon-payment-upload" className={`flex items-center justify-center w-full h-10 rounded-md text-sm font-medium cursor-pointer transition-all ${uploading ? "opacity-60 pointer-events-none" : ""}`} style={{ background: primary, color: "#fff"}}>
                  {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {proofPreview ? "Trocar comprovante" : "Enviar comprovante"}
                </label>
                <p className="text-[10px] text-muted-foreground text-center">JPG, PNG ou WebP até 5MB</p>
              </div>
            )}

            {vipStep === "done" && (
              <div className="text-center py-4">
                {whatsapp ? (
                  <>
                    <Check className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                    <p className="font-semibold text-sm mb-3">Pagamento confirmado!</p>
                    <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                      <Button style={{ background: "#25D366" }}><MessageCircle className="w-4 h-4 mr-2" /> Abrir WhatsApp</Button>
                    </a>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-8 h-8 mx-auto text-primary mb-2 animate-spin" />
                    <p className="text-sm text-muted-foreground">Comprovante recebido! Assim que for aprovado, liberaremos o contato.</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick replies */}
      {messages.length === 0 && (
        <div className="px-4 pb-2 max-w-3xl mx-auto w-full">
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((q) => (
              <button key={q} onClick={() => sendMessage(q)} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:border-primary hover:text-primary hover:bg-primary/5 transition-all">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="relative border-t border-border bg-background/95 backdrop-blur-md p-3 max-w-3xl mx-auto w-full">
        {/* VIP shortcut - always visible when enabled */}
        {config.vipEnabled && !showVipForm && (
          <button onClick={() => setShowVipForm(true)} className="absolute -top-3 right-4 rounded-full border border-primary/40 bg-primary text-primary-foreground px-3 py-1 text-[10px] font-medium flex items-center gap-1 shadow-lg hover:scale-105 transition-transform">
            <Crown className="w-3 h-3" /> Acesso VIP
          </button>
        )}
        <div className="flex items-end gap-2">
          <input ref={attachRef} type="file" className="hidden" onChange={() => toast.info("Anexos em breve")} />
          <Button variant="outline" size="icon" className="shrink-0 border-border bg-card" onClick={() => attachRef.current?.click()}><Paperclip className="w-4 h-4" /></Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder={`Mensagem para ${config.personaName}...`}
            rows={1}
            className="field-sizing-content max-h-32 bg-card border-border focus-visible:ring-1 focus-visible:ring-primary min-h-[40px]"
          />
          <Button size="icon" className="shrink-0 shadow-md" onClick={() => sendMessage(input)} disabled={loading || !input.trim()} style={{ background: primary }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">Powered by Lovon • IA com base de conhecimento</p>
      </div>
    </div>
  );
}
