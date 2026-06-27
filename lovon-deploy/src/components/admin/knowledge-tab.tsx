"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useFetch, apiPost } from "@/hooks/use-fetch";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, FileText, Link2, HelpCircle, FileBox } from "lucide-react";

const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  url: { label: "URL Lovon", icon: Link2, color: "text-blue-500" },
  pdf: { label: "PDF", icon: FileBox, color: "text-red-500" },
  faq: { label: "FAQ", icon: HelpCircle, color: "text-purple-500" },
  text: { label: "Texto", icon: FileText, color: "text-emerald-500" },
};

export function KnowledgeTab() {
  const { data, loading, refetch } = useFetch<any>("/api/admin/knowledge");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ type: "text", title: "", content: "", faqQ: "", faqA: "" });

  function openNew(type = "text") {
    setEditing(null);
    setForm({ type, title: "", content: "", faqQ: "", faqA: "" });
    setOpen(true);
  }
  function openEdit(s: any) {
    setEditing(s);
    setForm({ type: s.type, title: s.title, content: s.content || "", faqQ: s.faqQ || "", faqA: s.faqA || "" });
    setOpen(true);
  }

  async function save() {
    try {
      if (editing) {
        await apiPost("/api/admin/knowledge", { id: editing.id, ...form }, "PUT");
      } else {
        await apiPost("/api/admin/knowledge", form);
      }
      toast.success(editing ? "Atualizado" : "Adicionado");
      setOpen(false);
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta fonte?")) return;
    try {
      await apiPost(`/api/admin/knowledge?id=${id}`, {}, "DELETE");
      toast.success("Excluído");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("PDF máximo 2MB"); return; }
    const buf = await file.arrayBuffer();
    const text = new TextDecoder().decode(buf).slice(0, 8000);
    setEditing(null);
    setForm({ type: "pdf", title: file.name, content: text || "[PDF binário - extração limitada]", faqQ: "", faqA: "" });
    setOpen(true);
    toast.success("PDF carregado - edite o conteúdo extraído");
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Type selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(TYPE_META).map(([type, meta]) => (
          <button key={type} onClick={() => type === "pdf" ? document.getElementById("pdf-upload")?.click() : openNew(type)} className="rounded-xl border border-border bg-card p-4 text-center hover:border-primary/50 hover:bg-accent transition-all group">
            <meta.icon className={`w-6 h-6 mx-auto mb-2 ${meta.color} group-hover:scale-110 transition-transform`} />
            <div className="text-xs font-medium">{meta.label}</div>
          </button>
        ))}
        <input id="pdf-upload" type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 animate-shimmer rounded-lg" />)}</div>
          ) : !data?.sources?.length ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">Nenhuma fonte de conhecimento ainda.</p>
              <p className="text-xs text-muted-foreground mt-1">Adicione URLs, PDFs, FAQs ou textos para alimentar seu agente.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.sources.map((s: any) => {
                const meta = TYPE_META[s.type] || TYPE_META.text;
                return (
                  <div key={s.id} className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors">
                    <div className={`w-9 h-9 rounded-lg bg-muted flex items-center justify-center ${meta.color}`}>
                      <meta.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{s.title}</span>
                        <Badge variant="secondary" className="text-[10px]">{meta.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {s.type === "faq" ? `Q: ${s.faqQ}` : (s.content || "").slice(0, 100)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => remove(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar fonte" : "Nova fonte"} — {TYPE_META[form.type]?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título da fonte" />
            </div>
            {form.type === "faq" ? (
              <>
                <div className="space-y-2">
                  <Label>Pergunta</Label>
                  <Input value={form.faqQ} onChange={(e) => setForm({ ...form, faqQ: e.target.value })} placeholder="O que o usuário pergunta?" />
                </div>
                <div className="space-y-2">
                  <Label>Resposta <span className="text-muted-foreground">({form.faqA.length} caracteres)</span></Label>
                  <Textarea rows={4} className="max-h-[160px]" value={form.faqA} onChange={(e) => setForm({ ...form, faqA: e.target.value })} placeholder="Resposta da FAQ" />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label>Conteúdo <span className="text-muted-foreground">({form.content.length} caracteres)</span></Label>
                <Textarea rows={8} className="max-h-[240px]" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Cole o conteúdo aqui..." />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
