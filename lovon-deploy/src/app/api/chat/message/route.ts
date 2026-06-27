import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { retrieveKnowledge, buildContext, FALLBACK_MESSAGE } from "@/lib/rag";
import { buildSystemPrompt, chatComplete, ChatMessage } from "@/lib/ai";
import { rateLimit } from "@/lib/lovon-utils";

export async function POST(req: NextRequest) {
  try {
    const { handle, message, visitorId, history } = await req.json();
    if (!handle || !message) return NextResponse.json({ error: "Handle e mensagem obrigatórios" }, { status: 400 });
    // Input length limits (prevent abuse)
    if (message.length > 2000) return NextResponse.json({ error: "Mensagem muito longa (máx 2000 caracteres)" }, { status: 400 });
    if (visitorId && visitorId.length > 100) return NextResponse.json({ error: "visitorId inválido" }, { status: 400 });
    if (history && Array.isArray(history) && history.length > 20) return NextResponse.json({ error: "Histórico muito longo" }, { status: 400 });

    // Rate limit: 10 msg/IP/60s
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rl = rateLimit(`chat:${ip}`, 10, 60000);
    if (!rl.ok) return NextResponse.json({ error: "Muitas mensagens. Aguarde um minuto." }, { status: 429 });

    const agent = await db.agent.findUnique({ where: { handle: handle.toLowerCase() } });
    if (!agent) return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 });

    // RAG retrieval
    const rag = await retrieveKnowledge(agent.id, message);

    // Find or create conversation
    let conversation = visitorId
      ? await db.conversation.findFirst({ where: { agentId: agent.id, visitorId }, include: { messages: { orderBy: { createdAt: "asc" }, take: 8 } } })
      : null;
    if (!conversation) {
      conversation = await db.conversation.create({
        data: { agentId: agent.id, visitorId: visitorId || `anon-${Date.now()}`, visitorIp: ip },
        include: { messages: [] },
      });
      await db.agent.update({ where: { id: agent.id }, data: { totalChats: { increment: 1 } } });
    }

    // Save user message
    await db.message.create({ data: { conversationId: conversation.id, role: "user", content: message } });
    await db.conversation.update({ where: { id: conversation.id }, data: { lastMsgAt: new Date() } });
    await db.agent.update({ where: { id: agent.id }, data: { totalMessages: { increment: 1 } } });

    // Fallback: off-topic or no sources
    let reply: string;
    let sources: any[] = [];
    if (rag.isOffTopic || !rag.hasResults) {
      reply = FALLBACK_MESSAGE;
    } else {
      const context = buildContext(rag.sources);
      const systemPrompt = buildSystemPrompt(agent, context);
      const hist: ChatMessage[] = (history || conversation.messages || [])
        .filter((m: any) => m.role === "user" || m.role === "assistant")
        .slice(-8)
        .map((m: any) => ({ role: m.role, content: m.content }));
      try {
        reply = await chatComplete(systemPrompt, hist, message);
      } catch (e: any) {
        console.error("[chat/message] Gemini error:", e?.message || e);
        console.error("[chat/message] Full error:", JSON.stringify(e, null, 2));
        reply = "Tive um problema para gerar a resposta agora. Pode tentar novamente em instantes?";
      }
      sources = rag.sources.map((s) => ({ id: s.id, title: s.title, type: s.type }));
    }

    // Save assistant message
    await db.message.create({
      data: { conversationId: conversation.id, role: "assistant", content: reply, sources: JSON.stringify(sources) },
    });

    // Lead capture: after 3+ user messages and leadCapture enabled, suggest capturing lead
    const userMsgCount = await db.message.count({ where: { conversationId: conversation.id, role: "user" } });
    const existingLead = await db.lead.findFirst({ where: { agentId: agent.id, visitorId } });
    const suggestLead = agent.leadCapture && userMsgCount >= 3 && !existingLead && rag.hasPurchaseIntent;

    return NextResponse.json({
      ok: true,
      reply,
      sources,
      conversationId: conversation.id,
      visitorId: conversation.visitorId,
      hasPurchaseIntent: rag.hasPurchaseIntent,
      suggestLead,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Erro interno" }, { status: 500 });
  }
}
