import { 
  DoorOpen,
  CheckCircle2,
  Clock,
  Users,
  Plus,
  BedDouble,
  Phone,
  LogOut,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

interface HotelFrontDeskDashboardProps {
  stats: any;
  rooms: any[];
  user: any;
  onRefresh: () => void;
}

const statusColors = {
  available: 'bg-emerald-500',
  occupied: 'bg-violet-600',
  cleaning: 'bg-amber-500',
  maintenance: 'bg-rose-500',
};

const statusLabels = {
  available: 'Libre',
  occupied: 'Occupée',
  cleaning: 'Nettoyage',
  maintenance: 'Maintenance',
};

export function HotelFrontDeskDashboard({ stats, rooms, user, onRefresh }: HotelFrontDeskDashboardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [guestForm, setGuestForm] = useState({ guest_name: '', guest_phone: '' });

  const handleCheckin = async () => {
    if (!guestForm.guest_name || !guestForm.guest_phone) return;
    try {
      await api.hotel.checkin({
        ...guestForm,
        room_id: selectedRoom.id,
        price: selectedRoom.price,
        clinicId: user.clinicId
      });
      toast({ title: "Check-in effectué", description: `${guestForm.guest_name} enregistré en chambre ${selectedRoom.room_number}.` });
      setIsCheckinOpen(false);
      setGuestForm({ guest_name: '', guest_phone: '' });
      onRefresh();
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Échec du check-in." });
    }
  };

  const handleCheckout = async (room: any, bookingId: string) => {
    try {
      await api.hotel.checkout({ booking_id: bookingId, room_id: room.id, clinicId: user.clinicId });
      toast({ title: "Check-out effectué", description: `La chambre ${room.room_number} est en nettoyage.` });
      onRefresh();
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Échec du check-out." });
    }
  };

  const availableRooms = rooms.filter(r => r.status === 'available');
  const occupiedRooms = rooms.filter(r => r.status === 'occupied');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <DoorOpen className="w-8 h-8 text-indigo-600" /> Accueil & Réception
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Gestion des flux clients et des chambres en temps réel.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-hotel-gradient text-white font-bold gap-2 shadow-lg shadow-violet-200 h-11 px-6 rounded-xl" onClick={() => { setSelectedRoom(availableRooms[0] || null); setIsCheckinOpen(true); }}>
            <Plus className="w-4 h-4" /> Nouveau Check-in
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Chambres" value={stats.total_rooms || 0} icon={DoorOpen} className="bg-white" />
        <StatCard title="Libres" value={stats.available || 0} change="Disponibles" changeType="positive" icon={CheckCircle2} iconClassName="bg-emerald-100 text-emerald-600" className="bg-white" />
        <StatCard title="Occupées" value={stats.occupied || 0} change="Clients actifs" changeType="neutral" icon={Users} iconClassName="bg-violet-100 text-violet-600" className="bg-white" />
        <StatCard title="Nettoyage" value={stats.cleaning || 0} change="Indisponibles" changeType="negative" icon={Clock} iconClassName="bg-amber-100 text-amber-600" className="bg-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Grid */}
        <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Plan de l'Hôtel</CardTitle>
              <Button variant="ghost" className="text-xs font-bold text-indigo-600" onClick={() => navigate('/hotel/rooms')}>Gérer →</Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {rooms.map(room => (
                <div
                  key={room.id}
                  className={`p-3 rounded-2xl text-center cursor-pointer border-2 transition-all hover:scale-105 ${
                    selectedRoom?.id === room.id 
                      ? 'border-violet-500 shadow-lg shadow-violet-100' 
                      : 'border-slate-100 hover:border-slate-200'
                  } ${room.status === 'available' ? 'bg-emerald-50' : room.status === 'occupied' ? 'bg-violet-50' : room.status === 'cleaning' ? 'bg-amber-50' : 'bg-rose-50'}`}
                  onClick={() => setSelectedRoom(room)}
                >
                  <div className="text-lg font-black text-slate-800">{room.room_number}</div>
                  <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">{room.type}</div>
                  <div className={`mt-1 h-2 w-2 rounded-full mx-auto ${statusColors[room.status as keyof typeof statusColors] || 'bg-slate-300'}`}></div>
                </div>
              ))}
              {rooms.length === 0 && (
                <div className="col-span-4 text-center py-10 text-slate-400 text-xs italic">Aucune chambre configurée</div>
              )}
            </div>
            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100">
              {Object.entries(statusLabels).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${statusColors[key as keyof typeof statusColors]}`}></div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Panel */}
        <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">
              {selectedRoom ? `Chambre ${selectedRoom.room_number}` : 'Sélectionner une chambre'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {selectedRoom ? (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="p-5 bg-slate-50 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-black text-slate-900">{selectedRoom.room_number}</span>
                    <Badge className={`${statusColors[selectedRoom.status as keyof typeof statusColors]} text-white border-none text-[10px] font-black uppercase px-3`}>
                      {statusLabels[selectedRoom.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                  <div className="text-sm font-bold text-violet-600">{selectedRoom.type} • {Number(selectedRoom.price).toLocaleString()} CFA / nuit</div>
                </div>

                {selectedRoom.status === 'available' && (
                  <Dialog open={isCheckinOpen} onOpenChange={setIsCheckinOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-hotel-gradient text-white font-black h-14 rounded-2xl shadow-xl shadow-violet-100 gap-2">
                        <Plus className="w-5 h-5" /> Enregistrer un Client
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-white border-none rounded-[2.5rem] p-8">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black border-none">Check-in — Chambre {selectedRoom.room_number}</DialogTitle>
                        <CardDescription className="border-none">Renseignez les informations du client.</CardDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-slate-500">Nom du Client</Label>
                          <Input className="h-12 rounded-xl bg-slate-50 border-none" placeholder="M. Tidiane Diallo" value={guestForm.guest_name} onChange={e => setGuestForm({ ...guestForm, guest_name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-slate-500">Téléphone</Label>
                          <Input className="h-12 rounded-xl bg-slate-50 border-none" placeholder="+242 06 xxx xx xx" value={guestForm.guest_phone} onChange={e => setGuestForm({ ...guestForm, guest_phone: e.target.value })} />
                        </div>
                        <Button className="w-full h-14 bg-hotel-gradient text-white font-black rounded-2xl" onClick={handleCheckin}>VALIDER LE CHECK-IN</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {selectedRoom.status === 'occupied' && (
                  <Button variant="outline" className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 font-black h-14 rounded-2xl gap-2" onClick={() => handleCheckout(selectedRoom, '')}>
                    <LogOut className="w-5 h-5" /> Libérer la Chambre (Check-out)
                  </Button>
                )}

                {selectedRoom.status === 'cleaning' && (
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Marquer comme Prête
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-14 flex flex-col gap-1 rounded-2xl border-slate-100 hover:bg-slate-50">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-[9px] font-black uppercase text-slate-400">Appeler Client</span>
                  </Button>
                  <Button variant="outline" className="h-14 flex flex-col gap-1 rounded-2xl border-slate-100 hover:bg-slate-50">
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                    <span className="text-[9px] font-black uppercase text-slate-400">Voir Détails</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 opacity-30">
                <BedDouble className="h-16 w-16 mb-4" />
                <p className="font-black text-sm uppercase tracking-widest text-center">SÉLECTIONNEZ UNE CHAMBRE</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
