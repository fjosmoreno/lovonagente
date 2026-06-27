"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Check, X, Sparkles, Shield, Zap, MessageSquare, Store, Loader2, Mail, Lock, User, Link, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const LOVON_DOMAINS = ["lovon.com.br", "lovon.bio", "lovon.com"];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ValidationIcon({ ok }: { ok: boolean | null }) {
  if (ok === null) return null;
  return ok ? (
    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
  ) : (
    <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
  );
}

const features = [
  { icon: Shield, title: "IA Anti-Alucinação", desc: "Respostas baseadas apenas na sua base de conhecimento (RAG)" },
  { icon: Store, title: "Loja Visual Integrada", desc: "Venda produtos com catálogo profissional e pagamentos PIX" },
  { icon: Zap, title: "Verificação PIX por VLM", desc: "Comprovantes analisados por IA visual em segundos" },
  { icon: MessageSquare, title: "Liberação de WhatsApp", desc: "Contato liberado automaticamente após pagamento" },
];

const stats = [
  { value: "2.4k", label: "Especialistas criados" },
  { value: "98%", label: "Precisão RAG" },
  { value: "<3s", label: "Resposta média" },
  { value: "24/7", label: "Disponível sempre" },
];

export function LoginView() {
  const router = useRouter();
  const [tab, setTab] = useState("login");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const [loginHandle, setLoginHandle] = useState("");
  const [loginPwd, setLoginPwd] = useState("");

  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPwd, setRPwd] = useState("");
  const [rConfirm, setRConfirm] = useState("");
  const [rUrl, setRUrl] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPreview, setForgotPreview] = useState<any>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: loginHandle, password: loginPwd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Bem-vindo de volta!");
      // Force full reload so server component re-reads session cookie
      setTimeout(() => window.location.reload(), 200);
    } catch (err: any) {
      toast.error(err.message || "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: rName, email: rEmail, password: rPwd, confirm: rConfirm, lovonUrl: rUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Conta criada! Código de verificação: " + data.verifyCode);
      setTimeout(() => window.location.reload(), 200);
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForgotPreview(data.preview);
      toast.success("Email de recuperação enviado (preview abaixo)");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const emailValid = rEmail === "" ? null : emailRegex.test(rEmail);
  const pwdValid = rPwd === "" ? null : rPwd.length >= 6;
  const confirmValid = rConfirm === "" ? null : rConfirm === rPwd && rConfirm.length >= 6;
  const urlValid = rUrl === "" ? null : LOVON_DOMAINS.some((d) => rUrl.toLowerCase().includes(d));

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* LEFT - Branding */}
      <div className="relative hidden md:flex md:w-1/2 flex-col justify-between overflow-hidden bg-[#070707] p-10 lg:p-14">
        {/* Aurora blobs */}
        <div className="aurora-blob animate-aurora-drift bg-emerald-500/40 w-[420px] h-[420px] -top-20 -left-20" />
        <div className="aurora-blob animate-aurora-drift delay-500 bg-blue-500/30 w-[380px] h-[380px] top-1/3 -right-24" />
        <div className="aurora-blob animate-aurora-drift delay-1000 bg-purple-500/30 w-[360px] h-[360px] bottom-0 left-1/4" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Spotlight sweep */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-32 h-[200%] bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-spotlight-sweep" />
        </div>
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12 animate-cinematic-in">
            <div className="relative">
              <img
                src="/lovon-icon.jpg"
                alt="Lovon"
                className="w-16 h-16 rounded-2xl object-cover ring-1 ring-white/10 animate-logo-aura"
              />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">Lovon</div>
              <div className="text-xs text-muted-foreground">Agente</div>
            </div>
          </div>

          <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] mb-4 animate-text-glow">
            Crie seu<br />
            <span className="gradient-text">especialista digital</span>
          </h1>
          <h2 className="text-lg text-muted-foreground mb-10 max-w-md animate-text-shimmer">
            IA que responde, vende e libera acesso — tudo em um agente
          </h2>

          <div className="space-y-4 max-w-md">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group flex items-start gap-3 animate-reveal-feature rounded-lg p-2 -m-2 hover:bg-white/[0.02] transition-colors"
                style={{ animationDelay: `${0.2 + i * 0.12}s` }}
              >
                <div className="mt-0.5 w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <f.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{f.title}</div>
                  <div className="text-xs text-muted-foreground">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial quote */}
          <div className="mt-8 max-w-md rounded-xl border border-border/40 bg-white/[0.02] backdrop-blur-sm p-4 animate-fade-in-up" style={{ animationDelay: "1.2s" }}>
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-foreground/80 italic mb-2">
              "Em 2 semanas meu agente respondeu 340 perguntas e fechou 18 vendas — sozinho."
            </p>
            <p className="text-xs text-muted-foreground">— Marina Souza, Coach de Carreira</p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-4 gap-3 mt-12">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="group rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-3 text-center animate-stat-glow hover:border-primary/40 hover:bg-card/60 transition-all"
              style={{ animationDelay: `${1 + i * 0.15}s` }}
            >
              <div className="text-xl font-black gradient-text group-hover:scale-110 transition-transform">{s.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="relative z-10 mt-8">
          <div className="h-px w-full animate-light-line" />
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <span>© 2025 Lovon Agente</span>
            <a href="https://lovon.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> lovon.com.br
            </a>
          </div>
        </div>
      </div>

      {/* RIGHT - Auth card */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 bg-background">
        <div className="w-full max-w-md">
          <div className="flex md:hidden items-center gap-3 mb-8 justify-center">
            <img
              src="/lovon-icon.jpg"
              alt="Lovon"
              className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10"
            />
            <div className="text-lg font-bold">Lovon Agente</div>
          </div>

          <div className="glass rounded-2xl p-6 md:p-8 shadow-2xl">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lh">Handle Lovon ou Email</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="lh" className="pl-9" placeholder="seu-handle ou email@exemplo.com" value={loginHandle} onChange={(e) => setLoginHandle(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lp">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="lp" type={showPwd ? "text" : "password"} className="pl-9 pr-9" placeholder="••••••" value={loginPwd} onChange={(e) => setLoginPwd(e.target.value)} required />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
                  </Button>
                  <button type="button" onClick={() => setForgotOpen(true)} className="w-full text-xs text-muted-foreground hover:text-primary transition-colors">
                    Esqueci minha senha
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div className="space-y-2">
                    <Label htmlFor="rn">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="rn" className="pl-9" placeholder="Seu nome" value={rName} onChange={(e) => setRName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="re">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="re" type="email" className={`pl-9 ${emailValid === false ? "border-red-500" : emailValid ? "border-emerald-500" : ""}`} placeholder="email@exemplo.com" value={rEmail} onChange={(e) => setREmail(e.target.value)} required />
                      <ValidationIcon ok={emailValid} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rp">Senha {pwdValid && <span className="text-emerald-500 text-xs">• mín. 6 caracteres</span>}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="rp" type={showPwd ? "text" : "password"} className={`pl-9 pr-9 ${pwdValid === false ? "border-red-500" : pwdValid ? "border-emerald-500" : ""}`} placeholder="••••••" value={rPwd} onChange={(e) => setRPwd(e.target.value)} required />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rc">Confirmar senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="rc" type={showPwd ? "text" : "password"} className={`pl-9 ${confirmValid === false ? "border-red-500" : confirmValid ? "border-emerald-500" : ""}`} placeholder="••••••" value={rConfirm} onChange={(e) => setRConfirm(e.target.value)} required />
                      <ValidationIcon ok={confirmValid} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ru">URL Lovon</Label>
                    <div className="relative">
                      <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="ru" className={`pl-9 ${urlValid === false ? "border-red-500" : urlValid ? "border-emerald-500" : ""}`} placeholder="lovon.com.br/seu-nome" value={rUrl} onChange={(e) => setRUrl(e.target.value)} required />
                      <ValidationIcon ok={urlValid} />
                    </div>
                    {urlValid === false && <p className="text-xs text-red-500">Use lovon.com.br, lovon.bio ou lovon.com</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Ao continuar, você concorda com os Termos e a Política de Privacidade.
          </p>
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recuperar senha</DialogTitle>
            <DialogDescription>Digite seu email. Enviaremos um link de recuperação.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgot} className="space-y-4">
            <Input type="email" placeholder="email@exemplo.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
            {forgotPreview && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
                <div className="font-semibold mb-1">Preview (Ethereal)</div>
                <div className="text-muted-foreground">Para: {forgotPreview.to}</div>
                <div className="text-muted-foreground">Código: <span className="font-mono text-primary">{forgotPreview.code}</span></div>
                <div className="text-muted-foreground mt-1">{forgotPreview.note}</div>
              </div>
            )}
            <DialogFooter>
              <Button type="submit">Enviar link</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
