import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agent = await db.agent.findUnique({ where: { userId: user.id } });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const leads = await db.lead.findMany({ where: { agentId: agent.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ leads });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agent = await db.agent.findUnique({ where: { userId: user.id } });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    await db.lead.deleteMany({ where: { id, agentId: agent.id } });
  }
  return NextResponse.json({ ok: true });
}
