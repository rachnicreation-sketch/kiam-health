import { useState, useEffect } from "react";
import { 
  Bell, 
  AlertTriangle, 
  FlaskConical, 
  Calendar,
  Info,
  ChevronRight,
  Stethoscope,
  MoveHorizontal
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Medication, LabTest, Appointment } from "@/lib/mock-data";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api-service";

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<{
    id: string;
    title: string;
    description: string;
    type: 'warning' | 'info' | 'critical';
    icon: any;
    path: string;
  }[]>([]);

  useEffect(() => {
    if (user?.clinicId) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 60000); // 1 min refresh for DB
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user?.clinicId) return;
    
    try {
      const data = await api.notifications.list(user.clinicId);
      
      const mappedNotifications = data.map((n: any) => {
        let type: 'warning' | 'info' | 'critical' = 'info';
        let icon = Info;
        let path = '/dashboard';

        if (n.type === 'inventory') {
          type = 'critical';
          icon = AlertTriangle;
          path = '/pharmacy';
        } else if (n.type === 'lab') {
          type = 'warning';
          icon = FlaskConical;
          path = '/laboratory';
        } else if (n.type === 'appointment') {
          type = 'info';
          icon = Calendar;
          path = '/appointments';
        } else if (n.type === 'system') {
          type = 'info';
          icon = Bell;
          path = '/dashboard';
        }

        return {
          id: n.id,
          title: n.title,
          description: n.message,
          type,
          icon,
          path
        };
      });

      setNotifications(mappedNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const hasNotifications = notifications.length > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-muted transition-all group">
          <Bell className={`h-5 w-5 text-muted-foreground transition-colors ${hasNotifications ? 'group-hover:text-primary' : ''}`} />
          {hasNotifications && (
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive border-2 border-white"></span>
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 shadow-2xl border-none overflow-hidden" align="end">
        <div className="bg-primary p-4 text-primary-foreground">
           <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm">Centre d'Alertes</h3>
              <Badge variant="outline" className="text-[10px] bg-white/20 border-none text-white">{notifications.length}</Badge>
           </div>
        </div>
        <div className="max-h-[350px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
               <Info className="h-8 w-8 text-muted-foreground/30 mb-2" />
               <p className="text-xs text-muted-foreground italic font-medium">Tout est sous contrôle.<br/>Aucune alerte pour le moment.</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => {
                const Icon = notif.icon;
                return (
                  <div 
                    key={notif.id} 
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors group flex gap-3"
                    onClick={() => navigate(notif.path)}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'critical' ? 'bg-rose-100 text-rose-600' : notif.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                       <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-xs font-black uppercase text-slate-800 truncate">{notif.title}</p>
                       <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{notif.description}</p>
                    </div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary self-center transition-colors" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="p-2 bg-muted/20 border-t flex justify-center">
             <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold text-primary hover:bg-primary/5 h-7">Marquer tout comme lu</Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
