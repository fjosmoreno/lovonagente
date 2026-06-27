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
  const products = await db.product.findMany({ where: { agentId: agent.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const agent = await getAgent();
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.name || body.price == null) return NextResponse.json({ error: "Nome e preço obrigatórios" }, { status: 400 });
  const product = await db.product.create({
    data: {
      agentId: agent.id,
      name: body.name,
      description: body.description || "",
      price: Number(body.price),
      comparePrice: body.comparePrice ? Number(body.comparePrice) : null,
      category: body.category || null,
      badge: body.badge || null,
      rating: body.rating ? Number(body.rating) : 0,
      reviewCount: body.reviewCount ? Number(body.reviewCount) : 0,
      featured: Boolean(body.featured),
      active: body.active !== false,
      imageBase64: body.imageBase64 || null,
      externalUrl: body.externalUrl || null,
    },
  });
  return NextResponse.json({ ok: true, product });
}

export async function PUT(req: NextRequest) {
  const agent = await getAgent();
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, ...rest } = body;
  const existing = await db.product.findFirst({ where: { id, agentId: agent.id } });
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  const data: any = {};
  for (const f of ["name", "description", "category", "badge", "imageBase64", "externalUrl"]) {
    if (rest[f] !== undefined) data[f] = rest[f];
  }
  for (const f of ["price", "comparePrice", "rating", "reviewCount"]) {
    if (rest[f] !== undefined) data[f] = rest[f] === null ? null : Number(rest[f]);
  }
  for (const f of ["featured", "active"]) {
    if (rest[f] !== undefined) data[f] = Boolean(rest[f]);
  }
  const updated = await db.product.update({ where: { id }, data });
  return NextResponse.json({ ok: true, product: updated });
}

export async function DELETE(req: NextRequest) {
  const agent = await getAgent();
  if (!agent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  const existing = await db.product.findFirst({ where: { id, agentId: agent.id } });
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  await db.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
