import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-service";

// Components
import { ErpAdminDashboard } from "../components/ErpAdminDashboard";
import { ErpManagerDashboard } from "../components/ErpManagerDashboard";
import { ErpPosDashboard } from "../components/ErpPosDashboard";

export default function ErpDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user?.clinicId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await api.erp.stats(user.clinicId);
      setStats(data);
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Impossible de charger les statistiques ERP." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Role-based rendering
  const role = user?.role || 'erp_admin';

  if (role === 'caissier') {
    return <ErpPosDashboard stats={stats} user={user} />;
  }

  if (role === 'erp_manager') {
    return <ErpManagerDashboard stats={stats} user={user} />;
  }

  // Default to Admin view for clinic_admin or erp_admin
  return <ErpAdminDashboard stats={stats} />;
}
