import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agent = await db.agent.findUnique({ where: { userId: user.id } });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    const convo = await db.conversation.findFirst({ where: { id, agentId: agent.id }, include: { messages: { orderBy: { createdAt: "asc" } } } });
    if (!convo) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    return NextResponse.json({ conversation: convo });
  }
  const conversations = await db.conversation.findMany({
    where: { agentId: agent.id },
    orderBy: { lastMsgAt: "desc" },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return NextResponse.json({ conversations });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agent = await db.agent.findUnique({ where: { userId: user.id } });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) await db.conversation.deleteMany({ where: { id, agentId: agent.id } });
  return NextResponse.json({ ok: true });
}
