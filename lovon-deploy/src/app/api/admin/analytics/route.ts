import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agent = await db.agent.findUnique({ where: { userId: user.id } });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "7d";
  const daysCount = range === "30d" ? 30 : range === "90d" ? 90 : 7;

  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setDate(rangeStart.getDate() - (daysCount - 1));
  rangeStart.setHours(0, 0, 0, 0);

  const [sources, products, videos, conversations, leads, proofs, allMessages] = await Promise.all([
    db.knowledgeSource.count({ where: { agentId: agent.id } }),
    db.product.count({ where: { agentId: agent.id } }),
    db.videoLesson.count({ where: { agentId: agent.id } }),
    db.conversation.findMany({ where: { agentId: agent.id }, include: { _count: { select: { messages: true } } } }),
    db.lead.findMany({ where: { agentId: agent.id } }),
    db.paymentProof.findMany({ where: { agentId: agent.id } }),
    // Agent-scoped message count (multi-tenant safe)
    db.message.findMany({
      where: { conversation: { agentId: agent.id } },
      select: { createdAt: true, conversationId: true },
    }),
  ]);

  // Total agent-scoped messages
  const totalMessages = allMessages.length;

  // date range series with real data
  const days: { date: string; messages: number; conversations: number; leads: number }[] = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dEnd = new Date(d);
    dEnd.setDate(dEnd.getDate() + 1);
    const dayConvos = conversations.filter((c) => c.startedAt >= d && c.startedAt < dEnd).length;
    const dayLeads = leads.filter((l) => l.createdAt >= d && l.createdAt < dEnd).length;
    const dayMessages = allMessages.filter((m) => m.createdAt >= d && m.createdAt < dEnd).length;
    days.push({
      date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      messages: dayMessages,
      conversations: dayConvos,
      leads: dayLeads,
    });
  }

  // KPIs filtered by range
  const rangeConversations = conversations.filter((c) => c.startedAt >= rangeStart);
  const rangeLeads = leads.filter((l) => l.createdAt >= rangeStart);
  const rangeMessages = allMessages.filter((m) => m.createdAt >= rangeStart).length;

  const approvedProofs = proofs.filter((p) => p.status === "aprovado").length;
  const pendingProofs = proofs.filter((p) => p.status === "pendente").length;
  const rejectedProofs = proofs.filter((p) => p.status === "rejeitado").length;
  const avgScore = leads.length > 0 ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : 0;
  const conversion = rangeConversations.length > 0 ? Math.round((rangeLeads.length / rangeConversations.length) * 100) : 0;

  return NextResponse.json({
    kpis: {
      conversations: rangeConversations.length,
      messages: rangeMessages,
      leads: rangeLeads.length,
      conversion,
    },
    series: days,
    proofs: { approved: approvedProofs, pending: pendingProofs, rejected: rejectedProofs },
    resources: { sources, products, videos, visitors: agent.totalVisitors, avgScore },
    range,
  });
}
