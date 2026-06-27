"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useFetch, apiPost } from "@/hooks/use-fetch";
import { toast } from "sonner";
import { Upload, Check, Loader2 } from "lucide-react";
import { isBase64UnderSize, isValidHex, shadeColor } from "@/lib/lovon-utils";

const PRESETS = ["#FF6600", "#a855f7", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#06b6d4"];

export function VisualTab() {
  const { data, refetch } = useFetch<any>("/api/admin/agent");
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (data?.agent) setForm(data.agent); }, [data]);

  async function save(partial: any) {
    if (!form) return;
    setSaving(true);
    try {
      await apiPost("/api/admin/agent", partial, "PUT");
      setSaved(true);
      refetch();
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>, field: string, maxMB: number) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxMB * 1024 * 1024) { toast.error(`Máximo ${maxMB}MB`); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (!isBase64UnderSize(base64, maxMB)) { toast.error(`Imagem muito grande`); return; }
      setForm((f: any) => ({ ...f, [field]: base64 }));
      save({ [field]: base64 });
    };
    reader.readAsDataURL(file);
  }

  if (!form) return <div className="h-64 animate-shimmer rounded-xl" />;

  const previewColor = form.primaryColor || "#FF6600";

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader><CardTitle className="text-sm">Cor primária</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((c) => (
              <button key={c} onClick={() => { setForm({ ...form, primaryColor: c }); save({ primaryColor: c }); }} className={`w-9 h-9 rounded-lg ring-2 transition-all ${form.primaryColor === c ? "ring-foreground scale-110" : "ring-transparent hover:scale-105"}`} style={{ background: c }} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input type="color" value={previewColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} onBlur={(e) => isValidHex(e.target.value) && save({ primaryColor: e.target.value })} className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border border-border" />
            <Input value={previewColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} onBlur={() => isValidHex(form.primaryColor) && save({ primaryColor: form.primaryColor })} className="max-w-[140px] font-mono" />
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4 text-emerald-500" /> : null}
          </div>

          {/* Header preview */}
          <div className="rounded-xl overflow-hidden border border-border">
            <div className="h-20 flex items-center gap-3 px-4" style={{ background: `linear-gradient(135deg, ${previewColor}, ${shadeColor(previewColor, -15)})` }}>
              <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur flex items-center justify-center text-white font-bold ring-2 ring-white/30">
                {form.avatarBase64 ? <img src={form.avatarBase64} alt="" className="w-full h-full rounded-full object-cover" /> : form.personaName?.[0] || "L"}
              </div>
              <div className="text-white">
                <div className="font-bold text-sm">{form.personaName}</div>
                <div className="text-xs opacity-90">{form.personaRole}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Tema forçado</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {["system", "dark", "light"].map((t) => (
              <button key={t} onClick={() => { setForm({ ...form, forcedTheme: t }); save({ forcedTheme: t }); }} className={`rounded-lg border px-4 py-2 text-xs capitalize transition-all ${form.forcedTheme === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>
                {t === "system" ? "Sistema" : t === "dark" ? "Escuro" : "Claro"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Avatar</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-4 ring-primary/20" style={{ boxShadow: `0 0 30px ${previewColor}40` }}>
                {form.avatarBase64 ? <img src={form.avatarBase64} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl font-bold">{form.personaName?.[0] || "L"}</span>}
              </div>
            </div>
            <div>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e, "avatarBase64", 2)} />
              <Button variant="outline" size="sm" onClick={() => avatarRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> Upload avatar</Button>
              <p className="text-xs text-muted-foreground mt-1">PNG/JPG até 2MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Loja pública</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Imagem hero</Label>
            <div className="flex items-center gap-3">
              <div className="w-32 h-16 rounded-lg bg-muted overflow-hidden border border-border">
                {form.heroImage ? <img src={form.heroImage} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Sem imagem</div>}
              </div>
              <input ref={heroRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e, "heroImage", 2)} />
              <Button variant="outline" size="sm" onClick={() => heroRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> Upload</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Subtítulo da loja <span className="text-muted-foreground">({(form.widgetText || "").length}/60)</span></Label>
            <Textarea rows={2} className="max-h-[100px]" maxLength={60} value={form.widgetText || ""} onChange={(e) => setForm({ ...form, widgetText: e.target.value })} onBlur={() => save({ widgetText: form.widgetText })} placeholder="Ex: Produtos selecionados para você" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
