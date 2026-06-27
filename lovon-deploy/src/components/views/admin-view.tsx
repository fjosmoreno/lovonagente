"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, UserCircle, BookOpen, Palette, BrainCircuit, CreditCard, Package,
  Crown, Users, MessagesSquare, Plug, Search, Bell, Moon, Sun, Share2, ExternalLink,
  ChevronDown, LogOut, Menu, Keyboard, X, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useFetch, apiPost } from "@/hooks/use-fetch";
import { AnalyticsTab } from "@/components/admin/analytics-tab";
import { PersonaTab } from "@/components/admin/persona-tab";
import { KnowledgeTab } from "@/components/admin/knowledge-tab";
import { VisualTab } from "@/components/admin/visual-tab";
import { AiModeTab } from "@/components/admin/ai-mode-tab";
import { PaymentsTab } from "@/components/admin/payments-tab";
import { ProductsTab } from "@/components/admin/products-tab";
import { VipTab } from "@/components/admin/vip-tab";
import { LeadsTab } from "@/components/admin/leads-tab";
import { ConversationsTab } from "@/components/admin/conversations-tab";
import { IntegrationsTab } from "@/components/admin/integrations-tab";

const TABS = [
  { id: "analytics", label: "Analytics", icon: LayoutDashboard, desc: "Visão geral do seu agente" },
  { id: "persona", label: "Lovon & Persona", icon: UserCircle, desc: "Perfil e personalidade do agente" },
  { id: "knowledge", label: "Conhecimento", icon: BookOpen, desc: "Base de conhecimento (RAG)" },
  { id: "visual", label: "Visual", icon: Palette, desc: "Cores, avatar e tema" },
  { id: "ai", label: "Modo IA", icon: BrainCircuit, desc: "Comportamento da IA" },
  { id: "payments", label: "Pagamentos", icon: CreditCard, desc: "PIX e comprovantes" },
  { id: "products", label: "Produtos", icon: Package, desc: "Catálogo da loja" },
  { id: "vip", label: "VIP", icon: Crown, desc: "Conteúdo exclusivo" },
  { id: "leads", label: "Leads", icon: Users, desc: "Captura e scoring" },
  { id: "conversations", label: "Conversas", icon: MessagesSquare, desc: "Histórico de conversas" },
  { id: "integrations", label: "Integrações", icon: Plug, desc: "API, webhook e notificações" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export function AdminView() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>("analytics");
  const [mobileNav, setMobileNav] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNext, setPwdNext] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const { data: me } = useFetch<any>("/api/auth/me");
  const { data: notif } = useFetch<any>("/api/admin/notifications");

  const agent = me?.agent;
  const pendingProofs = notif?.pendingProofs || 0;
  const totalLeads = notif?.totalLeads || 0;

  // keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleLogout() {
    await apiPost("/api/auth/logout", {});
    toast.success("Saiu com sucesso");
    setTimeout(() => window.location.reload(), 200);
  }

  async function handleChangePassword() {
    if (pwdNext.length < 6) { toast.error("Nova senha deve ter no mínimo 6 caracteres"); return; }
    if (pwdNext !== pwdConfirm) { toast.error("As senhas não coincidem"); return; }
    setPwdLoading(true);
    try {
      await apiPost("/api/admin/account", { current: pwdCurrent, next: pwdNext, confirm: pwdConfirm }, "PUT");
      toast.success("Senha alterada com sucesso!");
      setAccountOpen(false);
      setPwdCurrent(""); setPwdNext(""); setPwdConfirm("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPwdLoading(false);
    }
  }

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  const navContent = (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const showBadge = (tab.id === "leads" && totalLeads > 0) || (tab.id === "payments" && pendingProofs > 0);
        const count = tab.id === "leads" ? totalLeads : tab.id === "payments" ? pendingProofs : 0;
        return (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setMobileNav(false); }}
            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-primary shadow-md shadow-primary/20" />}
            <tab.icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${isActive ? "text-primary" : ""}`} />
            <span className="flex-1 text-left font-medium">{tab.label}</span>
            {showBadge && (
              <Badge variant="default" className="h-5 min-w-5 justify-center px-1.5 text-[10px] animate-pulse">
                {count}
              </Badge>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar relative shrink-0">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="relative">
            <img
              src="/lovon-icon.jpg"
              alt="Lovon"
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/30"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-sidebar" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm truncate">Lovon Agente</div>
            <div className="text-xs text-muted-foreground truncate">{agent?.personaName || "..."}</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">{navContent}</div>
        <div className="border-t border-sidebar-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent transition-colors">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                    {me?.user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-sidebar" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-xs font-medium truncate">{me?.user?.name || "Usuário"}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{me?.user?.email}</div>
                </div>
                <Settings className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56 mb-2">
              <div className="px-2 py-1.5">
                <div className="text-sm font-medium truncate">{me?.user?.name}</div>
                <div className="text-xs text-muted-foreground truncate">{me?.user?.email}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setAccountOpen(true)}>
                <Settings className="w-4 h-4 mr-2" /> Alterar senha
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile nav */}
      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar">
          <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
            <img
              src="/lovon-icon.jpg"
              alt="Lovon"
              className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10"
            />
            <div className="font-bold">Lovon Agente</div>
          </div>
          {navContent}
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4 md:px-6">
          <button className="md:hidden" onClick={() => setMobileNav(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base md:text-lg font-bold truncate flex items-center gap-2">
              {currentTab.label}
            </h1>
            <p className="text-xs text-muted-foreground truncate hidden sm:block">{currentTab.desc}</p>
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSearchOpen(true)}>
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 hidden sm:flex" title="Atalhos (?)">
              <Keyboard className="w-4 h-4" />
            </Button>

            {/* Share dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden sm:flex gap-1.5">
                  <Share2 className="w-4 h-4" /> Compartilhar <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => { if (agent?.handle) window.open(`/?chat=${agent.handle}`, "_blank"); }}>
                  <ExternalLink className="w-4 h-4 mr-2" /> Abrir chat público
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { if (agent?.handle) window.open(`/?shop=${agent.handle}`, "_blank"); }}>
                  <ExternalLink className="w-4 h-4 mr-2" /> Abrir loja pública
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { if (agent?.handle) navigator.clipboard.writeText(`${window.location.origin}/?chat=${agent.handle}`); toast.success("Link copiado"); }}>
                  Copiar link do chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View agent */}
            {agent?.handle && (
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => window.open(`/?chat=${agent.handle}`, "_blank")} title="Ver agente">
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                  <Bell className="w-4 h-4" />
                  {pendingProofs > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-2 py-1.5 text-sm font-semibold">Notificações</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveTab("payments")}>
                  <CreditCard className="w-4 h-4 mr-2" /> {pendingProofs} comprovante(s) pendente(s)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("leads")}>
                  <Users className="w-4 h-4 mr-2" /> {totalLeads} leads capturados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme toggle */}
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </header>

        {/* Tab content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "persona" && <PersonaTab />}
          {activeTab === "knowledge" && <KnowledgeTab />}
          {activeTab === "visual" && <VisualTab />}
          {activeTab === "ai" && <AiModeTab />}
          {activeTab === "payments" && <PaymentsTab />}
          {activeTab === "products" && <ProductsTab />}
          {activeTab === "vip" && <VipTab />}
          {activeTab === "leads" && <LeadsTab />}
          {activeTab === "conversations" && <ConversationsTab />}
          {activeTab === "integrations" && <IntegrationsTab />}
        </main>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-xl mx-4 rounded-xl border border-border bg-card shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                autoFocus
                placeholder="Buscar ou pular para aba..."
                className="flex-1 bg-transparent outline-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setSearchOpen(false);
                }}
              />
              <button onClick={() => setSearchOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="max-h-72 overflow-y-auto custom-scrollbar p-2">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => { setActiveTab(t.id); setSearchOpen(false); }} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-accent text-left">
                  <t.icon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{t.label}</div>
                    <div className="text-xs text-muted-foreground">{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Account dialog */}
      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
            <DialogDescription>Digite sua senha atual e a nova senha.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Senha atual</Label>
              <Input type="password" value={pwdCurrent} onChange={(e) => setPwdCurrent(e.target.value)} placeholder="••••••" />
            </div>
            <div className="space-y-2">
              <Label>Nova senha <span className="text-muted-foreground text-xs">(mín. 6 caracteres)</span></Label>
              <Input type="password" value={pwdNext} onChange={(e) => setPwdNext(e.target.value)} placeholder="••••••" />
            </div>
            <div className="space-y-2">
              <Label>Confirmar nova senha</Label>
              <Input type="password" value={pwdConfirm} onChange={(e) => setPwdConfirm(e.target.value)} placeholder="••••••" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountOpen(false)}>Cancelar</Button>
            <Button onClick={handleChangePassword} disabled={pwdLoading || !pwdCurrent || !pwdNext}>
              {pwdLoading ? "Salvando..." : "Alterar senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
