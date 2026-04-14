import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

export function AppLayout() {
  const { user, clinic } = useAuth();
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

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground" />
              <GlobalSearch />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 text-muted-foreground">
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
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
