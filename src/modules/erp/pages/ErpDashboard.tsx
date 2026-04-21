import { useState, useEffect } from "react";
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  BarChart3, 
  Zap, 
  Truck, 
  Warehouse,
  AlertCircle,
  Receipt,
  RotateCcw,
  Plus,
  Search,
  ArrowUpDown,
  Box
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

const salesData = [
  { day: "Lun", sales: 450000 },
  { day: "Mar", sales: 520000 },
  { day: "Mer", sales: 380000 },
  { day: "Jeu", sales: 610000 },
  { day: "Ven", sales: 850000 },
  { day: "Sam", sales: 1200000 },
  { day: "Dim", sales: 900000 },
];

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-service";

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
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const data = await apiRequest(`erp.php?action=stats&clinicId=${user.clinicId}`);
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
  // Possible roles: erp_admin, erp_manager, caissier, clinic_admin (default to admin)
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
