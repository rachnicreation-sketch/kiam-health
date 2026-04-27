import { useState, useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  FlaskConical,
  Calendar,
  Info,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
  Reply,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

type NotificationFilter = "all" | "unread" | "read";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  type: "warning" | "info" | "critical";
  sourceType: string;
  icon: any;
  path: string;
  time?: string;
  isRead: boolean;
};

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const hasNotifications = unreadCount > 0;

  const filteredNotifications = notifications.filter((notification) => {
    if (activeFilter === "unread") return !notification.isRead;
    if (activeFilter === "read") return notification.isRead;
    return true;
  });

  useEffect(() => {
    if (user?.clinicId) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const mapNotification = (n: any): NotificationItem => {
    let type: "warning" | "info" | "critical" = "info";
    let icon = Info;
    let path = "/dashboard";

    if (n.type === "inventory") {
      type = "critical";
      icon = AlertTriangle;
      path = "/pharmacy";
    } else if (n.type === "lab") {
      type = "warning";
      icon = FlaskConical;
      path = "/laboratory";
    } else if (n.type === "appointment") {
      type = "info";
      icon = Calendar;
      path = "/appointments";
    } else if (n.type === "system") {
      type = "info";
      icon = Bell;
      path = n.path || "/dashboard";
    }

    return {
      id: n.id,
      title: n.title,
      description: n.message,
      type,
      sourceType: n.type || "system",
      icon,
      path,
      time: n.time,
      isRead: Boolean(n.isRead),
    };
  };

  const loadNotifications = async () => {
    if (!user?.clinicId) return;

    try {
      const data = await api.notifications.list(user.clinicId);
      setNotifications((data || []).map(mapNotification));
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const syncSelectedNotification = (notificationId: string, isRead: boolean) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead } : notification
      )
    );

    setSelectedNotification((current) =>
      current && current.id === notificationId ? { ...current, isRead } : current
    );
  };

  const openNotification = async (notification: NotificationItem) => {
    setSelectedNotification(notification);
    setReplyMessage("");
    setIsDetailOpen(true);

    if (!user?.clinicId || notification.isRead) {
      return;
    }

    try {
      await api.notifications.markRead(user.clinicId, notification.id);
      syncSelectedNotification(notification.id, true);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleToggleReadState = async () => {
    if (!user?.clinicId || !selectedNotification) return;

    try {
      if (selectedNotification.isRead) {
        await api.notifications.markUnread(user.clinicId, selectedNotification.id);
        syncSelectedNotification(selectedNotification.id, false);
      } else {
        await api.notifications.markRead(user.clinicId, selectedNotification.id);
        syncSelectedNotification(selectedNotification.id, true);
      }
    } catch (error) {
      console.error("Error updating notification state:", error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.clinicId) return;

    const unreadIds = notifications
      .filter((notification) => !notification.isRead)
      .map((notification) => notification.id);

    if (unreadIds.length === 0) return;

    try {
      await api.notifications.markAllRead(user.clinicId, unreadIds);
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true }))
      );
      setSelectedNotification((current) => (current ? { ...current, isRead: true } : current));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleReply = async () => {
    if (!selectedNotification || !replyMessage.trim()) {
      toast({
        variant: "destructive",
        title: "Reponse vide",
        description: "Saisis un message avant d'envoyer ta reponse.",
      });
      return;
    }

    setIsReplying(true);
    try {
      await api.saas.createTicket({
        subject: `Re: ${selectedNotification.title}`,
        description: replyMessage.trim(),
        priority: selectedNotification.type === "critical" ? "high" : "medium",
        notificationId: selectedNotification.id,
      });

      toast({
        title: "Reponse envoyee",
        description: "Ton message a ete transmis au support SaaS.",
      });
      setReplyMessage("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Envoi impossible",
        description: error.message || "La reponse n'a pas pu etre envoyee.",
      });
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button className="relative p-2 rounded-lg hover:bg-muted transition-all group">
            <Bell className={`h-5 w-5 text-muted-foreground transition-colors ${hasNotifications ? "group-hover:text-primary" : ""}`} />
            {hasNotifications && (
              <span className="absolute top-1 right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive border-2 border-white"></span>
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[360px] p-0 shadow-2xl border-none overflow-hidden" align="end">
          <div className="bg-primary p-4 text-primary-foreground">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm">Centre d'Alertes</h3>
              <Badge variant="outline" className="text-[10px] bg-white/20 border-none text-white">
                {unreadCount}/{notifications.length}
              </Badge>
            </div>
            <div className="mt-3 flex gap-2">
              {[
                { id: "all", label: "Tous" },
                { id: "unread", label: "Non lus" },
                { id: "read", label: "Lus" },
              ].map((filterOption) => (
                <button
                  key={filterOption.id}
                  type="button"
                  onClick={() => setActiveFilter(filterOption.id as NotificationFilter)}
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    activeFilter === filterOption.id
                      ? "bg-white text-primary"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Info className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground italic font-medium">
                  Aucune notification dans ce filtre.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      className={`w-full text-left p-4 hover:bg-muted/50 transition-colors group flex gap-3 ${!notification.isRead ? "bg-primary/5" : ""}`}
                      onClick={() => openNotification(notification)}
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${notification.type === "critical" ? "bg-rose-100 text-rose-600" : notification.type === "warning" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-black uppercase text-slate-800 truncate">{notification.title}</p>
                          {!notification.isRead && (
                            <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{notification.description}</p>
                        {notification.time && (
                          <p className="text-[10px] text-muted-foreground/70 mt-1">{notification.time}</p>
                        )}
                      </div>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary self-center transition-colors" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="p-2 bg-muted/20 border-t flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] uppercase font-bold text-primary hover:bg-primary/5 h-7"
                onClick={handleMarkAllRead}
              >
                Marquer tout comme lu
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="pr-6">{selectedNotification?.title || "Notification"}</DialogTitle>
            <DialogDescription>
              {selectedNotification?.time || "Message recu"}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            {selectedNotification?.description}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Reply className="h-3.5 w-3.5" />
              Repondre au support SaaS
            </div>
            <Textarea
              value={replyMessage}
              onChange={(event) => setReplyMessage(event.target.value)}
              placeholder="Ecris ta reponse ou ta question a propos de ce message..."
              className="min-h-[110px] resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleToggleReadState}
              disabled={!selectedNotification}
            >
              {selectedNotification?.isRead ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Marquer non lu
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Marquer lu
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReply}
              disabled={isReplying || !selectedNotification}
            >
              <Reply className="h-4 w-4 mr-2" />
              {isReplying ? "Envoi..." : "Repondre"}
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (selectedNotification?.path) {
                  navigate(selectedNotification.path);
                  setIsDetailOpen(false);
                }
              }}
              disabled={!selectedNotification?.path}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
