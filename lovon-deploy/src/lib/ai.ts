import ZAI from "z-ai-web-dev-sdk";
import { Agent } from "@prisma/client";

let zaiInstance: any = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

const CREATIVITY_TEMP: Record<string, number> = {
  baixa: 0.3,
  media: 0.6,
  alta: 0.9,
};

const STYLE_INSTRUCTIONS: Record<string, string> = {
  amigavel: "Seja amigável, próximo e caloroso. Use linguagem acessível.",
  profissional: "Seja profissional, técnico e objetivo. Use linguagem formal.",
  casual: "Seja casual, descontraído e direto. Use linguagem do dia a dia.",
  tecnico: "Seja técnico, detalhista e preciso. Use termos da área.",
  inspirador: "Seja inspirador, motivacional e energético. Use linguagem que empolga.",
  divertido: "Seja divertido, leve e bem-humorado. Use linguagem descontraída.",
};

const EMOTION_INSTRUCTIONS: Record<string, string> = {
  neutro: "Mantenha um tom neutro e equilibrado.",
  entusiasta: "Demonstre entusiasmo e energia nas respostas.",
  calmo: "Mantenha um tom calmo e tranquilizador.",
};

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function buildSystemPrompt(agent: Agent, ragContext: string): string {
  const languages = (agent.languages || "pt").split(",").join(", ");
  const styleText = STYLE_INSTRUCTIONS[agent.personaStyle] || STYLE_INSTRUCTIONS.amigavel;
  const emotionText = EMOTION_INSTRUCTIONS[agent.personaEmotion] || EMOTION_INSTRUCTIONS.neutro;

  let prompt = `Você é ${agent.personaName}, ${agent.personaRole}.${agent.personaDesc ? ` ${agent.personaDesc}` : ""}

${styleText}
${emotionText}

REGRAS ANTI-ALUCINAÇÃO (CRÍTICO):
- Responda APENAS com base nas informações fornecidas no CONTEXTO abaixo.
- NUNCA invente informações que não estão no contexto.
- Se a pergunta não puder ser respondida com o contexto, diga: "Não tenho essa informação na minha base de conhecimento. Posso te ajudar com outro assunto?"
- Não mencione "contexto" ou "fontes" como se fossem documentos externos - trate como seu próprio conhecimento.
- Seja conciso e direto. Máximo 3 parágrafos.

Idiomas que você domina: ${languages}.`;

  if (agent.aiMode === "corporativo") {
    prompt += `\n\nMODO CORPORATIVO: Mantenha sempre um tom institucional. Não faça comentários pessoais.`;
  } else if (agent.aiMode === "hibrido") {
    prompt += `\n\nMODO HÍBRIDO: Você pode adicionar um pouco de personalidade, mas mantenha o foco nas informações do contexto.`;
  } else {
    prompt += `\n\nMODO RESTRITO: Use estritamente apenas as informações do contexto. Não adicione nada além.`;
  }

  if (ragContext) {
    prompt += `\n\n=== CONTEXTO DE CONHECIMENTO ===\n${ragContext}\n=== FIM DO CONTEXTO ===`;
  }

  return prompt;
}

export async function chatComplete(
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const zai = await getZAI();
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-8),
    { role: "user", content: userMessage },
  ];

  let attempts = 0;
  let lastError: any;
  while (attempts < 3) {
    try {
      const completion = await zai.chat.completions.create({
        messages,
        temperature: CREATIVITY_TEMP["media"],
        max_tokens: 600,
        thinking: { type: "disabled" },
      });
      const content = completion.choices?.[0]?.message?.content;
      return content || "Não consegui gerar uma resposta. Tente reformular sua pergunta.";
    } catch (err: any) {
      lastError = err;
      if (err?.status === 429 || err?.message?.includes("429")) {
        attempts++;
        await new Promise((r) => setTimeout(r, 1000 * attempts));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// VLM for PIX receipt verification
export interface PixVerificationResult {
  amount: number | null;
  receiver: string | null;
  pixKey: string | null;
  transaction: string | null;
  paidAt: string | null;
  bank: string | null;
  isValid: boolean;
  confidence: string;
  observations: string;
}

export async function verifyPixReceipt(imageBase64: string, expectedAmount?: number): Promise<PixVerificationResult> {
  const zai = await getZAI();
  let imageData = imageBase64;
  if (!imageData.startsWith("data:image")) {
    imageData = `data:image/jpeg;base64,${imageData}`;
  }

  const prompt = `Você é um especialista em verificar comprovantes PIX. Analise esta imagem de comprovante PIX e extraia as seguintes informações no formato JSON exato:

{
  "amount": número do valor pago (ex: 49.90) ou null se não encontrado,
  "receiver": nome do recebedor ou null,
  "pixKey": chave PIX do recebedor ou null,
  "transaction": ID/número da transação ou null,
  "paidAt": data e hora do pagamento ou null,
  "bank": nome do banco ou null,
  "isValid": true se parece um comprovante PIX real, false caso contrário,
  "confidence": "alta", "media" ou "baixa",
  "observations": observações sobre a verificação
}

${expectedAmount ? `O valor esperado é R$ ${expectedAmount.toFixed(2)}. Verifique se o valor pago corresponde.` : ""}

Retorne APENAS o JSON, sem texto adicional.`;

  try {
    const completion = await zai.chat.completions.create({
      model: "glm-4v",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageData } },
          ],
        },
      ],
      thinking: { type: "disabled" },
    } as any);

    const content = completion.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        amount: parsed.amount != null ? Number(parsed.amount) : null,
        receiver: parsed.receiver || null,
        pixKey: parsed.pixKey || null,
        transaction: parsed.transaction || null,
        paidAt: parsed.paidAt || null,
        bank: parsed.bank || null,
        isValid: Boolean(parsed.isValid),
        confidence: parsed.confidence || "baixa",
        observations: parsed.observations || "",
      };
    }
  } catch (err) {
    // fall through to default
  }

  return {
    amount: null,
    receiver: null,
    pixKey: null,
    transaction: null,
    paidAt: null,
    bank: null,
    isValid: false,
    confidence: "baixa",
    observations: "Não foi possível analisar a imagem automaticamente.",
  };
}
