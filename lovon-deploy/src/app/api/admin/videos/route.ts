import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function getAgent() {
  const user = await getCurrentUser();
  if (!user) return null;
  return db.agent.findUnique({ where: { userId: user.id } });
}

export async function GET() {
  const agent = await getAgent();
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const videos = await db.videoLesson.findMany({ where: { agentId: agent.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ videos });
}

export async function POST(req: NextRequest) {
  const agent = await getAgent();
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { title, description, url, duration } = await req.json();
  if (!title || !url) return NextResponse.json({ error: "Título e URL obrigatórios" }, { status: 400 });
  const video = await db.videoLesson.create({ data: { agentId: agent.id, title, description, url, duration: duration ? Number(duration) : null } });
  return NextResponse.json({ ok: true, video });
}

export async function DELETE(req: NextRequest) {
  const agent = await getAgent();
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  await db.videoLesson.deleteMany({ where: { id, agentId: agent.id } });
  return NextResponse.json({ ok: true });
}
