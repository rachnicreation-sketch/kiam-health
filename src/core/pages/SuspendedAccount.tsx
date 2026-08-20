import { useState } from "react";
import { ShieldAlert, LogOut, Mail, CreditCard, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

export default function SuspendedAccount() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('kiam_jwt_token');
    window.location.hash = "#/login";
  };

  const handlePayment = async (method: 'pay_stripe' | 'pay_mobile_money') => {
    setLoading(true);
    try {
      await apiRequest(`tenant_billing.php?action=${method}`, {
        method: "POST",
        body: JSON.stringify({
          plan_id: "plan_standard",
          amount: 45000
        })
      });
      toast({
        title: "Paiement réussi",
        description: "Votre compte a été réactivé. Redirection en cours..."
      });
      setTimeout(() => {
        window.location.hash = "#/apps";
      }, 1500);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Erreur de paiement",
        description: e.message || "Impossible de traiter le paiement."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-[2.5rem] shadow-xl">
        <div className="inline-flex p-4 rounded-full bg-rose-100 text-rose-600">
          <ShieldAlert size={48} />
        </div>
        <h1 className="text-3xl font-black text-slate-900">Accès Suspendu</h1>
        <p className="text-slate-500">
          Votre compte KIAM a été restreint en raison d'un défaut de paiement. Régularisez immédiatement ci-dessous pour débloquer votre accès.
        </p>
        <div className="pt-6 space-y-3">
          <Button 
            disabled={loading}
            onClick={() => handlePayment('pay_stripe')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 rounded-2xl font-bold gap-2 text-white"
          >
            <CreditCard className="h-4 w-4" /> Régulariser par Carte (Stripe)
          </Button>
          <Button 
            disabled={loading}
            onClick={() => handlePayment('pay_mobile_money')}
            className="w-full bg-amber-500 hover:bg-amber-600 py-6 rounded-2xl font-bold gap-2 text-white"
          >
            <Smartphone className="h-4 w-4" /> MTN / Airtel Mobile Money
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full text-slate-500 hover:text-rose-600 font-bold"
          >
            <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
}
