import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isValidLovonUrl, extractHandle, isValidHex } from "@/lib/lovon-utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agent = await db.agent.findUnique({ where: { userId: user.id } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  return NextResponse.json({ agent });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agent = await db.agent.findUnique({ where: { userId: user.id } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const body = await req.json();
  const data: any = {};

  // Lovon profile
  if (body.lovonUrl !== undefined) {
    if (body.lovonUrl && !isValidLovonUrl(body.lovonUrl)) {
      return NextResponse.json({ error: "URL Lovon inválida" }, { status: 400 });
    }
    data.lovonUrl = body.lovonUrl || null;
  }
  if (body.handle !== undefined) {
    const handle = String(body.handle).toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (handle && handle !== agent.handle) {
      const exists = await db.agent.findUnique({ where: { handle } });
      if (exists) return NextResponse.json({ error: "Handle já em uso" }, { status: 400 });
      data.handle = handle;
    }
  }

  // Persona fields
  for (const f of ["personaName", "personaRole", "personaDesc", "personaStyle", "personaEmotion", "creativity", "languages"]) {
    if (body[f] !== undefined) data[f] = body[f];
  }

  // Visual
  if (body.primaryColor !== undefined) {
    if (!isValidHex(body.primaryColor)) return NextResponse.json({ error: "Cor inválida" }, { status: 400 });
    data.primaryColor = body.primaryColor;
  }
  for (const f of ["forcedTheme", "avatarBase64", "heroImage", "widgetText"]) {
    if (body[f] !== undefined) data[f] = body[f];
  }

  // AI mode
  for (const f of ["aiMode", "leadCapture"]) {
    if (body[f] !== undefined) data[f] = body[f];
  }

  // PIX
  for (const f of ["pixEnabled", "pixAmount", "pixKey", "pixReceiverName", "pixBank", "pixWhatsapp", "pixSuccessMsg", "pixInstructions"]) {
    if (body[f] !== undefined) data[f] = body[f];
  }

  // VIP
  for (const f of ["vipEnabled", "vipTriggerMsg", "vipPhrase"]) {
    if (body[f] !== undefined) data[f] = body[f];
  }

  // Webhook
  if (body.webhookUrl !== undefined) data.webhookUrl = body.webhookUrl;

  const updated = await db.agent.update({ where: { id: agent.id }, data });
  return NextResponse.json({ ok: true, agent: updated });
}
