"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MessageCircle, Star, ShoppingCart, ExternalLink, X, Send, Sparkles, Loader2, ShieldCheck, Package } from "lucide-react";
import { toast } from "sonner";
import { ChatView } from "./chat-view";

export function ShopView({ handle }: { handle: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState<string[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/chat/products?handle=${handle}`).then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, [handle]);

  const products = data?.products || [];
  const agent = data?.agent || {};
  const categories = ["all", ...Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)))];
  const featured = products.filter((p: any) => p.featured);
  const regular = products.filter((p: any) => !p.featured);

  const filtered = (category === "all" ? products : products.filter((p: any) => p.category === category))
    .filter((p: any) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()));

  function addToCart(id: string) {
    setCart((c) => [...c, id]);
    toast.success("Adicionado ao carrinho");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

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
          {cart.length > 0 && (
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-[10px] flex items-center justify-center text-primary-foreground font-bold">{cart.length}</span>
            </div>
          )}
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
                  {featured.map((p: any) => <ProductCard key={p.id} p={p} onAdd={addToCart} onClick={() => setSelectedProduct(p)} />)}
                </div>
              </section>
            )}
            <section>
              {featured.length > 0 && category === "all" && !search && <h2 className="text-sm font-semibold mb-3">Todos os produtos</h2>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(category === "all" && !search ? regular : filtered).map((p: any) => <ProductCard key={p.id} p={p} onAdd={addToCart} onClick={() => setSelectedProduct(p)} />)}
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

      {/* Floating chat widget */}
      {chatOpen ? (
        <div className="fixed inset-0 z-50 md:bottom-4 md:right-4 md:inset-auto md:w-96 md:h-[520px] md:rounded-2xl md:shadow-2xl md:border md:border-border overflow-hidden bg-background">
          <div className="relative h-full">
            <button onClick={() => setChatOpen(false)} className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-foreground bg-background/80 rounded-full p-1 md:hidden">
              <X className="w-5 h-5" />
            </button>
            <div className="h-full overflow-hidden">
              <ChatView handle={handle} />
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setChatOpen(true)} className="fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform animate-pulse-ring">
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Product detail modal */}
      <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={addToCart} onChat={() => setChatOpen(true)} />
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

function ProductCard({ p, onAdd, onClick }: { p: any; onAdd: (id: string) => void; onClick: () => void }) {
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
          <Button size="sm" className="flex-1 h-8 group-hover:shadow-md transition-shadow" onClick={(e) => { e.stopPropagation(); onAdd(p.id); }}><ShoppingCart className="w-3.5 h-3.5 mr-1" /> Add</Button>
          {p.externalUrl && (
            <Button size="sm" variant="outline" className="h-8 px-2" onClick={(e) => { e.stopPropagation(); window.open(p.externalUrl, "_blank"); }}><ExternalLink className="w-3.5 h-3.5" /></Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ProductDetailModal({ product, onClose, onAdd, onChat }: { product: any; onClose: () => void; onAdd: (id: string) => void; onChat: () => void }) {
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
            <Button className="flex-1" onClick={() => { onAdd(product.id); onClose(); }}>
              <ShoppingCart className="w-4 h-4 mr-2" /> Adicionar ao carrinho
            </Button>
            <Button variant="outline" onClick={() => { onChat(); onClose(); }}>
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
