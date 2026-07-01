import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-service";
import { DUMMY_HOTEL_STATS, DUMMY_HOTEL_ROOMS } from "@/lib/mock-data";
import { HotelAdminDashboard } from "../components/HotelAdminDashboard";
import { HotelFrontDeskDashboard } from "../components/HotelFrontDeskDashboard";

export default function HotelDashboard() {
  const { user, isPresentationMode } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isPresentationMode) {
      setRooms(DUMMY_HOTEL_ROOMS);
      setStats(DUMMY_HOTEL_STATS);
      setIsLoading(false);
    } else if (user?.clinicId) {
      loadData();
    }
  }, [user, isPresentationMode]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [roomData, statData] = await Promise.all([
        api.hotel.rooms(user!.clinicId!),
        api.hotel.stats(user!.clinicId!)
      ]);
      setRooms(roomData);
      setStats(statData);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données hôtelières." });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  const role = user?.role || 'clinic_admin';

  // Receptionists and front desk get the operational view
  if (role === 'hotel_reception' || role === 'reception') {
    return <HotelFrontDeskDashboard stats={stats} rooms={rooms} user={user} onRefresh={loadData} />;
  }

  // Admins and managers get the strategic view by default,
  // but with full control — including the room selector panel
  if (role === 'hotel_admin' || role === 'clinic_admin') {
    return <HotelAdminDashboard stats={stats} rooms={rooms} />;
  }

  // Fallback: front desk view for any other role
  return <HotelFrontDeskDashboard stats={stats} rooms={rooms} user={user} onRefresh={loadData} />;
}
