"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFetch } from "@/hooks/use-fetch";
import { Download, Trash2, ThumbsUp, ThumbsDown, FileText, MessagesSquare, Search } from "lucide-react";
import { formatDateBR } from "@/lib/lovon-utils";

export function ConversationsTab() {
  const { data, loading, refetch } = useFetch<any>("/api/admin/conversations");
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { data: detail } = useFetch<any>(selected ? `/api/admin/conversations?id=${selected}` : null);

  function exportPDF(c: any) {
    if (typeof window === "undefined") return;
    import("jspdf").then(({ jsPDF }: any) => {
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text(`Conversa - ${c.visitorId}`, 14, 18);
      doc.setFontSize(9);
      doc.text(`Início: ${formatDateBR(c.startedAt)}`, 14, 26);
      let y = 36;
      (detail?.conversation?.messages || []).forEach((m: any) => {
        const role = m.role === "user" ? "Visitante" : "Agente";
        const lines = doc.splitTextToSize(`[${role}] ${m.content}`, 180);
        if (y + lines.length * 6 > 280) { doc.addPage(); y = 20; }
        doc.text(lines, 14, y);
        y += lines.length * 6 + 2;
      });
      doc.save(`conversa-${c.visitorId}.pdf`);
    });
  }

  const conversations = data?.conversations || [];
  const filtered = search
    ? conversations.filter((c: any) =>
        c.visitorId.toLowerCase().includes(search.toLowerCase()) ||
        (c.messages?.[0]?.content || "").toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  if (loading) return <div className="h-64 animate-shimmer rounded-xl" />;

  return (
    <div className="grid md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-8rem)]">
      <Card className="flex flex-col">
        <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
          {/* Search bar */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar conversas..." className="h-8 pl-8 text-xs" />
            </div>
            <div className="text-[10px] text-muted-foreground mt-2 px-1">{filtered.length} de {conversations.length} conversa(s)</div>
          </div>
          <ScrollArea className="flex-1">
            {!conversations.length ? (
              <div className="p-8 text-center">
                <MessagesSquare className="w-10 h-10 mx-auto text-muted-foreground mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">Nenhuma conversa ainda.</p>
              </div>
            ) : !filtered.length ? (
              <div className="p-8 text-center">
                <Search className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                <p className="text-xs text-muted-foreground">Nenhuma conversa encontrada para "{search}".</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((c: any) => (
                  <button key={c.id} onClick={() => setSelected(c.id)} className={`w-full text-left p-3 hover:bg-accent transition-colors ${selected === c.id ? "bg-accent border-l-2 border-l-primary" : ""}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate">{c.visitorId}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(c.lastMsgAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">{c.messages?.[0]?.content || "—"}</p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">Selecione uma conversa para ver os detalhes.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{detail?.conversation?.visitorId || "..."}</div>
                  <div className="text-xs text-muted-foreground">{detail?.conversation && formatDateBR(detail.conversation.startedAt)}</div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => detail?.conversation && exportPDF(detail.conversation)} title="Exportar PDF"><Download className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {detail?.conversation?.messages?.map((m: any) => (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${m.role === "user" ? "bg-muted" : "bg-primary text-primary-foreground"}`}>
                        <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] opacity-70">{new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                          {m.feedback && (m.feedback === "up" ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />)}
                        </div>
                        {m.sources && m.sources !== "[]" && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {JSON.parse(m.sources).map((s: any, i: number) => (
                              <Badge key={i} variant="secondary" className="text-[9px]">{s.title}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
