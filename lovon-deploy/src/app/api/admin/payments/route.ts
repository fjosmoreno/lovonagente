import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { verifyPixReceipt } from "@/lib/ai";

async function getAgent() {
  const user = await getCurrentUser();
  if (!user) return null;
  return db.agent.findUnique({ where: { userId: user.id } });
}

export async function GET() {
  const agent = await getAgent();
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const proofs = await db.paymentProof.findMany({ where: { agentId: agent.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ proofs });
}

// Approve / reject
export async function PUT(req: NextRequest) {
  const agent = await getAgent();
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, action, reason } = await req.json();
  const proof = await db.paymentProof.findFirst({ where: { id, agentId: agent.id } });
  if (!proof) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  const status = action === "approve" ? "aprovado" : "rejeitado";
  await db.paymentProof.update({ where: { id }, data: { status, reason: reason || null, reviewedAt: new Date() } });
  return NextResponse.json({ ok: true, status });
}

// Auto-verify with VLM
export async function POST(req: NextRequest) {
  const agent = await getAgent();
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  const proof = await db.paymentProof.findFirst({ where: { id, agentId: agent.id } });
  if (!proof) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  const result = await verifyPixReceipt(proof.imageBase64, agent.pixAmount || undefined);
  await db.paymentProof.update({
    where: { id },
    data: {
      amount: result.amount,
      receiver: result.receiver,
      pixKey: result.pixKey,
      transaction: result.transaction,
      paidAt: result.paidAt,
      bank: result.bank,
    },
  });
  return NextResponse.json({ ok: true, result });
}
