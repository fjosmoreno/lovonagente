"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useFetch, apiPost } from "@/hooks/use-fetch";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Star, Upload, ExternalLink, Sparkles, Loader2 } from "lucide-react";

export function ProductsTab() {
  const { data, loading, refetch } = useFetch<any>("/api/admin/products");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const empty = { name: "", description: "", price: "", comparePrice: "", category: "", badge: "", rating: "0", reviewCount: "0", featured: false, active: true, imageBase64: "", externalUrl: "" };
  const [form, setForm] = useState<any>(empty);

  async function generateImage(productId?: string) {
    const id = productId || editing?.id;
    if (!id) { toast.error("Salve o produto primeiro para gerar a imagem"); return; }
    setGeneratingId(id);
    try {
      const res = await fetch("/api/admin/products/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success("Imagem gerada com IA!");
      if (editing?.id === id) setForm((f: any) => ({ ...f, imageBase64: d.imageBase64 }));
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGeneratingId(null);
    }
  }

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(p: any) { setEditing(p); setForm({ ...p, price: String(p.price), comparePrice: p.comparePrice ? String(p.comparePrice) : "", rating: String(p.rating), reviewCount: String(p.reviewCount) }); setOpen(true); }

  async function save() {
    try {
      const payload = { ...form, price: Number(form.price), comparePrice: form.comparePrice ? Number(form.comparePrice) : null, rating: Number(form.rating), reviewCount: Number(form.reviewCount) };
      if (editing) await apiPost("/api/admin/products", { id: editing.id, ...payload }, "PUT");
      else await apiPost("/api/admin/products", payload);
      toast.success(editing ? "Atualizado" : "Criado");
      setOpen(false);
      refetch();
    } catch (e: any) { toast.error(e.message); }
  }

  async function toggle(id: string, active: boolean) {
    try { await apiPost("/api/admin/products", { id, active }, "PUT"); refetch(); } catch (e: any) { toast.error(e.message); }
  }

  async function remove(id: string) {
    if (!confirm("Excluir produto?")) return;
    try { await apiPost(`/api/admin/products?id=${id}`, {}, "DELETE"); toast.success("Excluído"); refetch(); } catch (e: any) { toast.error(e.message); }
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Máximo 2MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((f: any) => ({ ...f, imageBase64: reader.result }));
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.products?.length || 0} produto(s)</p>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Novo produto</Button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-64 animate-shimmer rounded-xl" />)}</div>
      ) : !data?.products?.length ? (
        <Card><CardContent className="p-12 text-center">
          <p className="text-sm text-muted-foreground mb-3">Nenhum produto ainda.</p>
          <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Adicionar primeiro produto</Button>
        </CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.products.map((p: any) => (
            <Card key={p.id} className={`overflow-hidden group ${!p.active ? "opacity-50" : ""}`}>
              <div className="aspect-video bg-muted relative">
                {p.imageBase64 ? (
                  <img src={p.imageBase64} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <button onClick={() => generateImage(p.id)} disabled={generatingId === p.id} className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50">
                    {generatingId === p.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    <span className="text-xs">{generatingId === p.id ? "Gerando..." : "Gerar com IA"}</span>
                  </button>
                )}
                {p.featured && <Badge className="absolute top-2 left-2">Destaque</Badge>}
                {p.badge && <Badge variant="secondary" className="absolute top-2 right-2">{p.badge}</Badge>}
                {p.imageBase64 && (
                  <button onClick={() => generateImage(p.id)} disabled={generatingId === p.id} className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 disabled:opacity-50" title="Gerar nova imagem">
                    {generatingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{p.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span className="text-xs text-muted-foreground">{p.rating} ({p.reviewCount})</span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="font-bold text-sm">R$ {p.price.toFixed(2)}</span>
                      {p.comparePrice && <span className="text-xs text-muted-foreground line-through">R$ {p.comparePrice.toFixed(2)}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Edit2 className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => remove(p.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <span className="text-[10px] text-muted-foreground">{p.category || "—"}</span>
                  <Switch checked={p.active} onCheckedChange={(v) => toggle(p.id, v)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg custom-scrollbar">
          <DialogHeader><DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-24 h-24 rounded-lg bg-muted overflow-hidden border border-border shrink-0">
                {form.imageBase64 ? <img src={form.imageBase64} alt={form.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Img</div>}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <input type="file" accept="image/*" className="hidden" id="prod-img" onChange={handleImage} />
                <Button variant="outline" size="sm" onClick={() => document.getElementById("prod-img")?.click()}><Upload className="w-4 h-4 mr-1" /> Upload</Button>
                <Button variant="outline" size="sm" onClick={() => generateImage()} disabled={generatingId === editing?.id || !editing}>
                  {generatingId === editing?.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                  Gerar com IA
                </Button>
                {!editing && <p className="text-[10px] text-muted-foreground">Salve o produto para gerar imagem com IA</p>}
              </div>
            </div>
            <div className="space-y-1"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1"><Label>Descrição</Label><Textarea rows={2} className="max-h-[120px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Preço</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div className="space-y-1"><Label>Preço comparação</Label><Input type="number" step="0.01" value={form.comparePrice} onChange={(e) => setForm({ ...form, comparePrice: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Categoria</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div className="space-y-1"><Label>Badge</Label><Input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="Novo, Promo..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Rating (0-5)</Label><Input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></div>
              <div className="space-y-1"><Label>Avaliações</Label><Input type="number" value={form.reviewCount} onChange={(e) => setForm({ ...form, reviewCount: e.target.value })} /></div>
            </div>
            <div className="space-y-1"><Label>URL externa</Label><Input value={form.externalUrl} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} placeholder="https://..." /></div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs"><Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} /> Destaque</label>
              <label className="flex items-center gap-2 text-xs"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /> Ativo</label>
            </div>
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
