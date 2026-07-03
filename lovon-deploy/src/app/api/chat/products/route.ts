import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("handle");
  if (!handle) return NextResponse.json({ error: "Handle obrigatório" }, { status: 400 });
  const agent = await db.agent.findUnique({ where: { handle: handle.toLowerCase() } });
  if (!agent) return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 });
  const products = await db.product.findMany({ where: { agentId: agent.id, active: true }, orderBy: [{ featured: "desc" }, { createdAt: "desc" }] });
  return NextResponse.json({
    products,
    agent: {
      personaName: agent.personaName,
      personaRole: agent.personaRole,
      personaDesc: agent.personaDesc,
      widgetText: agent.widgetText,
      heroImage: agent.heroImage,
      avatarBase64: agent.avatarBase64,
      primaryColor: agent.primaryColor,
      // PIX + WhatsApp — exposed because the buyer needs them to complete payment.
      pixEnabled: agent.pixEnabled,
      pixAmount: agent.pixAmount,
      pixKey: agent.pixKey,
      pixReceiverName: agent.pixReceiverName,
      pixBank: agent.pixBank,
      pixInstructions: agent.pixInstructions,
      pixWhatsapp: agent.pixWhatsapp,
    },
  });
}
