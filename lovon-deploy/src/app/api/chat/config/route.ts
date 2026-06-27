import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("handle");
  if (!handle) return NextResponse.json({ error: "Handle obrigatório" }, { status: 400 });
  const agent = await db.agent.findUnique({ where: { handle: handle.toLowerCase() } });
  if (!agent) return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 });

  // Public-safe config (no sensitive data like PIX key/WhatsApp)
  return NextResponse.json({
    config: {
      handle: agent.handle,
      personaName: agent.personaName,
      personaRole: agent.personaRole,
      personaDesc: agent.personaDesc,
      primaryColor: agent.primaryColor,
      forcedTheme: agent.forcedTheme,
      avatarBase64: agent.avatarBase64,
      heroImage: agent.heroImage,
      widgetText: agent.widgetText,
      aiMode: agent.aiMode,
      leadCapture: agent.leadCapture,
      pixEnabled: agent.pixEnabled,
      pixAmount: agent.pixAmount,
      pixReceiverName: agent.pixReceiverName,
      pixBank: agent.pixBank,
      pixInstructions: agent.pixInstructions,
      vipEnabled: agent.vipEnabled,
    },
  });
}
