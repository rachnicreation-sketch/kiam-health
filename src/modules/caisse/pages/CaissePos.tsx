import { useState } from "react";
import { ShoppingCart, Plus, Minus, Trash2, Search, CreditCard, Banknote, Smartphone, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const catalog = [
  { id: "1", name: "Stylo Bic", price: 100, code: "STY001" },
  { id: "2", name: "Rame A4", price: 3500, code: "RAM001" },
  { id: "3", name: "Chemise plastique", price: 150, code: "CHE001" },
  { id: "4", name: "Carnet 100p", price: 800, code: "CAR001" },
  { id: "5", name: "Toner laser", price: 15000, code: "TON001" },
  { id: "6", name: "Clé USB 16Go", price: 4500, code: "USB001" },
];

interface CartItem { id: string; name: string; price: number; qty: number; }

export default function CaissePos() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<string | null>(null);

  const addToCart = (item: typeof catalog[0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.id !== id));
  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
  };

  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const filtered = catalog.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4 p-4">
      {/* Catalog */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Rechercher un article..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto">
          {filtered.map(item => (
            <button key={item.id} onClick={() => addToCart(item)}
              className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-blue-400 hover:shadow-md transition-all group">
              <p className="text-xs text-slate-400 font-mono">{item.code}</p>
              <p className="font-semibold text-slate-800 group-hover:text-blue-700 mt-1">{item.name}</p>
              <p className="text-blue-600 font-bold mt-2">{item.price.toLocaleString()} F</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="w-80 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-blue-600" />
            Panier ({cart.length})
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <p className="text-center text-slate-400 text-sm mt-10">Aucun article sélectionné</p>
          ) : cart.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                <p className="text-xs text-blue-600">{(item.price * item.qty).toLocaleString()} F</p>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button onClick={() => updateQty(item.id, -1)} className="h-6 w-6 rounded-md bg-slate-200 hover:bg-slate-300 flex items-center justify-center">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-sm font-bold w-5 text-center">{item.qty}</span>
                <button onClick={() => updateQty(item.id, 1)} className="h-6 w-6 rounded-md bg-slate-200 hover:bg-slate-300 flex items-center justify-center">
                  <Plus className="h-3 w-3" />
                </button>
                <button onClick={() => removeFromCart(item.id)} className="h-6 w-6 rounded-md bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center ml-1">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Total & Payment */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="flex justify-between text-lg font-bold text-slate-900">
            <span>TOTAL</span>
            <span className="text-blue-600">{total.toLocaleString()} F</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { mode: "cash", icon: <Banknote className="h-4 w-4" />, label: "Espèces" },
              { mode: "mobile", icon: <Smartphone className="h-4 w-4" />, label: "Mobile" },
              { mode: "card", icon: <CreditCard className="h-4 w-4" />, label: "Carte" },
            ].map(p => (
              <button key={p.mode} onClick={() => setPaymentMode(p.mode)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-xs font-medium transition-all ${paymentMode === p.mode ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                {p.icon}{p.label}
              </button>
            ))}
          </div>

          <Button className="w-full gap-2" disabled={cart.length === 0 || !paymentMode} size="lg">
            <CheckCircle className="h-4 w-4" /> Valider la Vente
          </Button>
        </div>
      </div>
    </div>
  );
}
