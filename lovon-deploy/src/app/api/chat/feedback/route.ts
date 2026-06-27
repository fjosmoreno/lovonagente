import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { conversationId, feedback, note } = await req.json();
    if (!conversationId || !feedback) return NextResponse.json({ error: "Dados obrigatórios" }, { status: 400 });
    // find last assistant message
    const msg = await db.message.findFirst({ where: { conversationId, role: "assistant" }, orderBy: { createdAt: "desc" } });
    if (!msg) return NextResponse.json({ error: "Mensagem não encontrada" }, { status: 404 });
    await db.message.update({ where: { id: msg.id }, data: { feedback, feedbackNote: note || null } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
