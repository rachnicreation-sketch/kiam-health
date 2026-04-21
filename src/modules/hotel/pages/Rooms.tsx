import { useState, useEffect } from "react";
import {
  BedDouble,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  available:    { label: 'Libre',        color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
  occupied:     { label: 'Occupée',      color: 'text-violet-600',  bg: 'bg-violet-50 border-violet-100' },
  cleaning:     { label: 'Nettoyage',    color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-100' },
  maintenance:  { label: 'Maintenance',  color: 'text-rose-600',    bg: 'bg-rose-50 border-rose-100' },
};

export default function Rooms() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const [form, setForm] = useState({
    room_number: '',
    type: 'Standard',
    price: '',
    category: 'Standard'
  });

  useEffect(() => { loadData(); }, [user]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const data = await api.hotel.rooms(user.clinicId);
      setRooms(data);
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les chambres." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.room_number || !form.price) return;
    try {
      await api.hotel.addRoom({ ...form, clinicId: user.clinicId });
      toast({ title: "Chambre créée", description: `La chambre ${form.room_number} est prête.` });
      setIsAddOpen(false);
      setForm({ room_number: '', type: 'Standard', price: '', category: 'Standard' });
      loadData();
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de la création." });
    }
  };

  const filtered = filterStatus === 'all' ? rooms : rooms.filter(r => r.status === filterStatus);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/hotel')} className="rounded-2xl bg-white shadow-sm border border-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <BedDouble className="h-8 w-8 text-violet-600" /> Parc Hôtelier
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Configuration et gestion de toutes les unités.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-hotel-gradient text-white font-bold gap-2 shadow-lg shadow-violet-200 h-11 px-6 rounded-xl">
                <Plus className="w-4 h-4" /> Nouvelle Chambre
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white border-none rounded-[2.5rem] p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black border-none">Créer une Chambre</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">N° Chambre *</Label>
                    <Input className="h-12 rounded-xl bg-slate-50 border-none" placeholder="101" value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">Type</Label>
                    <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none"><SelectValue /></SelectTrigger>
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
                  <Label className="text-xs font-bold uppercase text-slate-500">Prix par Nuit (CFA) *</Label>
                  <Input type="number" className="h-12 rounded-xl bg-slate-50 border-none" placeholder="45000" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                </div>
                <Button className="w-full h-14 bg-hotel-gradient text-white font-black rounded-2xl" onClick={handleAdd}>CRÉER LA CHAMBRE</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'available', 'occupied', 'cleaning', 'maintenance'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              filterStatus === status
                ? 'bg-slate-900 text-white shadow-lg'
                : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-200'
            }`}
          >
            {status === 'all' ? 'Toutes' : statusConfig[status]?.label}
            <span className="ml-2 opacity-60">
              ({status === 'all' ? rooms.length : rooms.filter(r => r.status === status).length})
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filtered.map(room => {
          const config = statusConfig[room.status] || statusConfig.available;
          return (
            <Card
              key={room.id}
              className={`border-2 ${config.bg} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer rounded-[2rem] overflow-hidden`}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="text-2xl font-black text-slate-900 leading-none mt-2">{room.room_number}</div>
                <div className="text-[9px] uppercase font-bold tracking-widest text-slate-400">{room.type}</div>
                <Badge className={`${config.color} bg-white border border-current/20 text-[9px] font-black uppercase px-2 py-0`}>
                  {config.label}
                </Badge>
                <div className="text-[10px] font-black font-mono text-slate-700 mt-1">
                  {Number(room.price).toLocaleString()} <span className="text-[8px]">CFA</span>
                </div>
              </CardContent>
              <div className="border-t border-current/10 p-2 flex gap-1 justify-center">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl text-slate-400 hover:text-violet-600"><Edit2 className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl text-slate-400 hover:text-rose-600"><Trash2 className="h-3 w-3" /></Button>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-20 text-slate-400 opacity-30 space-y-4">
            <BedDouble className="h-16 w-16 mx-auto" />
            <p className="font-black uppercase tracking-widest text-sm">Aucune chambre dans cette catégorie</p>
          </div>
        )}
      </div>
    </div>
  );
}
