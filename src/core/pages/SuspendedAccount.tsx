import { ShieldAlert, LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuspendedAccount() {
  const handleLogout = () => {
    localStorage.removeItem('kiam_jwt_token');
    window.location.hash = "#/login";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-[2.5rem] shadow-xl">
        <div className="inline-flex p-4 rounded-full bg-rose-100 text-rose-600">
          <ShieldAlert size={48} />
        </div>
        <h1 className="text-3xl font-black text-slate-900">Accès Suspendu</h1>
        <p className="text-slate-500">
          Votre compte KIAM a été restreint. Veuillez contacter notre support pour régulariser votre situation.
        </p>
        <div className="pt-6 space-y-3">
          <Button 
            onClick={() => window.location.href = "mailto:support@kiam.tech"}
            className="w-full bg-blue-600 hover:bg-blue-700 py-6 rounded-2xl font-bold"
          >
            <Mail className="mr-2 h-4 w-4" /> Contacter le support
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
