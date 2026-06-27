import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { handle, visitorId, name, whatsapp, email, interest } = await req.json();
    if (!handle || !name || !whatsapp) return NextResponse.json({ error: "Dados obrigatórios" }, { status: 400 });
    const agent = await db.agent.findUnique({ where: { handle: handle.toLowerCase() } });
    if (!agent) return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 });
    // Score: base 30 + interest keywords + purchase intent
    let score = 30;
    const interestLower = (interest || "").toLowerCase();
    if (interestLower.match(/comprar|preco|valor|quero|pagar/)) score += 40;
    else if (interestLower.match(/mentoria|curso|produto|servico/)) score += 20;
    if (email) score += 10;
    const lead = await db.lead.create({
      data: { agentId: agent.id, visitorId, name, whatsapp, email: email || null, interest: interest || null, score, vip: false },
    });
    return NextResponse.json({ ok: true, leadId: lead.id, score });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
