import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { Sun, Moon, MessageSquare, LogOut } from "lucide-react";
import { useState, useEffect } from "react";

import { createPortal } from "react-dom";

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

    // The Banner is now in a Portal to avoid removeChild errors during layout transitions
    const BannerPortal = isPresentationMode ? createPortal(
        <div className="fixed top-0 left-0 right-0 h-9 bg-amber-600 text-white flex items-center justify-between px-4 shadow-lg z-[9999] animate-in slide-in-from-top duration-300">
            <div className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.2em]">
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
        </div>,
        document.body
    ) : null;

    return (
        <SidebarProvider className="notranslate">
            <div className="min-h-screen flex w-full notranslate">
                {BannerPortal}
                <AppSidebar />
                <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isPresentationMode ? 'mt-9' : 'mt-0'}`}>
                    <header className="h-14 flex items-center justify-between border-b bg-card px-4 shrink-0 notranslate">
                        <div className="flex items-center gap-3">
                            <SidebarTrigger />
                            <div className="h-6 w-[1px] bg-border mx-1 hidden sm:block" />
                            <div className="flex flex-col">
                                <span className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">
                                    {clinic?.name || "Kiam Platform"}
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    {user?.role === 'saas_admin' ? 'Master Administration' : (user?.sector || 'Santé')}
                                </span>
                            </div>
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
