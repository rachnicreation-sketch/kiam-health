import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { Sun, Moon, MessageSquare, LogOut } from "lucide-react";
import { useState, useEffect } from "react";

export function AppLayout() {
  const { user, clinic, logout, isPresentationMode, stopImpersonation } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('kiam_theme') as 'light' | 'dark') || 'light'
  );
  
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('kiam_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleExitDemo = () => {
    stopImpersonation();
    navigate('/saas/dashboard');
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return "AD";
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <div className={`bg-amber-600 text-white transition-all duration-300 overflow-hidden z-50 shadow-inner ${isPresentationMode ? 'h-9 py-1.5 px-4 flex opacity-100' : 'h-0 py-0 opacity-0 hidden'}`}>
            <div className="flex-1 text-center text-[10px] font-bold uppercase tracking-[0.2em]">
              Mode Présentation — Données fictives (Sécurité Active)
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExitDemo} 
              className="h-6 text-[9px] bg-white/10 hover:bg-white text-white hover:text-amber-700 border-white/20 font-black px-3 rounded-full transition-all"
            >
              QUITTER LE MODE DEMO
            </Button>
          </div>
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <GlobalSearch />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 text-muted-foreground">
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/messages')} className="h-9 w-9 text-muted-foreground">
                <MessageSquare className="h-5 w-5" />
              </Button>
              <NotificationBell />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {user ? getInitials(user.name) : "AD"}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium leading-none">{user ? user.name : "Admin"}</p>
                  <p className="text-xs text-muted-foreground">
                    {clinic ? clinic.name : (user?.role === 'saas_admin' ? "Administration SaaS" : "Clinique Centrale")}
                  </p>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
