import { useState, useEffect } from "react";
import { 
  Bell, 
  AlertTriangle, 
  FlaskConical, 
  Calendar,
  Info,
  ChevronRight,
  Stethoscope
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
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [user]);

  const loadNotifications = () => {
    if (!user?.clinicId) return;
    const clinicId = user.clinicId;
    const today = new Date().toISOString().split('T')[0];

    const allMeds: Medication[] = JSON.parse(localStorage.getItem('kiam_medications') || '[]');
    const allLabTests: LabTest[] = JSON.parse(localStorage.getItem('kiam_lab_tests') || '[]');
    const allAppointments: Appointment[] = JSON.parse(localStorage.getItem('kiam_appointments') || '[]');

    const newNotifications: any[] = [];

    // 1. Stock Alerts
    const lowStock = allMeds.filter(m => m.clinicId === clinicId && m.stock <= m.threshold);
    if (lowStock.length > 0) {
      newNotifications.push({
        id: 'stock-alert',
        title: 'Pénurie de médicaments',
        description: `${lowStock.length} articles sont en dessous du seuil critique.`,
        type: 'critical',
        icon: AlertTriangle,
        path: '/pharmacy'
      });
    }

    // 2. Pending Lab Results (simulated delay check)
    const pendingLabs = allLabTests.filter(t => t.clinicId === clinicId && t.status === 'pending');
    if (pendingLabs.length > 0) {
      newNotifications.push({
        id: 'lab-alert',
        title: 'Analyses en attente',
        description: `${pendingLabs.length} examens biologiques attendent leurs résultats.`,
        type: 'warning',
        icon: FlaskConical,
        path: '/laboratory'
      });
    }

    // 3. Appointments for today
    const todayApps = allAppointments.filter(a => a.clinicId === clinicId && a.date === today && a.status === 'pending');
    if (todayApps.length > 0) {
      newNotifications.push({
        id: 'app-alert',
        title: 'Agenda du jour',
        description: `Vous avez ${todayApps.length} consultations programmées pour aujourd'hui.`,
        type: 'info',
        icon: Calendar,
        path: '/appointments'
      });
    }

    setNotifications(newNotifications);
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
