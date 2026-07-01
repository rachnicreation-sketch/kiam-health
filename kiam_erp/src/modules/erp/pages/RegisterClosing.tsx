import { useState, useEffect } from "react";
import { 
  Lock, 
  Unlock, 
  Calculator, 
  Banknote, 
  CreditCard,
  ArrowLeft,
  AlertCircle,
  History,
  CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

export default function RegisterClosing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [closingData, setClosingData] = useState({
    cash_in_hand: "0",
    expected: "1250000", // This would normally come from the backend
    difference: "0"
  });

  const [isClosed, setIsClosed] = useState(false);

  const expectedCash = 1250000;
  const actualCash = parseInt(closingData.cash_in_hand) || 0;
  const diff = actualCash - expectedCash;

  const handleClose = () => {
    toast({ title: "Caisse clôturée", description: "Le rapport de clôture a été envoyé à l'administrateur." });
    setIsClosed(true);
  };

  if (isClosed) {
    return (
      <div className="h-[70vh] flex items-center justify-center animate-in zoom-in-95 duration-500">
         <Card className="max-w-md w-full border-none shadow-2xl bg-white rounded-[3rem] p-10 text-center space-y-6">
            <div className="h-24 w-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
               <CheckCircle2 className="h-12 w-12" />
            </div>
            <div className="space-y-2">
               <h2 className="text-3xl font-black text-slate-900">Session Clôturée</h2>
               <p className="text-slate-500 font-medium">La caisse a été verrouillée avec succès pour aujourd'hui.</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-[2rem] space-y-3">
               <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                  <span>Ventes Total</span>
                  <span className="text-slate-900">1,250,000 CFA</span>
               </div>
               <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                  <span>Tiroir Réel</span>
                  <span className="text-slate-900">{actualCash.toLocaleString()} CFA</span>
               </div>
               <div className="border-t pt-3 flex justify-between text-xs font-black uppercase tracking-widest text-slate-900">
                  <span>Écart</span>
                  <span className={diff < 0 ? 'text-rose-600' : 'text-emerald-600'}>{diff.toLocaleString()} CFA</span>
               </div>
            </div>
            <Button onClick={() => navigate('/erp')} className="w-full h-14 bg-slate-900 text-white font-black rounded-2xl border-none">RETOURNER AU DASHBOARD</Button>
         </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 italic-none">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/erp')} className="rounded-2xl bg-white shadow-sm border border-slate-100">
           <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Lock className="h-8 w-8 text-slate-900" /> Clôture de Caisse
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Réconciliation financière de la session actuelle.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
         <div className="space-y-6">
            <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
               <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-lg font-black uppercase tracking-tight">Comptage du Tiroir</CardTitle>
                  <CardDescription>Saisissez le montant réel présent physiquement.</CardDescription>
               </CardHeader>
               <CardContent className="p-8 space-y-6">
                  <div className="space-y-3">
                     <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Montant en Espèces (Total)</Label>
                     <div className="relative">
                        <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
                        <Input 
                           type="number" 
                           className="h-20 pl-14 rounded-2xl bg-slate-50 border-none text-3xl font-black" 
                           value={closingData.cash_in_hand}
                           onChange={e => setClosingData({...closingData, cash_in_hand: e.target.value})}
                        />
                     </div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl space-y-4">
                     <div className="flex justify-between items-center opacity-60">
                        <span className="text-xs font-bold uppercase tracking-widest">Attendu par le système</span>
                        <span className="text-lg font-black font-mono">{expectedCash.toLocaleString()} CFA</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest">Écart de caisse</span>
                        <Badge className={`px-4 py-1 rounded-lg border-none font-black text-sm ${diff === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                           {diff.toLocaleString()} CFA
                        </Badge>
                     </div>
                  </div>
               </CardContent>
               <CardFooter className="p-8 pt-0">
                  <Button 
                    className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white font-black text-lg gap-3 rounded-2xl border-none shadow-xl shadow-slate-200"
                    onClick={handleClose}
                  >
                     VALIDER LA CLÔTURE DÉFINITIVE
                  </Button>
               </CardFooter>
            </Card>
         </div>

         <div className="space-y-6">
            <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
               <CardHeader className="p-8 pb-0">
                  <CardTitle className="text-lg font-black uppercase tracking-tight">Détails de la Session</CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                     <div className="flex justify-between border-b border-slate-100 pb-3">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Vendeur</span>
                        <span className="text-sm font-black uppercase">{user?.name}</span>
                     </div>
                     <div className="flex justify-between border-b border-slate-100 pb-3">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Début de session</span>
                        <span className="text-sm font-black uppercase">08:00 (Aujourd'hui)</span>
                     </div>
                     <div className="flex justify-between border-b border-slate-100 pb-3">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Ventes (Espèces)</span>
                        <span className="text-sm font-black">1,150,000 CFA</span>
                     </div>
                     <div className="flex justify-between border-b border-slate-100 pb-3">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Ventes (Mobile)</span>
                        <span className="text-sm font-black">100,000 CFA</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Dépenses (Caisse)</span>
                        <span className="text-sm font-black text-rose-600">-25,000 CFA</span>
                     </div>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl flex gap-3 border border-amber-100">
                     <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                     <p className="text-[10px] text-amber-800 font-bold leading-tight uppercase">Assurez-vous que tous les tickets ont été validés avant de procéder à la clôture.</p>
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}
