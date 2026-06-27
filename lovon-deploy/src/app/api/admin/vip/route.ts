import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agent = await db.agent.findUnique({ where: { userId: user.id } });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ vip: { vipEnabled: agent.vipEnabled, vipTriggerMsg: agent.vipTriggerMsg, vipPhrase: agent.vipPhrase } });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agent = await db.agent.findUnique({ where: { userId: user.id } });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { vipEnabled, vipTriggerMsg, vipPhrase } = await req.json();
  const updated = await db.agent.update({ where: { id: agent.id }, data: { vipEnabled, vipTriggerMsg, vipPhrase } });
  return NextResponse.json({ ok: true, vip: { vipEnabled: updated.vipEnabled, vipTriggerMsg: updated.vipTriggerMsg, vipPhrase: updated.vipPhrase } });
}
