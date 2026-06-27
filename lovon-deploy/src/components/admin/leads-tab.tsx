"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFetch } from "@/hooks/use-fetch";
import { Download, Users, Star } from "lucide-react";
import { formatDateBR } from "@/lib/lovon-utils";

export function LeadsTab() {
  const { data, loading } = useFetch<any>("/api/admin/leads");

  function exportCSV() {
    if (!data?.leads?.length) return;
    const headers = ["Nome", "WhatsApp", "Email", "Interesse", "Score", "VIP", "Data"];
    const rows = data.leads.map((l: any) => [l.name, l.whatsapp, l.email || "", l.interest || "", l.score, l.vip ? "Sim" : "Não", formatDateBR(l.createdAt)]);
    const csv = [headers, ...rows].map((r) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "leads.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function scoreColor(score: number) {
    if (score >= 70) return "text-emerald-500";
    if (score >= 40) return "text-amber-500";
    return "text-muted-foreground";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.leads?.length || 0} lead(s)</p>
        <Button size="sm" variant="outline" onClick={exportCSV} disabled={!data?.leads?.length}><Download className="w-4 h-4 mr-1" /> Exportar CSV</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 animate-shimmer rounded-lg" />)}</div>
          ) : !data?.leads?.length ? (
            <div className="p-12 text-center">
              <svg viewBox="0 0 200 120" className="mx-auto w-40 h-24 mb-4 opacity-50">
                <rect x="20" y="20" width="160" height="80" rx="8" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
                <circle cx="60" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
                <line x1="80" y1="50" x2="160" y2="50" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
                <line x1="80" y1="65" x2="140" y2="65" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
                <text x="100" y="105" textAnchor="middle" fontSize="10" fill="currentColor" className="text-muted-foreground">Sem leads</text>
              </svg>
              <p className="text-sm text-muted-foreground">Nenhum lead capturado ainda.</p>
              <p className="text-xs text-muted-foreground mt-1">Leads aparecerão aqui quando visitantes demonstrarem interesse.</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Interesse</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center">VIP</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.leads.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.name}</TableCell>
                      <TableCell className="text-xs font-mono">{l.whatsapp}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{l.email || "—"}</TableCell>
                      <TableCell className="text-xs">{l.interest || "—"}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${scoreColor(l.score)}`}>{l.score}</span>
                      </TableCell>
                      <TableCell className="text-center">{l.vip ? <Badge variant="default" className="text-[10px]">VIP</Badge> : "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDateBR(l.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {data?.leads?.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div><div className="text-2xl font-bold">{data.leads.length}</div><div className="text-xs text-muted-foreground">Total</div></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <Star className="w-8 h-8 text-amber-500" />
            <div><div className="text-2xl font-bold">{Math.round(data.leads.reduce((s: number, l: any) => s + l.score, 0) / data.leads.length)}</div><div className="text-xs text-muted-foreground">Score médio</div></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-500" />
            <div><div className="text-2xl font-bold">{data.leads.filter((l: any) => l.vip).length}</div><div className="text-xs text-muted-foreground">VIPs</div></div>
          </CardContent></Card>
        </div>
      )}
    </div>
  );
}
