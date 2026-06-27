"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowRight, FormInput, CreditCard, Upload, CheckCircle, Phone } from "lucide-react";
import { useFetch, apiPost } from "@/hooks/use-fetch";
import { toast } from "sonner";

export function VipTab() {
  const { data, refetch } = useFetch<any>("/api/admin/agent");
  const [form, setForm] = useState<any>(null);

  useEffect(() => { if (data?.agent) setForm(data.agent); }, [data]);

  async function save() {
    try {
      await apiPost("/api/admin/agent", { vipEnabled: form.vipEnabled, vipTriggerMsg: form.vipTriggerMsg, vipPhrase: form.vipPhrase }, "PUT");
      refetch();
      toast.success("Configurações VIP salvas");
    } catch (e: any) { toast.error(e.message); }
  }

  if (!form) return <div className="h-64 animate-shimmer rounded-xl" />;

  const flow = [
    { icon: MessageSquare, label: "Mensagem do usuário", desc: "Visitante interage no chat" },
    { icon: ArrowRight, label: "Frase gatilho", desc: "Detecta intenção VIP" },
    { icon: FormInput, label: "Formulário", desc: "Coleta nome + WhatsApp" },
    { icon: CreditCard, label: "PIX", desc: "Instruções de pagamento" },
    { icon: Upload, label: "Upload comprovante", desc: "Visitante envia imagem" },
    { icon: CheckCircle, label: "Aprovação VLM", desc: "IA verifica o comprovante" },
    { icon: Phone, label: "WhatsApp liberado", desc: "Contato liberado" },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Conteúdo VIP</CardTitle>
            <Switch checked={form.vipEnabled} onCheckedChange={(v) => setForm({ ...form, vipEnabled: v })} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mensagem de apresentação VIP</Label>
            <Textarea rows={3} className="max-h-[160px]" value={form.vipTriggerMsg || ""} onChange={(e) => setForm({ ...form, vipTriggerMsg: e.target.value })} placeholder="Olá! Tenho um conteúdo exclusivo..." />
          </div>
          <div className="space-y-2">
            <Label>Frase gatilho</Label>
            <Input value={form.vipPhrase || ""} onChange={(e) => setForm({ ...form, vipPhrase: e.target.value })} placeholder="quero vip" />
            <p className="text-xs text-muted-foreground">Quando o visitante digitar esta frase, o fluxo VIP é iniciado.</p>
          </div>
          <Button onClick={save}>Salvar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Fluxo visual</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {flow.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="rounded-lg border border-border bg-card p-3 text-center min-w-[110px]">
                  <f.icon className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                  <div className="text-xs font-medium">{f.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</div>
                </div>
                {i < flow.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
