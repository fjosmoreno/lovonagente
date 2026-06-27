import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPixReceipt } from "@/lib/ai";
import { isBase64UnderSize, rateLimit } from "@/lib/lovon-utils";

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 3 payment uploads per IP per 5 min
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rl = rateLimit(`payment:${ip}`, 3, 300000);
    if (!rl.ok) return NextResponse.json({ error: "Muitos envios. Aguarde 5 minutos." }, { status: 429 });

    const { handle, imageBase64, visitorId, leadName, leadWhatsapp } = await req.json();
    if (!handle || !imageBase64) return NextResponse.json({ error: "Dados obrigatórios" }, { status: 400 });
    if (!isBase64UnderSize(imageBase64, 5)) return NextResponse.json({ error: "Imagem muito grande (máx 5MB)" }, { status: 400 });
    // Input length limits
    if (leadName && leadName.length > 100) return NextResponse.json({ error: "Nome muito longo" }, { status: 400 });
    if (leadWhatsapp && leadWhatsapp.length > 30) return NextResponse.json({ error: "WhatsApp inválido" }, { status: 400 });

    const agent = await db.agent.findUnique({ where: { handle: handle.toLowerCase() } });
    if (!agent) return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 });

    // Auto VLM verification
    const vlm = await verifyPixReceipt(imageBase64, agent.pixAmount || undefined);

    const proof = await db.paymentProof.create({
      data: {
        agentId: agent.id,
        visitorId: visitorId || "anon",
        imageBase64,
        amount: vlm.amount,
        receiver: vlm.receiver,
        pixKey: vlm.pixKey,
        transaction: vlm.transaction,
        paidAt: vlm.paidAt,
        bank: vlm.bank,
        status: vlm.isValid && vlm.confidence !== "baixa" ? "aprovado" : "pendente",
        leadName,
        leadWhatsapp,
      },
    });

    // If auto-approved and amount matches, expose whatsapp
    const approved = proof.status === "aprovado" && (!agent.pixAmount || (vlm.amount != null && Math.abs(vlm.amount - agent.pixAmount) < 0.5));
    return NextResponse.json({
      ok: true,
      proofId: proof.id,
      status: proof.status,
      approved,
      whatsapp: approved ? agent.pixWhatsapp : undefined,
      vlm,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
