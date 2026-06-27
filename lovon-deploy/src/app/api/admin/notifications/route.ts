import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Notifications: pending proofs + recent leads + recent conversations
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agent = await db.agent.findUnique({ where: { userId: user.id } });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [pendingProofs, recentLeads, recentConvos] = await Promise.all([
    db.paymentProof.count({ where: { agentId: agent.id, status: "pendente" } }),
    db.lead.count({ where: { agentId: agent.id } }),
    db.conversation.count({ where: { agentId: agent.id } }),
  ]);
  return NextResponse.json({ pendingProofs, totalLeads: recentLeads, totalConversations: recentConvos });
}
