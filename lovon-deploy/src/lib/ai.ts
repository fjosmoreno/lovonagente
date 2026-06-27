// Lovon Agente - AI module
// Migrado de z-ai-web-dev-sdk → Google Gemini 2.0 Flash (free tier)
// API key: GEMINI_API_KEY (configure na Vercel/env)

interface GeminiPart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiRequest {
  contents: GeminiContent[];
  systemInstruction?: { parts: { text: string }[] };
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
      role?: string;
    };
    finishReason?: string;
  }>;
  error?: { message: string; code: number };
}

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.5-flash";

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY não configurada. Adicione a variável de ambiente GEMINI_API_KEY no painel da Vercel (Settings → Environment Variables)."
    );
  }
  return key;
}

async function callGemini(
  model: string,
  body: GeminiRequest
): Promise<string> {
  const apiKey = getApiKey();
  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;

  // 25s timeout — Vercel functions have 30s max on free plan
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorText}`);
  }

  const data: GeminiResponse = await res.json();
  if (data.error) {
    throw new Error(`Gemini error: ${data.error.message}`);
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text || "")
    .join("")
    .trim();

  return text || "";
}

// ---- Compat layer: same interface as z-ai-web-dev-sdk used to expose ----
interface ChatMessageInput {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionRequest {
  messages: ChatMessageInput[];
  temperature?: number;
  max_tokens?: number;
  model?: string;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: { role: string; content: string };
  }>;
}

function messagesToGemini(messages: ChatMessageInput[]): {
  systemInstruction?: { parts: { text: string }[] };
  contents: GeminiContent[];
} {
  let systemInstruction: { parts: { text: string }[] } | undefined;
  const contents: GeminiContent[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      systemInstruction = { parts: [{ text: msg.content }] };
    } else {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  }

  return { systemInstruction, contents };
}

function multimodalToGemini(messages: ChatMessageInput[]): GeminiContent[] {
  // Convert OpenAI-style multimodal messages to Gemini format
  const contents: GeminiContent[] = [];
  for (const msg of messages) {
    const content = msg.content as any;
    if (typeof content === "string") {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: content }],
      });
    } else if (Array.isArray(content)) {
      // OpenAI multimodal: [{type:"text", text:...}, {type:"image_url", image_url:{url:data:image/...;base64,...}}]
      const parts: GeminiPart[] = [];
      for (const item of content) {
        if (item.type === "text") {
          parts.push({ text: item.text });
        } else if (item.type === "image_url") {
          const url = item.image_url?.url || "";
          const match = url.match(/^data:(image\/[a-z]+);base64,(.+)$/);
          if (match) {
            parts.push({
              inline_data: {
                mime_type: match[1],
                data: match[2],
              },
            });
          }
        }
      }
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts,
      });
    }
  }
  return contents;
}

// Compat object mimicking z-ai-web-dev-sdk chat.completions.create
const zaiCompat = {
  chat: {
    completions: {
      create: async (req: ChatCompletionRequest): Promise<ChatCompletionResponse> => {
        const { systemInstruction, contents } = messagesToGemini(req.messages);
        const text = await callGemini(req.model || DEFAULT_MODEL, {
          contents,
          systemInstruction,
          generationConfig: {
            temperature: req.temperature ?? 0.6,
            maxOutputTokens: req.max_tokens ?? 600,
          },
        });
        return {
          choices: [{ message: { role: "assistant", content: text } }],
        };
      },
      createVision: async (req: any): Promise<ChatCompletionResponse> => {
        const contents = multimodalToGemini(req.messages);
        const text = await callGemini(DEFAULT_MODEL, {
          contents,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 800,
          },
        });
        return {
          choices: [{ message: { role: "assistant", content: text } }],
        };
      },
    },
  },
};

// ---- Public API (same as before, unchanged signature) ----
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
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

export function buildSystemPrompt(agent: any, ragContext: string): string {
  const languages = (agent.languages || "pt").split(",").join(", ");
  const styleText =
    STYLE_INSTRUCTIONS[agent.personaStyle as string] || STYLE_INSTRUCTIONS.amigavel;
  const emotionText =
    EMOTION_INSTRUCTIONS[agent.personaEmotion as string] ||
    EMOTION_INSTRUCTIONS.neutro;

  let prompt = `Você é ${agent.personaName}, ${agent.personaRole}.${
    agent.personaDesc ? ` ${agent.personaDesc}` : ""
  }

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
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-8),
    { role: "user", content: userMessage },
  ];

  let attempts = 0;
  let lastError: any;
  while (attempts < 3) {
    try {
      const completion = await zaiCompat.chat.completions.create({
        messages,
        temperature: CREATIVITY_TEMP["media"],
        max_tokens: 600,
      });
      const content = completion.choices?.[0]?.message?.content;
      return content || "Não consegui gerar uma resposta. Tente reformular sua pergunta.";
    } catch (err: any) {
      lastError = err;
      console.error("[chatComplete] Gemini API error:", err?.message || err);
      console.error("[chatComplete] Status:", err?.status);
      const msg = String(err?.message || err);
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        attempts++;
        await new Promise((r) => setTimeout(r, 1000 * attempts));
        continue;
      }
      // Return error message directly so user can see it on screen for debugging
      const errMsg = err?.message || String(err);
      return `⚠️ [DEBUG Gemini error] ${errMsg.slice(0, 500)}`;
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

export async function verifyPixReceipt(
  imageBase64: string,
  expectedAmount?: number
): Promise<PixVerificationResult> {
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

${
    expectedAmount
      ? `O valor esperado é R$ ${expectedAmount.toFixed(2)}. Verifique se o valor pago corresponde.`
      : ""
  }

Retorne APENAS o JSON, sem texto adicional.`;

  try {
    const completion = await zaiCompat.chat.completions.createVision({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageData } },
          ],
        },
      ],
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
    console.error("[verifyPixReceipt] error:", err);
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