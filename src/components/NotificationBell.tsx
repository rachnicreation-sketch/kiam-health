import React, { useState, useEffect } from "react";
import { Bell, Package, Calendar, FileText, Check, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/api-service";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "system" | "inventory" | "appointment" | "billing" | "lab";
  priority: "low" | "medium" | "high";
  time: string;
  path: string;
  isRead: boolean;
}

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const data = await apiRequest("notifications.php");
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Refres chaque minute
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiRequest("notifications.php?action=mark_read", { 
        method: "POST", 
        body: JSON.stringify({ notificationId: id }) 
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "inventory": return <Package className="h-4 w-4 text-orange-500" />;
      case "appointment": return <Calendar className="h-4 w-4 text-blue-500" />;
      case "billing": return <FileText className="h-4 w-4 text-red-500" />;
      default: return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 border-2 border-white animate-pulse">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 rounded-2xl shadow-2xl border-slate-100 mt-2 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-slate-50">
          <DropdownMenuLabel className="font-black text-slate-900 uppercase tracking-tighter">
            {t("notifications.title")}
          </DropdownMenuLabel>
          <Button variant="ghost" size="sm" className="text-[10px] font-bold text-blue-600 hover:text-blue-700" onClick={() => {/* Mark all as read */}}>
            {t("notifications.mark_all_read")}
          </Button>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={`p-4 cursor-pointer border-b border-slate-50 last:border-0 flex gap-4 items-start hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                onClick={() => {
                  markAsRead(n.id);
                  setSelectedNotification(n);
                }}
              >
                <div className={`p-2 rounded-xl bg-white shadow-sm border border-slate-100`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm leading-none">{n.title}</span>
                    <span className="text-[10px] font-medium text-slate-400">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-snug">{n.message}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0"></div>}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-8 text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                <Bell className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm text-slate-400 font-medium">{t("notifications.empty")}</p>
            </div>
          )}
        </div>
        
        <DropdownMenuSeparator className="m-0" />
        <div className="p-2">
          <Button variant="ghost" className="w-full text-xs font-bold text-slate-500 hover:text-slate-900 h-9 rounded-xl" onClick={() => navigate('/settings')}>
             <Settings className="w-3 h-3 mr-2" /> {t("common.settings")}
          </Button>
        </div>
      </DropdownMenuContent>
      
      {/* FULL NOTIFICATION DIALOG */}
      <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
        <DialogContent className="sm:max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-black">
              {selectedNotification && getIcon(selectedNotification.type)}
              {selectedNotification?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
              {selectedNotification?.message}
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-4 border-t">
              <span>{selectedNotification?.type}</span>
              <span>{selectedNotification?.time}</span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setSelectedNotification(null)}>
              Fermer
            </Button>
            {selectedNotification?.path && selectedNotification.path !== "/dashboard" && (
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold" onClick={() => {
                navigate(selectedNotification.path);
                setSelectedNotification(null);
              }}>
                Ouvrir la page
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  );
};
