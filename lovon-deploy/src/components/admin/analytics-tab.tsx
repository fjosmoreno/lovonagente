"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Package, Video, Eye, Star, MessageSquare, MessagesSquare, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Activity, Zap, Calendar } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const quickActions = [
  { label: "Adicionar Conhecimento", icon: BookOpen, gradient: "from-orange-500/20 to-red-500/10", border: "border-orange-500/30", tab: "knowledge" },
  { label: "Novo Produto", icon: Package, gradient: "from-purple-500/20 to-pink-500/10", border: "border-purple-500/30", tab: "products" },
  { label: "Ver Conversas", icon: MessagesSquare, gradient: "from-blue-500/20 to-cyan-500/10", border: "border-blue-500/30", tab: "conversations" },
  { label: "Configurar IA", icon: Star, gradient: "from-amber-500/20 to-yellow-500/10", border: "border-amber-500/30", tab: "ai" },
  { label: "Editar Loja", icon: Eye, gradient: "from-emerald-500/20 to-teal-500/10", border: "border-emerald-500/30", tab: "visual" },
];

const RANGES = [
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
];

export function AnalyticsTab() {
  const [range, setRange] = useState("7d");
  const { data, loading } = useFetch<any>(`/api/admin/analytics?range=${range}`);

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 animate-shimmer rounded-xl" />)}</div>
        <div className="grid lg:grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <div key={i} className="h-72 animate-shimmer rounded-xl" />)}</div>
      </div>
    );
  }

  const kpis = data.kpis;
  const kpiCards = [
    { label: "Conversas", value: kpis.conversations, icon: MessagesSquare, gradient: "from-orange-500/15 to-orange-500/5", iconBg: "bg-orange-500/15 text-orange-500", trend: "+12%", trendUp: true },
    { label: "Mensagens", value: kpis.messages, icon: MessageSquare, gradient: "from-purple-500/15 to-purple-500/5", iconBg: "bg-purple-500/15 text-purple-500", trend: "+8%", trendUp: true },
    { label: "Leads", value: kpis.leads, icon: Users, gradient: "from-blue-500/15 to-blue-500/5", iconBg: "bg-blue-500/15 text-blue-500", trend: kpis.leads > 0 ? "+3" : "0", trendUp: kpis.leads > 0 },
    { label: "Conversão", value: `${kpis.conversion}%`, icon: TrendingUp, gradient: "from-emerald-500/15 to-emerald-500/5", iconBg: "bg-emerald-500/15 text-emerald-500", trend: `${kpis.conversion}%`, trendUp: kpis.conversion > 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" /> Ações rápidas
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map((a, i) => (
            <button
              key={a.label}
              className={`group relative overflow-hidden rounded-xl border ${a.border} bg-gradient-to-br ${a.gradient} p-4 text-left hover:scale-[1.03] active:scale-[0.98] transition-all duration-200`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <a.icon className="w-5 h-5 mb-3 text-foreground group-hover:scale-110 group-hover:text-primary transition-all" />
              <div className="text-xs font-medium leading-tight">{a.label}</div>
            </button>
          ))}
        </div>
      </section>

      {/* KPIs - Premium cards */}
      <section>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-primary" /> Indicadores
          </h2>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground mx-1.5" />
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${range === r.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((k, i) => (
            <Card key={k.label} className={`relative overflow-hidden border-0 bg-gradient-to-br ${k.gradient} hover:shadow-lg transition-shadow group`}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/5 blur-2xl" />
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${k.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <k.icon className="w-5 h-5" />
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${k.trendUp ? "text-emerald-500" : "text-muted-foreground"}`}>
                    {k.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {k.trend}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-black tracking-tight">{k.value}</p>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Charts */}
      <section className="grid lg:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Atividade
                </CardTitle>
                <CardDescription className="text-xs">Últimos 7 dias</CardDescription>
              </div>
              <div className="flex gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF6600]" /> Mensagens</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#a855f7]" /> Conversas</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ec4899]" /> Leads</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.series} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF6600" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#FF6600" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="date" stroke="#666" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#141414", border: "1px solid #333", borderRadius: 8, fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }} />
                <Area type="monotone" dataKey="messages" stroke="#FF6600" strokeWidth={2} fill="url(#g1)" name="Mensagens" />
                <Area type="monotone" dataKey="conversations" stroke="#a855f7" strokeWidth={2} fill="url(#g2)" name="Conversas" />
                <Area type="monotone" dataKey="leads" stroke="#ec4899" strokeWidth={2} fill="url(#g3)" name="Leads" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Comprovantes PIX
            </CardTitle>
            <CardDescription className="text-xs">Status das verificações VLM</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[
                { name: "Aprovados", value: data.proofs.approved, fill: "#10b981" },
                { name: "Pendentes", value: data.proofs.pending, fill: "#FF6600" },
                { name: "Rejeitados", value: data.proofs.rejected, fill: "#ef4444" },
              ]} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#141414", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} cursor={{ fill: "#ffffff08" }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={64} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recursos do agente</CardTitle>
          <CardDescription className="text-xs">Capacidade e alcance do seu especialista digital</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Fontes", value: data.resources.sources, icon: BookOpen, color: "text-orange-500", bg: "bg-orange-500/10" },
              { label: "Produtos", value: data.resources.products, icon: Package, color: "text-purple-500", bg: "bg-purple-500/10" },
              { label: "Vídeos", value: data.resources.videos, icon: Video, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Visitantes", value: data.resources.visitors, icon: Eye, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "Score médio", value: data.resources.avgScore, icon: Star, color: "text-amber-500", bg: "bg-amber-500/10" },
            ].map((r) => (
              <div key={r.label} className="group rounded-xl border border-border/60 bg-card/40 p-4 text-center hover:border-primary/40 hover:bg-card/80 transition-all">
                <div className={`w-10 h-10 rounded-full ${r.bg} mx-auto flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                  <r.icon className={`w-4 h-4 ${r.color}`} />
                </div>
                <div className="text-xl font-black">{r.value}</div>
                <div className="text-xs text-muted-foreground">{r.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
