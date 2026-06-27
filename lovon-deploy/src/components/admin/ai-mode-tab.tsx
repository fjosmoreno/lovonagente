"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Lock, GitMerge, Building2, Target } from "lucide-react";
import { useFetch, apiPost } from "@/hooks/use-fetch";
import { toast } from "sonner";

const MODES = [
  { id: "restrito", label: "Restrito", icon: Lock, desc: "Responde APENAS com a base de conhecimento. Anti-alucinação máximo." },
  { id: "hibrido", label: "Híbrido", icon: GitMerge, desc: "Base de conhecimento + um pouco de personalidade da IA." },
  { id: "corporativo", label: "Corporativo", icon: Building2, desc: "Tom institucional, mantém foco nas informações oficiais." },
];

export function AiModeTab() {
  const { data, refetch } = useFetch<any>("/api/admin/agent");
  const [form, setForm] = useState<any>(null);

  useEffect(() => { if (data?.agent) setForm(data.agent); }, [data]);

  async function update(field: string, value: any) {
    setForm((f: any) => ({ ...f, [field]: value }));
    try { await apiPost("/api/admin/agent", { [field]: value }, "PUT"); refetch(); toast.success("Salvo"); } catch (e: any) { toast.error(e.message); }
  }

  if (!form) return <div className="h-64 animate-shimmer rounded-xl" />;

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader><CardTitle className="text-sm">Modo de IA</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => update("aiMode", m.id)} className={`w-full flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${form.aiMode === m.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent"}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${form.aiMode === m.id ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                <m.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm flex items-center gap-2">{m.label} {form.aiMode === m.id && <span className="w-2 h-2 rounded-full bg-primary" />}</div>
                <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4" /> Captura de Leads</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Capturar leads automaticamente</Label>
              <p className="text-xs text-muted-foreground mt-1">Coleta nome e WhatsApp de visitantes interessados com score automático.</p>
            </div>
            <Switch checked={form.leadCapture} onCheckedChange={(v) => update("leadCapture", v)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
