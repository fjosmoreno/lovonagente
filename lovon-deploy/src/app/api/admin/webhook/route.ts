import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agent = await db.agent.findUnique({ where: { userId: user.id } });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ webhookUrl: agent.webhookUrl });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agent = await db.agent.findUnique({ where: { userId: user.id } });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { webhookUrl } = await req.json();
  const updated = await db.agent.update({ where: { id: agent.id }, data: { webhookUrl } });
  return NextResponse.json({ ok: true, webhookUrl: updated.webhookUrl });
}

// test webhook
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agent = await db.agent.findUnique({ where: { userId: user.id } });
  if (!agent || !agent.webhookUrl) return NextResponse.json({ error: "Webhook não configurado" }, { status: 400 });
  try {
    const res = await fetch(agent.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "test", agent: agent.handle, timestamp: new Date().toISOString() }),
    });
    return NextResponse.json({ ok: true, status: res.status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
