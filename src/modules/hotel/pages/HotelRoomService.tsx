import { useState } from "react";
import {
  ShoppingBag, Clock, CheckCircle2, ChefHat, Plus, Minus,
  BedDouble, Filter, Utensils, Coffee, Wine, Package, X, Bell
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type OrderStatus = "pending" | "preparing" | "delivered" | "cancelled";

interface OrderItem { name: string; qty: number; price: number; }
interface RoomOrder {
  id: string;
  roomNumber: string;
  guestName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  time: string;
  note?: string;
}

interface MenuItem { id: string; name: string; price: number; category: string; emoji: string; }

const MENU: MenuItem[] = [
  { id: "m1",  name: "Café Nespresso",     price: 3500,  category: "Boissons",    emoji: "☕" },
  { id: "m2",  name: "Jus d'Orange frais", price: 5000,  category: "Boissons",    emoji: "🍊" },
  { id: "m3",  name: "Eau Minérale 1L",    price: 2500,  category: "Boissons",    emoji: "💧" },
  { id: "m4",  name: "Bière Locale",       price: 4500,  category: "Boissons",    emoji: "🍺" },
  { id: "m5",  name: "Omelette du Chef",   price: 8500,  category: "Petit-déj.",  emoji: "🍳" },
  { id: "m6",  name: "Assiette de Fruits", price: 7000,  category: "Petit-déj.",  emoji: "🍓" },
  { id: "m7",  name: "Croissants ×3",      price: 6000,  category: "Petit-déj.",  emoji: "🥐" },
  { id: "m8",  name: "Thiéboudienne",      price: 12000, category: "Plats",       emoji: "🍚" },
  { id: "m9",  name: "Poulet Yassa",       price: 11000, category: "Plats",       emoji: "🍗" },
  { id: "m10", name: "Plateau Fromages",   price: 9500,  category: "Plats",       emoji: "🧀" },
  { id: "m11", name: "Glace 2 boules",     price: 5500,  category: "Desserts",    emoji: "🍦" },
  { id: "m12", name: "Gâteau Chocolat",    price: 7500,  category: "Desserts",    emoji: "🎂" },
];

const MOCK_ORDERS: RoomOrder[] = [
  { id: "ORD001", roomNumber: "201", guestName: "Amadou Diallo", items: [{ name: "Café Nespresso", qty: 2, price: 3500 }, { name: "Croissants ×3", qty: 1, price: 6000 }], total: 13000, status: "pending", time: "08:32", note: "Pas trop de sucre" },
  { id: "ORD002", roomNumber: "302", guestName: "Awa Traoré", items: [{ name: "Thiéboudienne", qty: 2, price: 12000 }], total: 24000, status: "preparing", time: "12:15" },
  { id: "ORD003", roomNumber: "101", guestName: "Marie Kouassi", items: [{ name: "Eau Minérale 1L", qty: 3, price: 2500 }, { name: "Bière Locale", qty: 2, price: 4500 }], total: 16500, status: "delivered", time: "14:40" },
];

const statusCfg: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending:   { label: "En attente",  color: "bg-amber-100 text-amber-800 border-amber-200",   icon: Clock },
  preparing: { label: "En préparation", color: "bg-blue-100 text-blue-800 border-blue-200",  icon: ChefHat },
  delivered: { label: "Livré",       color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
  cancelled: { label: "Annulé",      color: "bg-slate-100 text-slate-500 border-slate-200",  icon: X },
};

const STATUS_NEXT: Record<OrderStatus, OrderStatus | null> = {
  pending: "preparing",
  preparing: "delivered",
  delivered: null,
  cancelled: null,
};

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " CFA";

export default function HotelRoomService() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<RoomOrder[]>(MOCK_ORDERS);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderRoom, setOrderRoom] = useState("");
  const [orderGuest, setOrderGuest] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [menuCategory, setMenuCategory] = useState("all");

  const categories = ["all", ...new Set(MENU.map(i => i.category))];
  const filteredMenu = menuCategory === "all" ? MENU : MENU.filter(i => i.category === menuCategory);
  const cartTotal = Object.entries(cart).reduce((s, [id, qty]) => {
    const item = MENU.find(m => m.id === id);
    return s + (item ? item.price * qty : 0);
  }, 0);
  const cartItems = Object.entries(cart).filter(([, qty]) => qty > 0).length;

  const advance = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const next = STATUS_NEXT[o.status];
      if (!next) return o;
      toast({ title: `Commande ${o.id}`, description: `Statut → ${statusCfg[next].label}` });
      return { ...o, status: next };
    }));
  };

  const submitOrder = () => {
    if (!orderRoom || !orderGuest || cartItems === 0) return;
    const items: OrderItem[] = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const m = MENU.find(x => x.id === id)!;
        return { name: m.name, qty, price: m.price };
      });
    const newOrder: RoomOrder = {
      id: `ORD${String(orders.length + 1).padStart(3, "0")}`,
      roomNumber: orderRoom, guestName: orderGuest, items,
      total: cartTotal, status: "pending",
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      note: orderNote || undefined,
    };
    setOrders([newOrder, ...orders]);
    setCart({}); setOrderRoom(""); setOrderGuest(""); setOrderNote("");
    setIsOrderOpen(false);
    toast({ title: "Commande créée", description: `Chambre ${orderRoom} — ${fmt(cartTotal)}` });
  };

  const filtered = orders.filter(o => filterStatus === "all" || o.status === filterStatus);
  const pending = orders.filter(o => o.status === "pending").length;
  const preparing = orders.filter(o => o.status === "preparing").length;
  const delivered = orders.filter(o => o.status === "delivered").length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Utensils className="h-7 w-7 text-pink-600" /> Room Service
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Commandes en chambre — liaison directe à la facturation.</p>
        </div>
        <Button className="bg-pink-600 hover:bg-pink-700 text-white gap-2 shadow-lg shadow-pink-200" onClick={() => setIsOrderOpen(true)}>
          <Plus className="h-4 w-4" /> Nouvelle Commande
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="En attente" value={String(pending)} icon={Bell} iconClassName="bg-amber-100 text-amber-600" />
        <StatCard title="En préparation" value={String(preparing)} icon={ChefHat} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="Livrées" value={String(delivered)} changeType="positive" icon={CheckCircle2} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="CA Room Service" value={fmt(orders.filter(o => o.status === "delivered").reduce((s, o) => s + o.total, 0))}
          icon={ShoppingBag} iconClassName="bg-pink-100 text-pink-600" />
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les commandes</SelectItem>
            {Object.entries(statusCfg).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Orders */}
      <div className="space-y-3">
        {filtered.map(order => {
          const cfg = statusCfg[order.status];
          const Icon = cfg.icon;
          const next = STATUS_NEXT[order.status];
          return (
            <Card key={order.id} className="border-none shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4 text-pink-600" />
                        <span className="font-black text-lg">Ch. {order.roomNumber}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">— {order.guestName}</span>
                      <Badge className={`text-[10px] border ${cfg.color} flex items-center gap-1`}>
                        <Icon className="h-3 w-3" /> {cfg.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">{order.time}</span>
                    </div>
                    <div className="space-y-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-slate-600">{item.qty}× {item.name}</span>
                          <span className="font-semibold">{fmt(item.price * item.qty)}</span>
                        </div>
                      ))}
                      {order.note && (
                        <p className="text-xs text-muted-foreground italic mt-1">📝 {order.note}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-lg font-black text-pink-700">{fmt(order.total)}</p>
                    {next && (
                      <Button size="sm" className="gap-1" onClick={() => advance(order.id)}>
                        {next === "preparing" && <><ChefHat className="h-3 w-3" /> Prendre en charge</>}
                        {next === "delivered" && <><CheckCircle2 className="h-3 w-3" /> Marquer livré</>}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune commande.</p>
          </div>
        )}
      </div>

      {/* New Order Modal */}
      {isOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="font-black text-lg">Nouvelle commande room service</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOrderOpen(false)}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">N° Chambre</p>
                  <Input placeholder="ex: 201" value={orderRoom} onChange={e => setOrderRoom(e.target.value)} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Nom du client</p>
                  <Input placeholder="Nom du client" value={orderGuest} onChange={e => setOrderGuest(e.target.value)} />
                </div>
              </div>

              {/* Menu by category */}
              <div className="flex gap-2 flex-wrap">
                {categories.map(c => (
                  <Button key={c} size="sm" variant={menuCategory === c ? "default" : "outline"}
                    onClick={() => setMenuCategory(c)} className="text-xs">
                    {c === "all" ? "Tout" : c}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredMenu.map(item => (
                  <div key={item.id} className="border rounded-xl p-3 hover:border-pink-300 transition-colors">
                    <div className="text-2xl mb-1">{item.emoji}</div>
                    <p className="text-xs font-bold leading-tight">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{fmt(item.price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button size="icon" variant="outline" className="h-6 w-6 rounded-full"
                        onClick={() => setCart(c => ({ ...c, [item.id]: Math.max(0, (c[item.id] || 0) - 1) }))}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-bold w-4 text-center">{cart[item.id] || 0}</span>
                      <Button size="icon" variant="outline" className="h-6 w-6 rounded-full"
                        onClick={() => setCart(c => ({ ...c, [item.id]: (c[item.id] || 0) + 1 }))}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Note / Instructions</p>
                <Input placeholder="Instructions spéciales..." value={orderNote} onChange={e => setOrderNote(e.target.value)} />
              </div>

              <div className="bg-pink-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{cartItems} article{cartItems > 1 ? "s" : ""} sélectionné{cartItems > 1 ? "s" : ""}</p>
                  <p className="text-xl font-black text-pink-700">{fmt(cartTotal)}</p>
                </div>
                <Button className="bg-pink-600 hover:bg-pink-700 text-white" onClick={submitOrder}
                  disabled={!orderRoom || !orderGuest || cartItems === 0}>
                  Envoyer la commande
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
