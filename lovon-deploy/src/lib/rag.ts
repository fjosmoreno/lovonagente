import { db } from "./db";
import { normalize, tokenize } from "./lovon-utils";

// Synonym groups - words that mean the same in this domain
const SYNONYM_GROUPS: string[][] = [
  ["preco", "valor", "custo", "quanto", "preco", "valor"],
  ["comprar", "compra", "adquirir", "pegar", "obter"],
  ["pagar", "pagamento", "pix", "transferencia"],
  ["whatsapp", "zap", "contato", "telefone", "numero"],
  ["produto", "item", "oferta", "servico"],
  ["horario", "funcionamento", "atende", "disponivel"],
  ["duvida", "pergunta", "questao", "ajuda"],
  ["curso", "aula", "video", "treinamento", "licao"],
  ["desconto", "promocao", "oferta", "barato"],
  ["entrega", "envio", "prazo", "frete"],
  ["agendar", "marcar", "horario", "reuniao"],
  ["vip", "exclusivo", "premium"],
];

const PURCHASE_INTENT_WORDS = ["comprar", "compra", "preco", "valor", "quanto custa", "adquirir", "pegar", "pagar", "pix", "desconto", "oferta", "quero", "quero comprar"];
const OFF_TOPIC_HINTS = ["politica", "futebol", "tempo", "clima", "noticia", "piada", "religiao"];

export interface ScoredSource {
  id: string;
  title: string;
  content: string;
  type: string;
  score: number;
  matchedTokens: string[];
}

export interface RagResult {
  sources: ScoredSource[];
  hasPurchaseIntent: boolean;
  isOffTopic: boolean;
  hasResults: boolean;
}

function getSynonyms(token: string): string[] {
  const result: string[] = [token];
  for (const group of SYNONYM_GROUPS) {
    if (group.includes(token)) {
      result.push(...group.filter((w) => w !== token));
    }
  }
  return [...new Set(result)];
}

export function detectPurchaseIntent(query: string): boolean {
  const q = normalize(query);
  return PURCHASE_INTENT_WORDS.some((w) => q.includes(w));
}

export function detectOffTopic(query: string): boolean {
  const q = normalize(query);
  return OFF_TOPIC_HINTS.some((w) => q.includes(w)) && !q.includes("produto") && !q.includes("preco");
}

function scoreContent(queryTokens: string[], content: string, title: string): { score: number; matched: string[] } {
  const normContent = normalize(content);
  const normTitle = normalize(title);
  let score = 0;
  const matched = new Set<string>();

  for (const token of queryTokens) {
    const synonyms = getSynonyms(token);
    // content token match (peso 2)
    if (normContent.includes(token)) {
      score += 2;
      matched.add(token);
    }
    // title token match (peso 4)
    if (normTitle.includes(token)) {
      score += 4;
      matched.add(token);
    }
    // substring match (peso 5) - multi-word phrases
    if (token.length > 3 && (normContent.includes(token) || normTitle.includes(token))) {
      score += 1; // small bonus already counted above
    }
    // synonym group match (peso 6)
    for (const syn of synonyms) {
      if (syn !== token && (normContent.includes(syn) || normTitle.includes(syn))) {
        score += 6;
        matched.add(token);
        break;
      }
    }
  }

  // multi-token phrase substring bonus (peso 5)
  if (queryTokens.length > 1) {
    const phrase = queryTokens.join(" ");
    if (normContent.includes(phrase)) score += 5;
    if (normTitle.includes(phrase)) score += 5;
  }

  return { score, matched: [...matched] };
}

export async function retrieveKnowledge(agentId: string, query: string): Promise<RagResult> {
  const queryTokens = tokenize(query);
  const hasPurchaseIntent = detectPurchaseIntent(query);
  const isOffTopic = detectOffTopic(query);

  const sources = await db.knowledgeSource.findMany({
    where: { agentId },
  });

  const scored: ScoredSource[] = sources.map((s) => {
    const fullContent = s.type === "faq" && s.faqQ && s.faqA ? `${s.faqQ} ${s.faqA}` : s.content;
    const titleText = s.type === "faq" && s.faqQ ? s.faqQ : s.title;
    const { score, matched } = scoreContent(queryTokens, fullContent, titleText);
    return {
      id: s.id,
      title: titleText,
      content: fullContent,
      type: s.type,
      score,
      matchedTokens: matched,
    };
  });

  let top = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);

  // If purchase intent, also include products as knowledge
  if (hasPurchaseIntent) {
    const products = await db.product.findMany({
      where: { agentId, active: true },
    });
    const productSources: ScoredSource[] = products.map((p) => {
      const fullContent = `${p.name}. ${p.description}. Preço: R$ ${p.price.toFixed(2)}${p.comparePrice ? ` (de R$ ${p.comparePrice.toFixed(2)})` : ""}${p.category ? `. Categoria: ${p.category}` : ""}${p.badge ? `. ${p.badge}` : ""}${p.externalUrl ? `. Disponível em: ${p.externalUrl}` : ""}`;
      const { score, matched } = scoreContent(queryTokens, fullContent, p.name);
      return {
        id: `product-${p.id}`,
        title: p.name,
        content: fullContent,
        type: "product",
        score: score + 2, // slight boost for products when purchase intent
        matchedTokens: matched,
      };
    });
    const topProducts = productSources.filter((s) => s.score > 2).sort((a, b) => b.score - a.score).slice(0, 3);
    top = [...top, ...topProducts].sort((a, b) => b.score - a.score).slice(0, 4);
  }

  return {
    sources: top,
    hasPurchaseIntent,
    isOffTopic,
    hasResults: top.length > 0,
  };
}

export function buildContext(sources: ScoredSource[]): string {
  if (sources.length === 0) return "";
  const parts = sources.map((s, i) => `[Fonte ${i + 1}: ${s.title}]\n${s.content}`);
  return parts.join("\n\n");
}

export const FALLBACK_MESSAGE =
  "Desculpe, não tenho informações sobre isso na minha base de conhecimento. Posso te ajudar com perguntas relacionadas ao meu trabalho, produtos e serviços. O que você gostaria de saber?";
