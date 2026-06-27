"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFetch, apiPost } from "@/hooks/use-fetch";
import { toast } from "sonner";
import { Check, X, ScanLine, Loader2, Clock, ShieldCheck } from "lucide-react";
import { formatDateBR } from "@/lib/lovon-utils";

export function PaymentsTab() {
  const { data, refetch } = useFetch<any>("/api/admin/agent");
  const { data: proofData, refetch: refetchProofs } = useFetch<any>("/api/admin/payments");
  const [form, setForm] = useState<any>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [previewProof, setPreviewProof] = useState<any>(null);

  useEffect(() => { if (data?.agent) setForm(data.agent); }, [data]);

  async function save() {
    if (!form) return;
    try {
      await apiPost("/api/admin/agent", {
        pixEnabled: form.pixEnabled, pixAmount: form.pixAmount, pixKey: form.pixKey,
        pixReceiverName: form.pixReceiverName, pixBank: form.pixBank, pixWhatsapp: form.pixWhatsapp,
        pixSuccessMsg: form.pixSuccessMsg, pixInstructions: form.pixInstructions,
      }, "PUT");
      refetch();
      toast.success("Configurações PIX salvas");
    } catch (e: any) { toast.error(e.message); }
  }

  async function verifyProof(id: string) {
    setVerifying(id);
    try {
      const res = await apiPost("/api/admin/payments", { id }, "POST");
      toast.success(`Análise VLM: ${res.result.isValid ? "Válido" : "Inconclusivo"} (confiança: ${res.result.confidence})`);
      refetchProofs();
    } catch (e: any) { toast.error(e.message); }
    finally { setVerifying(null); }
  }

  async function review(id: string, action: "approve" | "reject") {
    try {
      await apiPost("/api/admin/payments", { id, action }, "PUT");
      toast.success(action === "approve" ? "Aprovado" : "Rejeitado");
      refetchProofs();
    } catch (e: any) { toast.error(e.message); }
  }

  if (!form) return <div className="h-64 animate-shimmer rounded-xl" />;

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Configuração PIX</CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Ativo</Label>
              <Switch checked={form.pixEnabled} onCheckedChange={(v) => setForm({ ...form, pixEnabled: v })} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={form.pixAmount || ""} onChange={(e) => setForm({ ...form, pixAmount: Number(e.target.value) })} placeholder="49.90" />
            </div>
            <div className="space-y-2">
              <Label>Chave PIX</Label>
              <Input value={form.pixKey || ""} onChange={(e) => setForm({ ...form, pixKey: e.target.value })} placeholder="email@exemplo.com ou +5511999999999" />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nome do recebedor</Label>
              <Input value={form.pixReceiverName || ""} onChange={(e) => setForm({ ...form, pixReceiverName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Banco</Label>
              <Input value={form.pixBank || ""} onChange={(e) => setForm({ ...form, pixBank: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp (liberação)</Label>
              <Input value={form.pixWhatsapp || ""} onChange={(e) => setForm({ ...form, pixWhatsapp: e.target.value })} placeholder="+5511999999999" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Instruções <span className="text-muted-foreground text-xs">({"{valor}, {chave}, {nome}"})</span></Label>
            <Textarea rows={2} className="max-h-[120px]" value={form.pixInstructions || ""} onChange={(e) => setForm({ ...form, pixInstructions: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Mensagem de sucesso <span className="text-muted-foreground text-xs">({"{whatsapp}"})</span></Label>
            <Textarea rows={2} className="max-h-[120px]" value={form.pixSuccessMsg || ""} onChange={(e) => setForm({ ...form, pixSuccessMsg: e.target.value })} />
          </div>
          <Button onClick={save}>Salvar configurações</Button>
        </CardContent>
      </Card>

      {/* Pending proofs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" /> Comprovantes
            {proofData?.proofs?.filter((p: any) => p.status === "pendente").length > 0 && (
              <Badge className="animate-pulse">{proofData.proofs.filter((p: any) => p.status === "pendente").length} pendente(s)</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!proofData?.proofs?.length ? (
            <div className="p-12 text-center">
              <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">Nenhum comprovante recebido ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto custom-scrollbar">
              {proofData.proofs.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 p-4">
                  <img src={p.imageBase64} alt="comprovante" className="w-16 h-16 rounded-lg object-cover border border-border cursor-pointer hover:scale-105 transition-transform" onClick={() => setPreviewProof(p)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{p.leadName || "Visitante"}</span>
                      <Badge variant={p.status === "aprovado" ? "default" : p.status === "rejeitado" ? "destructive" : "secondary"} className="text-[10px]">{p.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.amount != null ? `R$ ${p.amount}` : "Valor não detectado"} • {p.bank || "Banco não detectado"} • {formatDateBR(p.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {p.status === "pendente" && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => verifyProof(p.id)} disabled={verifying === p.id} title="Analisar com VLM">
                          {verifying === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanLine className="w-3.5 h-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-emerald-500" onClick={() => review(p.id, "approve")}><Check className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => review(p.id, "reject")}><X className="w-3.5 h-3.5" /></Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {previewProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewProof(null)}>
          <div className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <img src={previewProof.imageBase64} alt="comprovante" className="w-full rounded-lg" />
            <div className="mt-3 rounded-lg border border-border bg-card p-4 text-xs space-y-1">
              <div className="font-semibold mb-2">Dados extraídos (VLM):</div>
              <div>Valor: {previewProof.amount != null ? `R$ ${previewProof.amount}` : "—"}</div>
              <div>Recebedor: {previewProof.receiver || "—"}</div>
              <div>Chave: {previewProof.pixKey || "—"}</div>
              <div>Transação: {previewProof.transaction || "—"}</div>
              <div>Banco: {previewProof.bank || "—"}</div>
              <div>Data: {previewProof.paidAt || "—"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
