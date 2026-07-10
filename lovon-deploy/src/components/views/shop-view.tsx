"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MessageCircle, Star, ShoppingCart, ExternalLink, X, Send, Sparkles, Loader2, ShieldCheck, Package, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { ChatView } from "./chat-view";
import { createCartStore } from "@/lib/cart-store";

export function ShopView({ handle }: { handle: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [chatOpen, setChatOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // One cart store per handle, persisted in localStorage
  const useCart = useMemo(() => createCartStore(handle), [handle]);
  const cart = useCart();

  useEffect(() => {
    fetch(`/api/chat/products?handle=${handle}`).then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, [handle]);

  const products = data?.products || [];
  const agent = data?.agent || {};
  const categories: string[] = ["all", ...Array.from(new Set(products.map((p: any) => p.category).filter(Boolean) as string[]))];
  const featured = products.filter((p: any) => p.featured);
  const regular = products.filter((p: any) => !p.featured);

  const filtered = (category === "all" ? products : products.filter((p: any) => p.category === category))
    .filter((p: any) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()));

  function addToCart(p: any) {
    cart.add({
      id: p.id,
      name: p.name,
      price: p.price,
      imageBase64: p.imageBase64,
      category: p.category,
    });
    toast.success("Adicionado ao carrinho");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const cartCount = cart.count();
  const cartTotal = cart.total();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Sticky nav */}
      <nav className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/30 shrink-0">
            {agent.avatarBase64 ? <img src={agent.avatarBase64} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary flex items-center justify-center text-black font-bold">{agent.personaName?.[0] || "L"}</div>}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm truncate">{agent.personaName}</div>
            <div className="text-xs text-muted-foreground truncate">{agent.widgetText || agent.personaRole}</div>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Abrir carrinho"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary text-[10px] flex items-center justify-center text-primary-foreground font-bold px-1">{cartCount}</span>
            )}
          </button>
          <Button size="sm" onClick={() => setChatOpen(true)}><MessageCircle className="w-4 h-4 mr-1" /> Falar com agente</Button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        {agent.heroImage ? (
          <img src={agent.heroImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${agent.primaryColor || "#FF6600"}, #1a0a05)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-white/20 shadow-2xl">
              {agent.avatarBase64 ? <img src={agent.avatarBase64} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary flex items-center justify-center text-black text-2xl font-black">{agent.personaName?.[0] || "L"}</div>}
            </div>
            <span className="absolute inset-0 rounded-full animate-ping-slow" style={{ boxShadow: `0 0 0 3px ${agent.primaryColor || "#FF6600"}` }} />
          </div>
          <Badge className="mb-2 gap-1 animate-badge-glow"><Sparkles className="w-3 h-3" /> Loja oficial</Badge>
          <h1 className="text-xl md:text-2xl font-black">{agent.personaName}</h1>
          <p className="text-sm text-muted-foreground">{agent.personaRole}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary" className="text-[10px] gap-1"><ShieldCheck className="w-3 h-3" /> Verificado</Badge>
            <Badge variant="secondary" className="text-[10px] gap-1"><Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Produtos selecionados</Badge>
          </div>
        </div>
      </div>

      {/* Search + filters */}
      <div className="sticky top-14 z-20 bg-background/90 backdrop-blur border-b border-border py-3">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produtos..." className="pl-9" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {categories.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-3 py-1 text-xs whitespace-nowrap transition-all ${category === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                {c === "all" ? "Todos" : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">Nenhum produto encontrado.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {featured.length > 0 && category === "all" && !search && (
              <section>
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-primary" /> Destaques</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featured.map((p: any) => <ProductCard key={p.id} p={p} onAdd={() => addToCart(p)} onClick={() => setSelectedProduct(p)} />)}
                </div>
              </section>
            )}
            <section>
              {featured.length > 0 && category === "all" && !search && <h2 className="text-sm font-semibold mb-3">Todos os produtos</h2>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(category === "all" && !search ? regular : filtered).map((p: any) => <ProductCard key={p.id} p={p} onAdd={() => addToCart(p)} onClick={() => setSelectedProduct(p)} />)}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Trust signals */}
      <section className="border-t border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              { icon: ShieldCheck, title: "Garantia de 7 dias", desc: "Não gostou? Devolvemos 100% do valor, sem perguntas." },
              { icon: Sparkles, title: "Acesso imediato", desc: "Receba seu produto na hora após a confirmação do pagamento." },
              { icon: MessageCircle, title: "Suporte direto", desc: "Tire dúvidas diretamente com o especialista pelo chat." },
            ].map((t) => (
              <div key={t.title} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <t.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.title}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold">Quem comprou recomenda</h3>
            <div className="flex items-center justify-center gap-1 mt-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />)}
              <span className="text-sm font-medium ml-1">4.9</span>
              <span className="text-xs text-muted-foreground">• baseado em 312 avaliações</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Carlos Mendes", role: "Empreendedor", text: "A mentoria mudou completamente minha estratégia. Em 30 dias triplicou meu faturamento!", initials: "CM", color: "bg-orange-500/20 text-orange-500" },
              { name: "Juliana Reis", role: "Coach", text: "O curso de tráfego pago é absurdamente completo. Vale cada centavo.", initials: "JR", color: "bg-purple-500/20 text-purple-500" },
              { name: "Pedro Alves", role: "Consultor", text: "Atendimento via IA impecável. Respondeu todas minhas dúvidas antes da compra.", initials: "PA", color: "bg-blue-500/20 text-blue-500" },
            ].map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-500 text-amber-500" />)}
                </div>
                <p className="text-sm text-foreground/80 italic mb-3">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${t.color} flex items-center justify-center text-xs font-bold`}>{t.initials}</div>
                  <div>
                    <div className="text-xs font-medium">{t.name}</div>
                    <div className="text-[10px] text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © 2025 {agent.personaName} • Powered by Lovon Agente
      </footer>

      {/* Floating chat button — only when chat is closed */}
      {!chatOpen && (
        <button onClick={() => setChatOpen(true)} className="fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform animate-pulse-ring">
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Cart drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart.items}
        total={cartTotal}
        onRemove={cart.remove}
        onSetQty={cart.setQty}
        onClear={cart.clear}
        agentWhatsapp={agent.pixWhatsapp}
        handle={handle}
        primaryColor={agent.primaryColor}
      />

      {/* Chat panel — mounted once, hidden via CSS to preserve state and avoid reload feel */}
      <div
        className={`fixed inset-0 z-50 md:bottom-4 md:right-4 md:inset-auto md:w-96 md:h-[600px] md:rounded-2xl md:shadow-2xl md:border md:border-border overflow-hidden bg-background transition-opacity duration-200 ${chatOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-hidden={!chatOpen}
      >
        <button onClick={() => setChatOpen(false)} className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-foreground bg-background/80 rounded-full p-1.5 hover:bg-background shadow-sm">
          <X className="w-5 h-5" />
        </button>
        <div className="h-full overflow-hidden">
          <ChatView handle={handle} />
        </div>
      </div>

      {/* Product detail modal */}
      <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={(p) => { addToCart(p); setSelectedProduct(null); }} onChat={() => { setChatOpen(true); setSelectedProduct(null); }} />
    </div>
  );
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  Mentoria: "linear-gradient(135deg, #FF6600, #FF9900)",
  Curso: "linear-gradient(135deg, #a855f7, #ec4899)",
  Ebook: "linear-gradient(135deg, #3b82f6, #06b6d4)",
  Consultoria: "linear-gradient(135deg, #10b981, #14b8a6)",
  Ferramenta: "linear-gradient(135deg, #f59e0b, #ef4444)",
  default: "linear-gradient(135deg, #2a2a2a, #1a1a1a)",
};

function ProductCard({ p, onAdd, onClick }: { p: any; onAdd: () => void; onClick: () => void }) {
  const discount = p.comparePrice ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100) : 0;
  const gradient = CATEGORY_GRADIENTS[p.category] || CATEGORY_GRADIENTS.default;
  return (
    <Card className="overflow-hidden group hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer" onClick={onClick}>
      <div className="aspect-square bg-muted relative overflow-hidden">
        {p.imageBase64 ? (
          <img src={p.imageBase64} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center relative" style={{ background: gradient }}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.4), transparent 50%)" }} />
            <Package className="w-10 h-10 text-white/40 mb-2 relative" />
            <span className="text-white/70 text-xs font-medium px-3 text-center relative line-clamp-2">{p.category || p.name}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {p.badge && <Badge className="absolute top-2 left-2 text-[10px] gap-1 shadow-lg"><Sparkles className="w-2.5 h-2.5" /> {p.badge}</Badge>}
        {discount > 0 && <Badge variant="destructive" className="absolute top-2 right-2 text-[10px] font-bold shadow-lg">-{discount}%</Badge>}
        {p.featured && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="text-[9px] gap-1 bg-black/60 backdrop-blur text-white border-0"><Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> Destaque</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-3.5">
        <div className="flex items-center justify-between mb-1">
          {p.category && <span className="text-[10px] text-primary font-semibold uppercase tracking-wide">{p.category}</span>}
          {p.rating > 0 && (
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span className="text-xs font-medium">{p.rating.toFixed(1)}</span>
              <span className="text-[10px] text-muted-foreground">({p.reviewCount})</span>
            </div>
          )}
        </div>
        <h3 className="font-semibold text-sm line-clamp-2 leading-snug min-h-[2.5rem]">{p.name}</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2rem]">{p.description}</p>
        <div className="flex items-baseline gap-1.5 mt-2.5">
          <span className="font-black text-base">R$ {p.price.toFixed(2)}</span>
          {p.comparePrice && <span className="text-xs text-muted-foreground line-through">R$ {p.comparePrice.toFixed(2)}</span>}
        </div>
        <div className="flex gap-1.5 mt-3">
          <Button size="sm" className="flex-1 h-8 group-hover:shadow-md transition-shadow" onClick={(e) => { e.stopPropagation(); onAdd(); }}><ShoppingCart className="w-3.5 h-3.5 mr-1" /> Add</Button>
          {p.externalUrl && (
            <Button size="sm" variant="outline" className="h-8 px-2" onClick={(e) => { e.stopPropagation(); window.open(p.externalUrl, "_blank"); }}><ExternalLink className="w-3.5 h-3.5" /></Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ProductDetailModal({ product, onClose, onAdd, onChat }: { product: any; onClose: () => void; onAdd: (p: any) => void; onChat: () => void }) {
  if (!product) return null;
  const discount = product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
  const gradient = CATEGORY_GRADIENTS[product.category] || CATEGORY_GRADIENTS.default;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in-up" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Image header */}
        <div className="relative aspect-[16/9] overflow-hidden rounded-t-2xl">
          {product.imageBase64 ? (
            <img src={product.imageBase64} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: gradient }}>
              <Package className="w-16 h-16 text-white/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-black/80 transition-colors">
            <X className="w-4 h-4" />
          </button>
          {product.badge && <Badge className="absolute top-3 left-3 gap-1 shadow-lg"><Sparkles className="w-3 h-3" /> {product.badge}</Badge>}
          {discount > 0 && <Badge variant="destructive" className="absolute top-3 right-14 text-xs font-bold shadow-lg">-{discount}%</Badge>}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {product.category && <span className="text-xs text-primary font-semibold uppercase tracking-wide">{product.category}</span>}
              <h2 className="text-xl font-black mt-1">{product.name}</h2>
              {product.rating > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                  ))}
                  <span className="text-xs font-medium ml-1">{product.rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({product.reviewCount} avaliações)</span>
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-baseline gap-1.5 justify-end">
                <span className="text-2xl font-black">R$ {product.price.toFixed(2)}</span>
              </div>
              {product.comparePrice && <span className="text-xs text-muted-foreground line-through">R$ {product.comparePrice.toFixed(2)}</span>}
            </div>
          </div>

          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-foreground/80 leading-relaxed">{product.description}</p>
          </div>

          {product.featured && (
            <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="text-xs font-medium">Produto em destaque — recomendado pelo especialista</span>
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <div className="text-[10px] text-muted-foreground">Garantia 7 dias</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
              <Sparkles className="w-4 h-4 text-primary mx-auto mb-1" />
              <div className="text-[10px] text-muted-foreground">Acesso imediato</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
              <MessageCircle className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <div className="text-[10px] text-muted-foreground">Suporte incluído</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={() => onAdd(product)}>
              <ShoppingCart className="w-4 h-4 mr-2" /> Adicionar ao carrinho
            </Button>
            <Button variant="outline" onClick={() => onChat()}>
              <MessageCircle className="w-4 h-4 mr-2" /> Tirar dúvidas
            </Button>
            {product.externalUrl && (
              <Button variant="secondary" onClick={() => window.open(product.externalUrl, "_blank")}>
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: { id: string; name: string; price: number; imageBase64?: string; category?: string; qty: number }[];
  total: number;
  onRemove: (id: string) => void;
  onSetQty: (id: string, qty: number) => void;
  onClear: () => void;
  primaryColor?: string;
  agentWhatsapp?: string;
  handle: string;
}

function CartDrawer({
  open, onClose, items, total, onRemove, onSetQty, onClear, primaryColor,
  agentWhatsapp, handle,
}: CartDrawerProps) {
  function buildWhatsappMessage(): string {
    const lines: string[] = [];
    lines.push(`Olá! Quero finalizar a compra na loja do *${handle}*:`);
    lines.push("");
    items.forEach((it) => {
      const subtotal = (it.price * it.qty).toFixed(2);
      lines.push(`• ${it.name} — R$ ${it.price.toFixed(2)}${it.qty > 1 ? ` x${it.qty}` : ""} = R$ ${subtotal}`);
    });
    lines.push("");
    lines.push(`*Total: R$ ${total.toFixed(2)}*`);
    return lines.join("\n");
  }

  function openWhatsapp() {
    if (!agentWhatsapp) {
      toast.error("WhatsApp do vendedor não configurado.");
      return;
    }
    const phone = agentWhatsapp.replace(/\D/g, "");
    const text = encodeURIComponent(buildWhatsappMessage());
    const url = `https://wa.me/${phone}?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Abrindo WhatsApp...");
  }

  return (
    <div className={`fixed inset-0 z-[55] transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} aria-hidden={!open}>
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* panel */}
      <div
        className={`absolute top-0 right-0 bottom-0 w-full sm:max-w-md bg-card border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-base">Seu carrinho</h2>
            <Badge variant="secondary" className="text-[10px]">{items.length} {items.length === 1 ? "item" : "itens"}</Badge>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent" aria-label="Fechar carrinho">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                <ShoppingCart className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">Seu carrinho está vazio</p>
              <p className="text-xs text-muted-foreground">Adicione produtos da loja pra começar.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((it) => (
                <div key={it.id} className="p-3 flex gap-3">
                  <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0 border border-border">
                    {it.imageBase64 ? (
                      <img src={it.imageBase64} alt={it.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {it.category && <div className="text-[10px] text-primary font-semibold uppercase tracking-wide">{it.category}</div>}
                        <h3 className="text-sm font-medium line-clamp-2">{it.name}</h3>
                        <div className="text-sm font-bold mt-0.5">R$ {it.price.toFixed(2)}</div>
                      </div>
                      <button onClick={() => onRemove(it.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive" aria-label="Remover">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <button onClick={() => onSetQty(it.id, it.qty - 1)} className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-accent" aria-label="Diminuir">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{it.qty}</span>
                      <button onClick={() => onSetQty(it.id, it.qty + 1)} className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-accent" aria-label="Aumentar">
                        <Plus className="w-3 h-3" />
                      </button>
                      <div className="ml-auto text-sm font-bold">R$ {(it.price * it.qty).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border p-4 space-y-3 bg-background">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <button onClick={onClear} className="hover:text-destructive underline-offset-2 hover:underline">Limpar carrinho</button>
              <div className="flex items-center gap-2">
                <span>Subtotal</span>
                <span className="text-base font-black text-foreground">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Primary CTA — open WhatsApp with the order pre-formatted */}
            <Button
              className="w-full h-12 text-sm font-semibold shadow-md"
              style={{ background: "#25D366" }}
              onClick={openWhatsapp}
              disabled={!agentWhatsapp}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {agentWhatsapp ? "Finalizar no WhatsApp" : "WhatsApp não configurado"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}