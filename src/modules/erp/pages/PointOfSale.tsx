import { useState, useEffect } from "react";
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  User, 
  Box,
  Zap,
  ArrowLeft,
  Printer
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";

export default function PointOfSale() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("anonymous");
  const [discount, setDiscount] = useState<string>("0");

  useEffect(() => {
    loadProducts();
  }, [user]);

  const loadProducts = async () => {
    if (!user?.clinicId) return;
    try {
      const [prodData, custData] = await Promise.all([
        api.inventory.list(user.clinicId),
        api.erp.customers(user.clinicId)
      ]);
      setProducts(prodData);
      setCustomers(custData);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données." });
    }
  };

  const addToCart = (product: any) => {
    if (product.stock <= 0) {
      toast({ variant: "destructive", title: "Rupture", description: "Ce produit n'est plus en stock." });
      return;
    }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        if (newQty > item.stock) {
           toast({ variant: "destructive", title: "Stock insuffisant", description: `Seulement ${item.stock} disponibles.` });
           return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subTotal = cart.reduce((sum, item) => sum + (item.price_sell * item.quantity), 0);
  const discountAmount = parseInt(discount) || 0;
  const cartTotal = Math.max(0, subTotal - discountAmount);

  const handleCheckout = async () => {
    try {
      const response = await api.erp.posSale({
        clinicId: user.clinicId,
        items: cart,
        total: cartTotal,
        payment_method: paymentMethod,
        customer_id: selectedCustomer === 'anonymous' ? null : selectedCustomer,
        discount: discountAmount
      });
      
      const customerName = selectedCustomer === 'anonymous' ? 'Client Passager' : customers.find(c => c.id === selectedCustomer)?.name;
      
      setLastTransaction({
        id: response.transaction_id,
        items: [...cart],
        total: cartTotal,
        subtotal: subTotal,
        discount: discountAmount,
        payment_method: paymentMethod,
        customer_name: customerName,
        date: new Date().toLocaleString()
      });
      
      toast({ title: "Vente réussie", description: "La transaction a été enregistrée." });
      setCart([]);
      setIsCheckoutOpen(false);
      setIsReceiptOpen(true);
      loadProducts();
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "La validation de la vente a échoué." });
    }
  };

  const handleBarcodeSearch = (val: string) => {
    setSearchTerm(val);
    // Check if the value matches a SKU exactly
    const product = products.find(p => p.sku === val);
    if (product) {
      addToCart(product);
      setSearchTerm("");
      toast({ title: "Produit ajouté", description: product.name });
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Product Catalog */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/erp')} className="rounded-2xl bg-white shadow-sm border border-slate-100">
                 <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                 <h1 className="text-2xl font-black tracking-tight text-slate-900 border-none flex items-center gap-3">
                    <Zap className="h-7 w-7 text-amber-500" /> Caisse Express
                 </h1>
                 <p className="text-xs text-slate-500 font-medium tracking-wide border-none italic-none">Tapez le nom ou scannez un SKU</p>
              </div>
           </div>
           <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Rechercher un produit..." 
                className="pl-10 h-12 rounded-2xl border-none shadow-sm bg-white"
                value={searchTerm}
                onChange={e => handleBarcodeSearch(e.target.value)}
                autoFocus
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <Card key={product.id} className="border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer bg-white overflow-hidden rounded-[2rem] group" onClick={() => addToCart(product)}>
               <div className="h-32 bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
                  <Box className="h-8 w-8 text-slate-300 group-hover:scale-110 transition-transform" />
                  <Badge className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm text-slate-600 border-none text-[10px] uppercase font-black">{product.category}</Badge>
               </div>
               <CardContent className="p-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{product.sku}</p>
                  <h3 className="text-xs font-black text-slate-900 mb-2 truncate uppercase">{product.name}</h3>
                  <div className="flex justify-between items-center">
                     <p className="text-xs font-black text-emerald-600 font-mono">{Number(product.price_sell).toLocaleString()} <span className="text-[8px]">CFA</span></p>
                     <Badge variant={product.stock > product.threshold ? "secondary" : "destructive"} className="text-[9px] px-1 py-0">{product.stock} {product.unit}</Badge>
                  </div>
               </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-[400px] flex flex-col gap-6">
        <Card className="flex-1 flex flex-col border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
           <CardHeader className="bg-slate-900 text-white p-6 pb-4">
              <div className="flex items-center gap-3">
                 <ShoppingCart className="h-6 w-6 text-emerald-400" />
                 <CardTitle className="text-xl font-black">Panier Actuel</CardTitle>
              </div>
              <CardDescription className="text-slate-400 font-medium">Session caisse #{user?.id || '001'}</CardDescription>
           </CardHeader>
           <CardContent className="flex-1 overflow-y-auto p-0 border-none">
              <div className="divide-y relative h-full">
                 {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 opacity-20 italic-none">
                       <ShoppingCart className="h-20 w-20 mb-4" />
                       <p className="font-black text-lg uppercase tracking-widest text-center">PANIER VIDE</p>
                    </div>
                 ) : (
                    cart.map(item => (
                       <div key={item.id} className="p-6 space-y-4 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start">
                             <div className="flex-1 pr-2">
                                <h4 className="text-xs font-black text-slate-900 uppercase leading-snug">{item.name}</h4>
                                <p className="text-[10px] text-slate-500 font-medium">{Number(item.price_sell).toLocaleString()} CFA / {item.unit}</p>
                             </div>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 -mt-2" onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}>
                                <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                          <div className="flex justify-between items-center">
                             <div className="flex items-center bg-slate-100 rounded-xl p-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => updateQuantity(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                                <span className="w-10 text-center text-sm font-black text-slate-900">{item.quantity}</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => updateQuantity(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                             </div>
                             <p className="text-sm font-black text-slate-900">{(item.price_sell * item.quantity).toLocaleString()} CFA</p>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </CardContent>
            <CardFooter className="flex-col gap-4 p-6 bg-slate-50 border-t">
              <div className="w-full space-y-2">
                 <div className="flex justify-between items-center opacity-60">
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">SOUS-TOTAL</span>
                    <span className="text-sm font-black">{subTotal.toLocaleString()} CFA</span>
                 </div>
                 <div className="flex justify-between items-center text-rose-600">
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">REMISE</span>
                    <div className="flex items-center gap-2">
                       <Input 
                         type="number" 
                         className="h-6 w-20 text-right font-black border-slate-200 bg-white" 
                         value={discount} 
                         onChange={e => setDiscount(e.target.value)} 
                       />
                       <span className="text-[10px] font-bold">CFA</span>
                    </div>
                 </div>
                 <div className="flex justify-between items-center py-2 border-t border-slate-200">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-none">À PAYER</span>
                    <span className="text-3xl font-black text-slate-900 leading-none">{cartTotal.toLocaleString()} <span className="text-lg font-bold">CFA</span></span>
                 </div>
              </div>
              <Button 
                className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg gap-3 rounded-2xl shadow-xl shadow-emerald-100 border-none"
                disabled={cart.length === 0}
                onClick={() => setIsCheckoutOpen(true)}
              >
                 VALIDER LA VENTE (F4)
              </Button>
           </CardFooter>
        </Card>
      </div>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md bg-white border-none rounded-[2.5rem] p-8">
           <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-900 border-none">Finaliser l'Encaissement</DialogTitle>
              <CardDescription>Choisir le mode de règlement pour les {cartTotal.toLocaleString()} CFA</CardDescription>
           </DialogHeader>
            <div className="space-y-4 pt-6">
               <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Sélectionner un Client</Label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                     <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                        <SelectValue placeholder="Client Passager" />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl border-none shadow-2xl">
                        <SelectItem value="anonymous" className="font-bold text-slate-500">Client Passager (Anonyme)</SelectItem>
                        {customers.map(c => (
                          <SelectItem key={c.id} value={c.id} className="font-medium">{c.name} ({c.phone || 'Pas de tél'})</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant={paymentMethod === 'cash' ? 'default' : 'outline'} 
                    className={`h-24 flex flex-col gap-2 rounded-2xl ${paymentMethod === 'cash' ? 'bg-slate-900 text-white' : 'border-slate-100 hover:bg-slate-50'}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                     <Banknote className="h-6 w-6" />
                     <span className="text-xs font-black uppercase">Espèces</span>
                  </Button>
                  <Button 
                    variant={paymentMethod === 'mobile' ? 'default' : 'outline'} 
                    className={`h-24 flex flex-col gap-2 rounded-2xl ${paymentMethod === 'mobile' ? 'bg-slate-900 text-white' : 'border-slate-100 hover:bg-slate-50'}`}
                    onClick={() => setPaymentMethod('mobile')}
                  >
                     <CreditCard className="h-6 w-6" />
                     <span className="text-xs font-black uppercase">Mobile Money</span>
                  </Button>
               </div>
            </div>
            <DialogFooter className="pt-6">
              <Button variant="ghost" onClick={() => setIsCheckoutOpen(false)} className="font-bold border-none">Annuler</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 rounded-xl" onClick={handleCheckout}>CONFIRMER LE PAIEMENT</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-sm bg-white border-none rounded-3xl p-0 overflow-hidden">
           <div className="p-8 space-y-6 print:p-0 print:m-0" id="receipt-content">
              <div className="text-center space-y-2">
                 <h2 className="text-xl font-black uppercase tracking-tighter">KIAM ERP</h2>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user?.clinicName || 'Boutique KIAM'}</p>
                 <div className="border-y border-dashed border-slate-200 py-2 my-4">
                    <p className="text-[9px] font-bold">REÇU DE VENTE #{lastTransaction?.id}</p>
                    <p className="text-[8px] text-slate-400">{lastTransaction?.date}</p>
                    <p className="text-[9px] font-black uppercase mt-1">CLIENT: {lastTransaction?.customer_name}</p>
                 </div>
              </div>

              <div className="space-y-3">
                 {lastTransaction?.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-[10px] font-bold">
                       <span>{item.quantity}x {item.name}</span>
                       <span>{(item.price_sell * item.quantity).toLocaleString()}</span>
                    </div>
                 ))}
              </div>

              <div className="border-t border-dashed border-slate-200 pt-4 space-y-1">
                 <div className="flex justify-between text-[10px] font-bold opacity-60">
                    <span>SOUS-TOTAL</span>
                    <span>{lastTransaction?.subtotal.toLocaleString()}</span>
                 </div>
                 {lastTransaction?.discount > 0 && (
                    <div className="flex justify-between text-[10px] font-bold text-rose-600">
                       <span>REMISE</span>
                       <span>-{lastTransaction?.discount.toLocaleString()}</span>
                    </div>
                 )}
                 <div className="flex justify-between text-xs font-black pt-1">
                    <span>TOTAL À PAYER</span>
                    <span>{lastTransaction?.total.toLocaleString()} CFA</span>
                 </div>
                 <div className="flex justify-between text-[9px] font-bold text-slate-500">
                    <span>MODE DE PAIEMENT</span>
                    <span className="uppercase">{lastTransaction?.payment_method}</span>
                 </div>
              </div>

              <div className="text-center pt-6 pb-2">
                 <p className="text-[9px] font-black uppercase tracking-widest italic-none">Merci de votre visite !</p>
                 <p className="text-[7px] text-slate-400 mt-1">Logiciel Kiam ERP - www.kiam-erp.com</p>
              </div>
           </div>
           <div className="p-4 bg-slate-50 flex gap-2 print:hidden">
              <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={() => setIsReceiptOpen(false)}>Fermer</Button>
              <Button className="flex-1 bg-slate-900 text-white rounded-xl font-bold gap-2" onClick={printReceipt}>
                 <Printer className="h-4 w-4" /> Imprimer
              </Button>
           </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
