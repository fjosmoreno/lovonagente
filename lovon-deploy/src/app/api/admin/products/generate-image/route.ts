import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Geração de imagem via Pollinations.ai (free, sem API key)
// Docs: https://pollinations.ai/

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agent = await db.agent.findUnique({ where: { userId: user.id } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId obrigatório" }, { status: 400 });

  const product = await db.product.findFirst({ where: { id: productId, agentId: agent.id } });
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  const categoryStyle: Record<string, string> = {
    Mentoria: "modern flat illustration, orange gradient",
    Curso: "modern 3D illustration, purple gradient",
    Ebook: "ebook cover design, blue gradient",
    Consultoria: "professional consulting concept, emerald gradient",
    Ferramenta: "tool/software illustration, amber gradient",
  };
  const style = categoryStyle[product.category || ""] || "modern digital art, professional";
  const prompt = `${product.name}: ${product.description}. ${style}, high quality, clean minimal design`;

  try {
    // Pollinations retorna a imagem direto via GET
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&model=flux`;

    const imgRes = await fetch(url, { cache: "no-store" });
    if (!imgRes.ok) {
      throw new Error(`Pollinations returned ${imgRes.status}`);
    }

    const arrayBuffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    await db.product.update({
      where: { id: product.id },
      data: { imageBase64: dataUrl },
    });

    return NextResponse.json({ ok: true, imageBase64: dataUrl });
  } catch (e: any) {
    console.error("[generate-image] error:", e);
    return NextResponse.json(
      { error: e.message || "Falha ao gerar imagem" },
      { status: 500 }
    );
  }
}