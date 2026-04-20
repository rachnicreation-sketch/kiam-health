import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Mail, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login(email, password);
      // useAuth sets the user in state, we can use the result or wait for next render, 
      // but useAuth is designed to return success/message.
      // Let's assume we can get the role from the stored user or better, from the response.
      if (result.success) {
        const storedUser = JSON.parse(localStorage.getItem('kiam_auth_user') || '{}');
        if (storedUser.role === 'saas_admin') {
          navigate("/saas/dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(result.message || "Erreur de connexion");
      }
    } catch (err) {
      setError("Erreur système");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-lg mx-auto space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary shadow-lg">
            <span className="text-primary-foreground font-bold text-2xl">K</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Kiam</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Plateforme de gestion hospitalière</p>
        </div>

        <Card className="shadow-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <CardContent className="pt-6 space-y-5">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@clinique.com" 
                    className="pl-10" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-200">Mot de passe</Label>
                  <a href="#" className="text-xs text-primary hover:underline">Mot de passe oublié ?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="pl-10" 
                    required 
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-200 mt-4 dark:border-slate-800">
              <p className="text-xs text-center text-slate-600 dark:text-slate-400 mb-2">Comptes de test (mot de passe: password)</p>
              <div className="text-xs space-y-1 text-center text-slate-700 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-900 p-2 rounded">
                <div>admin@saas.com (SaaS)</div>
                <div>admin@fraternite.com (Clinique)</div>
                <div>admin@marion.com (Clinique)</div>
              </div>
            </div>

            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
              Développé par <span className="font-medium">Matiaba Firm</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
