import { useState, useEffect } from "react";
import { 
  Building2, 
  Users, 
  BedDouble, 
  CalendarCheck, 
  Plus, 
  Search, 
  DoorOpen, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Trash2,
  Settings
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

export default function HotelDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  const [roomForm, setRoomForm] = useState({
    room_number: "",
    type: "Standard",
    price: "",
    category: "Luxe"
  });

  const [checkinForm, setCheckinForm] = useState({
    guest_name: "",
    guest_phone: "",
    room_id: ""
  });

  useEffect(() => {
    loadData();
  }, [user]);
  const loadData = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const [roomData, statData] = await Promise.all([
        api.hotel.rooms(user.clinicId),
        api.hotel.stats(user.clinicId)
      ]);
      setRooms(roomData);
      setStats(statData);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRoom = async () => {
    try {
      await api.hotel.addRoom({ ...roomForm, clinicId: user.clinicId });
      toast({ title: "Chambre ajoutée", description: `La chambre ${roomForm.room_number} est créée.` });
      setIsAddRoomOpen(false);
      loadData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de la création." });
    }
  };

  const handleCheckin = async () => {
    try {
      await api.hotel.checkin({
        ...checkinForm,
        room_id: selectedRoom.id,
        price: selectedRoom.price,
        clinicId: user.clinicId
      });
      toast({ title: "Check-in réussi", description: `Le client ${checkinForm.guest_name} a été enregistré.` });
      setIsCheckinOpen(false);
      loadData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec du check-in." });
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'available': return <Badge className="bg-emerald-500">Libre</Badge>;
      case 'occupied': return <Badge className="bg-blue-500">Occupée</Badge>;
      case 'cleaning': return <Badge className="bg-amber-500">Nettoyage</Badge>;
      case 'maintenance': return <Badge className="bg-rose-500">Maintenance</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2 sm:p-6 italic-none">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-600" /> Kiam Hotel Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Pilotage des nuitées et du service client.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-2">
                <Plus className="w-4 h-4" /> Ajouter une Chambre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle Chambre</DialogTitle>
                <CardDescription>Configurez une unité d'hébergement</CardDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label>N° Chambre</Label>
                     <Input placeholder="101" value={roomForm.room_number} onChange={e => setRoomForm({...roomForm, room_number: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <Label>Type</Label>
                     <Select value={roomForm.type} onValueChange={v => setRoomForm({...roomForm, type: v})}>
                       <SelectTrigger><SelectValue /></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="Standard">Standard</SelectItem>
                         <SelectItem value="Double">Double</SelectItem>
                         <SelectItem value="Suite">Suite</SelectItem>
                         <SelectItem value="Présidentielle">Présidentielle</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                </div>
                <div className="space-y-2">
                  <Label>Prix par nuit (CFA)</Label>
                  <Input type="number" placeholder="45000" value={roomForm.price} onChange={e => setRoomForm({...roomForm, price: e.target.value})} />
                </div>
                <Button className="w-full bg-indigo-600" onClick={handleAddRoom}>Créer la chambre</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Chambres" value={stats.total_rooms || "0"} icon={DoorOpen} className="bg-white" />
        <StatCard title="Libres" value={stats.available || "0"} change="Prêtes" changeType="positive" icon={CheckCircle2} iconClassName="bg-emerald-100 text-emerald-600" className="bg-white" />
        <StatCard title="Occupées" value={stats.occupied || "0"} change="En séjour" changeType="neutral" icon={Users} iconClassName="bg-indigo-100 text-indigo-600" className="bg-white" />
        <StatCard title="Nettoyage" value={stats.cleaning || "0"} change="Indisponibles" changeType="negative" icon={Clock} iconClassName="bg-amber-100 text-amber-600" className="bg-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <Card className="border-none shadow-md overflow-hidden bg-white">
              <CardHeader className="bg-slate-50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Parc Hôtelier</CardTitle>
                  <Button variant="ghost" size="icon"><Settings className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-6">
                   {rooms.length === 0 && <p className="col-span-full text-center py-10 text-slate-400 italic">Aucune chambre configurée</p>}
                   {rooms.map(room => (
                     <Card 
                        key={room.id} 
                        className={`cursor-pointer transition-all hover:scale-105 border-2 ${selectedRoom?.id === room.id ? 'border-indigo-600 bg-indigo-50 shadow-lg' : 'border-slate-100'}`}
                        onClick={() => setSelectedRoom(room)}
                      >
                        <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                           <div className="text-xl font-black text-slate-900 leading-none">{room.room_number}</div>
                           <div className="text-[10px] uppercase font-bold text-slate-400">{room.type}</div>
                           <div className="mt-1">{getStatusBadge(room.status)}</div>
                           <div className="text-xs font-mono font-bold mt-2">{Number(room.price).toLocaleString()} <span className="text-[8px]">CFA</span></div>
                        </CardContent>
                     </Card>
                   ))}
                </div>
              </CardContent>
           </Card>
        </div>

        <div className="space-y-6">
           <Card className="border-none shadow-md bg-white sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg font-black text-slate-900">Détails Sélection</CardTitle>
                <CardDescription>Actions rapides sur l'unité</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 {selectedRoom ? (
                   <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                      <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                         <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest">
                            <span>Chambre</span>
                            <span>Statut</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-2xl font-black text-slate-900">{selectedRoom.room_number}</span>
                            {getStatusBadge(selectedRoom.status)}
                         </div>
                         <div className="text-sm font-bold text-indigo-600 mt-2">{selectedRoom.type} • {Number(selectedRoom.price).toLocaleString()} CFA / nuit</div>
                      </div>

                      {selectedRoom.status === 'available' && (
                        <Dialog open={isCheckinOpen} onOpenChange={setIsCheckinOpen}>
                          <DialogTrigger asChild>
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl font-bold">Effectuer un Check-in</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Enregistrement Client</DialogTitle>
                              <CardDescription>Chambre {selectedRoom.room_number}</CardDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                               <div className="space-y-2">
                                 <Label>Nom du Client</Label>
                                 <Input placeholder="M. Tidiane Diallo" value={checkinForm.guest_name} onChange={e => setCheckinForm({...checkinForm, guest_name: e.target.value})} />
                               </div>
                               <div className="space-y-2">
                                 <Label>N° Téléphone</Label>
                                 <Input placeholder="+242 06 xxx xx xx" value={checkinForm.guest_phone} onChange={e => setCheckinForm({...checkinForm, guest_phone: e.target.value})} />
                               </div>
                               <Button className="w-full bg-indigo-600" onClick={handleCheckin}>Valider l'occupation</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {selectedRoom.status === 'occupied' && (
                         <Button variant="outline" className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 h-12 rounded-xl font-bold">Libérer (Check-out)</Button>
                      )}

                      {selectedRoom.status === 'cleaning' && (
                         <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl font-bold">Marquer comme Prête</Button>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         <Button variant="ghost" className="h-8 gap-1"><AlertCircle className="w-3 h-3"/> Maintenance</Button>
                         <Button variant="ghost" className="h-8 gap-1 text-rose-500"><Trash2 className="w-3 h-3"/> Supprimer</Button>
                      </div>
                   </div>
                 ) : (
                   <div className="text-center py-20 text-slate-400 space-y-4">
                      <BedDouble className="w-12 h-12 mx-auto opacity-20" />
                      <p className="font-medium text-sm">Sélectionnez une chambre pour voir les détails et actions disponibles.</p>
                   </div>
                 )}
              </CardContent>
           </Card>
        </div>
      </div>
      
    </div>
  );
}
