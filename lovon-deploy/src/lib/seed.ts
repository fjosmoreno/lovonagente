import { db } from "./db";
import { hashPassword } from "./auth";

// Promise-based singleton to prevent race conditions during seeding
let seedPromise: Promise<void> | null = null;

export async function seedDemoData() {
  if (seedPromise) return seedPromise;
  seedPromise = doSeed();
  return seedPromise;
}

async function doSeed() {
  // Check if any agent with handle "demo" exists
  const existing = await db.agent.findUnique({ where: { handle: "demo" } });
  if (existing) {
    return;
  }

  // Create demo user
  const passwordHash = hashPassword("demo123");
  const user = await db.user.create({
    data: {
      email: "demo@lovon.com",
      name: "Ana Martins",
      passwordHash,
      emailVerified: true,
    },
  });

  const agent = await db.agent.create({
    data: {
      userId: user.id,
      lovonUrl: "lovon.com.br/anamartins",
      handle: "demo",
      personaName: "Ana Martins",
      personaRole: "Especialista em Marketing Digital",
      personaDesc: "Ajudo criadores e pequenos negócios a crescerem com estratégias de marketing digital, conteúdo e tráfego pago. Mais de 8 anos de experiência transformando marcas em referências.",
      personaStyle: "inspirador",
      personaEmotion: "entusiasta",
      creativity: "media",
      languages: "pt,en",
      primaryColor: "#FF6600",
      forcedTheme: "dark",
      widgetText: "Materiais e mentorias selecionados",
      aiMode: "restrito",
      leadCapture: true,
      pixEnabled: true,
      pixAmount: 49.9,
      pixKey: "ana.martins@lovon.com",
      pixReceiverName: "Ana Martins Marketing",
      pixBank: "Nubank",
      pixWhatsapp: "+5511999998888",
      pixInstructions: "Para liberar o contato, faça um PIX de R$ {valor} para a chave {chave} ({nome}). Após pagar, envie o comprovante aqui.",
      pixSuccessMsg: "Pagamento confirmado! Aqui está meu WhatsApp: {whatsapp}",
      vipEnabled: true,
      vipTriggerMsg: "Tenho um conteúdo VIP exclusivo com meus melhores cases e planilillas. Quer acessar?",
      vipPhrase: "quero vip",
      webhookUrl: null,
      totalVisitors: 142,
    },
  });

  // Knowledge sources
  await db.knowledgeSource.createMany({
    data: [
      {
        agentId: agent.id,
        type: "text",
        title: "Sobre Ana Martins",
        content: "Ana Martins é especialista em marketing digital com mais de 8 anos de experiência. Trabalhou com mais de 200 marcas, do varejo ao digital. Suas especialidades incluem: tráfego pago (Meta e Google Ads), estratégia de conteúdo, funis de vendas, branding e posicionamento. É certificada em Google Ads e Meta Blueprint.",
      },
      {
        agentId: agent.id,
        type: "faq",
        title: "Como funciona a mentoria?",
        content: "A mentoria acontece online, em encontros semanais de 1 hora via Zoom. Inclui análise do seu negócio, plano de ação personalizado, suporte via WhatsApp entre encontros e acesso aos materiais. Duração mínima de 3 meses.",
        faqQ: "Como funciona a mentoria?",
        faqA: "A mentoria acontece online, em encontros semanais de 1 hora via Zoom. Inclui análise do seu negócio, plano de ação personalizado, suporte via WhatsApp entre encontros e acesso aos materiais. Duração mínima de 3 meses.",
      },
      {
        agentId: agent.id,
        type: "faq",
        title: "Quais serviços você oferece?",
        content: "Ofereço: mentoria individual, consultoria de tráfego pago, auditoria de redes sociais, criação de estratégia de conteúdo e curso completo de marketing digital. Também tenho produtos digitais como ebooks e planilhas.",
        faqQ: "Quais serviços você oferece?",
        faqA: "Ofereço: mentoria individual, consultoria de tráfego pago, auditoria de redes sociais, criação de estratégia de conteúdo e curso completo de marketing digital. Também tenho produtos digitais como ebooks e planilhas.",
      },
      {
        agentId: agent.id,
        type: "faq",
        title: "Qual o preço da mentoria?",
        content: "A mentoria individual custa R$ 497 por mês, com encontros semanais. O pacote de 3 meses tem 10% de desconto. A consultoria pontual de tráfego pago custa R$ 297.",
        faqQ: "Qual o preço da mentoria?",
        faqA: "A mentoria individual custa R$ 497 por mês, com encontros semanais. O pacote de 3 meses tem 10% de desconto. A consultoria pontual de tráfego pago custa R$ 297.",
      },
      {
        agentId: agent.id,
        type: "faq",
        title: "Como posso falar com você?",
        content: "Você pode falar comigo pelo WhatsApp após o pagamento do VIP, ou pelo email ana@lovon.com. Para parcerias, prefiro contato pelo Instagram @anamartins.",
        faqQ: "Como posso falar com você?",
        faqA: "Você pode falar comigo pelo WhatsApp após o pagamento do VIP, ou pelo email ana@lovon.com. Para parcerias, prefiro contato pelo Instagram @anamartins.",
      },
      {
        agentId: agent.id,
        type: "text",
        title: "Horário de atendimento",
        content: "Atendo de segunda a sexta, das 9h às 18h. Respondo mensagens em até 2 horas durante o expediente. Aos finais de semana o atendimento é apenas para emergências de tráfego pago de clientes ativos.",
      },
      {
        agentId: agent.id,
        type: "text",
        title: "Métodos de pagamento",
        content: "Aceito PIX (com 5% de desconto), cartão de crédito em até 12x e boleto. Para mentorias, o pagamento é recorrente mensal. Todos os produtos digitais têm garantia de 7 dias.",
      },
    ],
  });

  // Products
  await db.product.createMany({
    data: [
      {
        agentId: agent.id,
        name: "Mentoria Individual de Marketing",
        description: "Encontros semanais de 1h com plano personalizado, suporte via WhatsApp e acesso a todos os materiais. Transforme seu negócio em 3 meses.",
        price: 497,
        comparePrice: 697,
        category: "Mentoria",
        badge: "Mais vendido",
        rating: 4.9,
        reviewCount: 87,
        featured: true,
        active: true,
        externalUrl: "https://lovon.com.br/anamartins/mentoria",
      },
      {
        agentId: agent.id,
        name: "Curso Completo de Tráfego Pago",
        description: "12 módulos cobrindo Meta Ads e Google Ads do básico ao avançado. Inclui templates, planilhas e certificado.",
        price: 297,
        comparePrice: 497,
        category: "Curso",
        badge: "Promoção",
        rating: 4.8,
        reviewCount: 234,
        featured: true,
        active: true,
        externalUrl: "https://lovon.com.br/anamartins/curso",
      },
      {
        agentId: agent.id,
        name: "Ebook: Funil de Vendas Digital",
        description: "Guia completo de 120 páginas com estratégias de funis validadas em mais de 200 negócios. Inclui 15 templates.",
        price: 47,
        comparePrice: 97,
        category: "Ebook",
        rating: 4.7,
        reviewCount: 156,
        featured: false,
        active: true,
      },
      {
        agentId: agent.id,
        name: "Consultoria Pontual de Tráfego",
        description: "Análise completa das suas campanhas atuais com plano de otimização. Sessão única de 90 minutos.",
        price: 297,
        category: "Consultoria",
        rating: 5.0,
        reviewCount: 42,
        featured: false,
        active: true,
      },
      {
        agentId: agent.id,
        name: "Pack de Planilhas de Gestão",
        description: "8 planilhas profissionais: calendário de conteúdo, gestão de anúncios, ROI, métricas e mais.",
        price: 67,
        comparePrice: 127,
        category: "Ferramenta",
        badge: "Novo",
        rating: 4.6,
        reviewCount: 78,
        featured: false,
        active: true,
      },
      {
        agentId: agent.id,
        name: "Auditoria de Redes Sociais",
        description: "Análise completa do seu Instagram, posicionamento, conteúdo e estratégia. Relatório detalhado + plano de ação.",
        price: 197,
        category: "Consultoria",
        rating: 4.9,
        reviewCount: 53,
        featured: false,
        active: true,
      },
    ],
  });

  // Sample conversations
  const convo = await db.conversation.create({
    data: {
      agentId: agent.id,
      visitorId: "visitante-001",
      visitorIp: "127.0.0.1",
    },
  });
  await db.message.createMany({
    data: [
      { conversationId: convo.id, role: "user", content: "Olá! Quero saber sobre a mentoria" },
      { conversationId: convo.id, role: "assistant", content: "Olá! Que ótimo que tem interesse na mentoria! Ela acontece online com encontros semanais de 1 hora via Zoom, inclui plano de ação personalizado e suporte via WhatsApp. O valor é R$ 497/mês. Quer saber mais?", sources: JSON.stringify([{ id: "faq-mentoria", title: "Como funciona a mentoria?", type: "faq" }]) },
      { conversationId: convo.id, role: "user", content: "Quais são os horários?" },
      { conversationId: convo.id, role: "assistant", content: "Atendo de segunda a sexta, das 9h às 18h. Os encontros da mentoria são agendados conforme sua disponibilidade dentro desse horário.", sources: JSON.stringify([{ id: "horario", title: "Horário de atendimento", type: "text" }]) },
    ],
  });
}
