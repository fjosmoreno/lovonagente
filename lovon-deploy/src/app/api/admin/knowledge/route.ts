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
  const sources = await db.knowledgeSource.findMany({ where: { agentId: agent.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ sources });
}

export async function POST(req: NextRequest) {
  const agent = await getAgent();
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { type, title, content, faqQ, faqA } = await req.json();
  if (!type || !title) return NextResponse.json({ error: "Tipo e título obrigatórios" }, { status: 400 });
  // Input length limits
  if (title.length > 200) return NextResponse.json({ error: "Título muito longo (máx 200)" }, { status: 400 });
  if (content && content.length > 50000) return NextResponse.json({ error: "Conteúdo muito longo (máx 50000 caracteres)" }, { status: 400 });
  if (!["url", "pdf", "faq", "text"].includes(type)) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  const source = await db.knowledgeSource.create({
    data: {
      agentId: agent.id,
      type,
      title,
      content: content || (type === "faq" && faqA ? faqA : ""),
      faqQ: type === "faq" ? faqQ : null,
      faqA: type === "faq" ? faqA : null,
    },
  });
  return NextResponse.json({ ok: true, source });
}

export async function PUT(req: NextRequest) {
  const agent = await getAgent();
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, type, title, content, faqQ, faqA } = await req.json();
  const existing = await db.knowledgeSource.findFirst({ where: { id, agentId: agent.id } });
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  const updated = await db.knowledgeSource.update({
    where: { id },
    data: {
      type,
      title,
      content: content || (type === "faq" && faqA ? faqA : ""),
      faqQ: type === "faq" ? faqQ : null,
      faqA: type === "faq" ? faqA : null,
    },
  });
  return NextResponse.json({ ok: true, source: updated });
}

export async function DELETE(req: NextRequest) {
  const agent = await getAgent();
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  const existing = await db.knowledgeSource.findFirst({ where: { id, agentId: agent.id } });
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  await db.knowledgeSource.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
