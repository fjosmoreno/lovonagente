"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useFetch, apiPost } from "@/hooks/use-fetch";
import { toast } from "sonner";
import { Check, Loader2, Link2 } from "lucide-react";

const STYLES = [
  { id: "amigavel", label: "Amigável" },
  { id: "profissional", label: "Profissional" },
  { id: "casual", label: "Casual" },
  { id: "tecnico", label: "Técnico" },
  { id: "inspirador", label: "Inspirador" },
  { id: "divertido", label: "Divertido" },
];
const EMOTIONS = [
  { id: "neutro", label: "Neutro" },
  { id: "entusiasta", label: "Entusiasta" },
  { id: "calmo", label: "Calmo" },
];
const CREATIVITY = [
  { id: "baixa", label: "Baixa", desc: "Mais preciso" },
  { id: "media", label: "Média", desc: "Equilibrado" },
  { id: "alta", label: "Alta", desc: "Mais criativo" },
];

// Fields that can be saved via this form
const SAVEABLE_FIELDS = [
  "personaName", "personaRole", "personaDesc", "personaStyle",
  "personaEmotion", "creativity", "languages", "lovonUrl",
];

export function PersonaTab() {
  const { data, refetch } = useFetch<any>("/api/admin/agent");
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // Track the last server-fetched form to avoid clobbering local edits
  const serverForm = useRef<any>(null);
  // Pending changes to save (field -> value)
  const pending = useRef<Record<string, any>>({});
  // Debounce timer
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Whether user is actively editing (prevents refetch from clobbering)
  const isEditing = useRef(false);

  // Initialize form from server data once (or when server data changes and user isn't editing)
  useEffect(() => {
    if (data?.agent) {
      serverForm.current = data.agent;
      // Only update local form if user is NOT actively editing
      // This prevents clobbering unsaved changes when refetch happens
      if (!isEditing.current) {
        setForm(data.agent);
      }
    }
  }, [data]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const save = useCallback(async () => {
    if (!form || !serverForm.current) return;
    // Only send fields that actually changed vs server data
    const changes: Record<string, any> = {};
    for (const f of SAVEABLE_FIELDS) {
      if (pending.current[f] !== undefined && pending.current[f] !== serverForm.current[f]) {
        changes[f] = pending.current[f];
      }
    }
    // Clear pending after snapshotting
    pending.current = {};
    if (Object.keys(changes).length === 0) {
      isEditing.current = false;
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      const res = await apiPost("/api/admin/agent", changes, "PUT");
      // Update server reference with the returned agent (or merge)
      if (res.agent) {
        serverForm.current = res.agent;
        // Only update local form if user stopped editing (no new pending changes)
        if (Object.keys(pending.current).length === 0) {
          isEditing.current = false;
          setForm(res.agent);
        }
      }
      setSaved(true);
      // Silent refetch to sync (won't clobber because isEditing may be false)
      refetch();
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      toast.error(e.message);
      // Restore from server on error
      if (serverForm.current) setForm(serverForm.current);
    } finally {
      setSaving(false);
    }
  }, [form, refetch]);

  function update(field: string, value: any) {
    // Mark as actively editing to prevent refetch clobbering
    isEditing.current = true;
    setForm((f: any) => ({ ...f, [field]: value }));
    // Track pending change
    pending.current[field] = value;
    setSaved(false);
    // Clear existing timer
    if (timer.current) clearTimeout(timer.current);
    // Debounce save
    timer.current = setTimeout(() => save(), 1500);
  }

  if (!form) return <div className="h-64 animate-shimmer rounded-xl" />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3 text-emerald-500" /> : null}
        Auto-save {saving ? "salvando..." : saved ? "salvo" : "ativado"}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Link2 className="w-4 h-4" /> Perfil Lovon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL Lovon</Label>
            <Input value={form.lovonUrl || ""} onChange={(e) => update("lovonUrl", e.target.value)} placeholder="lovon.com.br/seu-nome" />
            {form.handle && <p className="text-xs text-muted-foreground">Handle automático: <Badge variant="secondary">@{form.handle}</Badge></p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Persona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.personaName} onChange={(e) => update("personaName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input value={form.personaRole} onChange={(e) => update("personaRole", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea rows={3} className="max-h-[160px]" value={form.personaDesc || ""} onChange={(e) => update("personaDesc", e.target.value)} placeholder="Descreva quem é seu especialista digital..." />
            <p className="text-[10px] text-muted-foreground">{(form.personaDesc || "").length} caracteres</p>
          </div>

          <div className="space-y-2">
            <Label>Estilo de comunicação</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STYLES.map((s) => (
                <button key={s.id} onClick={() => update("personaStyle", s.id)} className={`rounded-lg border px-3 py-2 text-xs transition-all ${form.personaStyle === s.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Emoção</Label>
              <div className="grid grid-cols-3 gap-2">
                {EMOTIONS.map((s) => (
                  <button key={s.id} onClick={() => update("personaEmotion", s.id)} className={`rounded-lg border px-3 py-2 text-xs transition-all ${form.personaEmotion === s.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Criatividade</Label>
              <div className="grid grid-cols-3 gap-2">
                {CREATIVITY.map((s) => (
                  <button key={s.id} onClick={() => update("creativity", s.id)} className={`rounded-lg border px-3 py-2 text-xs transition-all ${form.creativity === s.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`} title={s.desc}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Idiomas</Label>
            <div className="flex gap-2">
              {["pt", "en", "es"].map((lang) => {
                const active = (form.languages || "pt").split(",").includes(lang);
                return (
                  <button key={lang} onClick={() => {
                    const langs = (form.languages || "pt").split(",").filter(Boolean);
                    const next = active ? langs.filter((l: string) => l !== lang) : [...langs, lang];
                    update("languages", next.join(","));
                  }} className={`rounded-lg border px-4 py-2 text-xs uppercase transition-all ${active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
