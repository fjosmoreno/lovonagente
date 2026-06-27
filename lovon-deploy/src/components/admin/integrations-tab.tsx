"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useFetch, apiPost } from "@/hooks/use-fetch";
import { toast } from "sonner";
import { Copy, ExternalLink, QrCode, Plug, MessageSquare, MessageCircle, Store, Phone, Code, Bell, CheckCircle2, Globe } from "lucide-react";

export function IntegrationsTab() {
  const { data, refetch } = useFetch<any>("/api/admin/agent");
  const { data: notif } = useFetch<any>("/api/admin/notifications");
  const [webhook, setWebhook] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const [embedTab, setEmbedTab] = useState<"float" | "chat" | "shop">("float");

  useEffect(() => { if (data?.agent) setWebhook(data.agent.webhookUrl || ""); }, [data]);

  const agent = data?.agent;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const chatUrl = agent?.handle ? `${baseUrl}/?chat=${agent.handle}` : "";
  const shopUrl = agent?.handle ? `${baseUrl}/?shop=${agent.handle}` : "";

  // Embed codes for third-party sites
  const floatEmbedCode = agent?.handle ? `<!-- Lovon Agente - Chat Flutuante -->
<script>
(function(){
  var d=document,s=d.createElement('script');
  s.src='${baseUrl}/embed.js?handle=${agent.handle}&type=float';
  s.async=1;
  d.head.appendChild(s);
})();
</script>` : "";

  const chatIframeCode = agent?.handle ? `<!-- Lovon Agente - Chat Incorporado -->
<iframe
  src="${baseUrl}/?chat=${agent.handle}"
  width="400"
  height="600"
  frameborder="0"
  style="border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.15);"
  allow="clipboard-write"
  title="Chat com ${agent.personaName || "Agente"}">
</iframe>` : "";

  const shopIframeCode = agent?.handle ? `<!-- Lovon Agente - Loja Incorporada -->
<iframe
  src="${baseUrl}/?shop=${agent.handle}"
  width="100%"
  height="800"
  frameborder="0"
  style="border:none;border-radius:12px;"
  title="Loja de ${agent.personaName || "Agente"}">
</iframe>` : "";

  const currentEmbedCode = embedTab === "float" ? floatEmbedCode : embedTab === "chat" ? chatIframeCode : shopIframeCode;

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copiado");
    setTimeout(() => setCopied(""), 2000);
  }

  async function saveWebhook() {
    try { await apiPost("/api/admin/webhook", { webhookUrl: webhook }, "PUT"); refetch(); toast.success("Webhook salvo"); }
    catch (e: any) { toast.error(e.message); }
  }

  async function testWebhook() {
    try { const r = await apiPost("/api/admin/webhook", {}, "POST"); toast.success(`Teste enviado (status ${r.status})`); }
    catch (e: any) { toast.error(e.message); }
  }

  const cards = [
    { icon: Plug, title: "Perfil Lovon", desc: "Conectado à sua URL Lovon", status: agent?.lovonUrl ? "connected" : "pending", value: agent?.lovonUrl || "Não conectado" },
    { icon: Store, title: "Loja pública", desc: "Sua vitrine online", status: shopUrl ? "connected" : "pending", value: shopUrl, action: shopUrl ? () => window.open(shopUrl, "_blank") : undefined },
    { icon: Phone, title: "WhatsApp", desc: "Número para liberação após PIX", status: agent?.pixWhatsapp ? "connected" : "pending", value: agent?.pixWhatsapp || "Não configurado" },
    { icon: MessageSquare, title: "Chat público", desc: "Link do seu agente", status: chatUrl ? "connected" : "pending", value: chatUrl, action: chatUrl ? () => window.open(chatUrl, "_blank") : undefined },
  ];

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.status === "connected" ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                  <c.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{c.title}</span>
                    {c.status === "connected" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Badge variant="secondary" className="text-[9px]">Pendente</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <code className="text-xs text-muted-foreground truncate flex-1 font-mono">{c.value}</code>
                    {c.value && c.value !== "Não configurado" && c.value !== "Não conectado" && (
                      <button onClick={() => copy(c.value, c.title)} className="text-muted-foreground hover:text-primary shrink-0">
                        {copied === c.title ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    {c.action && <button onClick={c.action} className="text-muted-foreground hover:text-primary shrink-0"><ExternalLink className="w-3.5 h-3.5" /></button>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* QR Code */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><QrCode className="w-4 h-4" /> QR Code do Chat</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 rounded-lg bg-white p-2 border border-border">
              {chatUrl && <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(chatUrl)}`} alt="QR" className="w-full h-full" />}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Compartilhe este QR code para que visitantes acessem seu agente.</p>
              <Button variant="outline" size="sm" onClick={() => chatUrl && copy(chatUrl, "qr")}><Copy className="w-4 h-4 mr-1" /> {copied === "qr" ? "Copiado!" : "Copiar link"}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embed on external sites */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4" /> Incorporar em sites externos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Cole o código abaixo no HTML do seu site para incorporar seu agente ou loja.</p>

          {/* Embed type tabs */}
          <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
            {[
              { id: "float" as const, label: "Chat flutuante", desc: "Botão flutuante que abre o chat" },
              { id: "chat" as const, label: "Chat completo", desc: "Iframe com o chat integrado" },
              { id: "shop" as const, label: "Loja", desc: "Iframe com a loja completa" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setEmbedTab(t.id)}
                className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all ${embedTab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                title={t.desc}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Description */}
          <div className="rounded-lg bg-muted/30 border border-border p-3">
            {embedTab === "float" && (
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Chat flutuante:</strong> Adiciona um botão no canto inferior direito do seu site.
                Ao clicar, abre o chat do seu agente em uma janela modal. Ideal para blogs, landing pages e sites institucionais.
              </p>
            )}
            {embedTab === "chat" && (
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Chat completo:</strong> Incorpora o chat do agente diretamente no conteúdo da página.
                Recomendado para páginas de contato, suporte ou atendimento. Dimensões ajustáveis (400×600 padrão).
              </p>
            )}
            {embedTab === "shop" && (
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Loja:</strong> Incorpora sua loja completa com todos os produtos, busca e filtros.
                Ocupa 100% da largura disponível. Ideal para páginas principais ou seções de produtos.
              </p>
            )}
          </div>

          {/* Code block */}
          <div className="relative">
            <pre className="rounded-lg border border-border bg-[#0a0a0a] p-4 text-xs font-mono text-muted-foreground overflow-x-auto custom-scrollbar max-h-[200px]">
              <code>{currentEmbedCode}</code>
            </pre>
            <button
              onClick={() => { if (currentEmbedCode) { copy(currentEmbedCode, `embed-${embedTab}`); } }}
              className="absolute top-2 right-2 rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-xs font-medium flex items-center gap-1 hover:bg-primary/90 transition-colors"
            >
              {copied === `embed-${embedTab}` ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied === `embed-${embedTab}` ? "Copiado!" : "Copiar"}
            </button>
          </div>

          {/* Live preview */}
          {embedTab === "chat" && agent?.handle && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Pré-visualização:</p>
              <div className="rounded-lg border border-border overflow-hidden">
                <iframe
                  src={chatUrl}
                  width="400"
                  height="500"
                  frameBorder="0"
                  style={{ border: "none", display: "block", margin: "0 auto" }}
                  title="Preview do chat"
                />
              </div>
            </div>
          )}
          {embedTab === "shop" && agent?.handle && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Pré-visualização:</p>
              <div className="rounded-lg border border-border overflow-hidden">
                <iframe
                  src={shopUrl}
                  width="100%"
                  height="400"
                  frameBorder="0"
                  style={{ border: "none", display: "block" }}
                  title="Preview da loja"
                />
              </div>
            </div>
          )}
          {embedTab === "float" && agent?.handle && (
            <div className="rounded-lg border border-border bg-muted/20 p-6 text-center">
              <p className="text-xs text-muted-foreground mb-3">O botão flutuante aparecerá no canto inferior direito do site onde for incorporado:</p>
              <div className="relative h-32 rounded-lg bg-background border border-border overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">Seu site aqui</div>
                <div className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg animate-pulse-ring">
                  <MessageCircle className="w-5 h-5" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API endpoints (planned) */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Code className="w-4 h-4" /> API (planejada)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { method: "GET", path: "/api/chat/config?handle={handle}", desc: "Config pública do agente" },
            { method: "POST", path: "/api/chat/message", desc: "Enviar mensagem (RAG + LLM)" },
            { method: "GET", path: "/api/chat/products?handle={handle}", desc: "Produtos públicos" },
            { method: "POST", path: "/api/chat/payment", desc: "Upload de comprovante (VLM)" },
            { method: "POST", path: "/api/chat/feedback", desc: "Feedback de mensagem" },
          ].map((e) => (
            <div key={e.path} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-2.5">
              <Badge variant={e.method === "GET" ? "secondary" : "default"} className="text-[10px] w-12 justify-center">{e.method}</Badge>
              <code className="text-xs font-mono flex-1">{e.path}</code>
              <span className="text-xs text-muted-foreground hidden sm:block">{e.desc}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Bell className="w-4 h-4" /> Notificações & Webhook</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <div className="text-sm font-medium">Push (Service Worker)</div>
              <p className="text-xs text-muted-foreground">Notificações no navegador quando há novo comprovante ou lead.</p>
            </div>
            <Badge variant="secondary" className="text-[10px]">Em breve</Badge>
          </div>
          <div className="space-y-2">
            <Label>URL do Webhook externo</Label>
            <div className="flex gap-2">
              <Input value={webhook} onChange={(e) => setWebhook(e.target.value)} placeholder="https://exemplo.com/webhook" />
              <Button variant="outline" onClick={testWebhook}>Testar</Button>
              <Button onClick={saveWebhook}>Salvar</Button>
            </div>
            <p className="text-xs text-muted-foreground">Recebe POST com eventos: novo lead, comprovante pendente, etc.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
