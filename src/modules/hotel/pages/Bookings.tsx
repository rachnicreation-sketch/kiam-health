import { useState, useEffect } from "react";
import {
  CalendarCheck,
  ArrowLeft,
  Search,
  Download,
  LogIn,
  LogOut,
  User,
  Clock,
  BedDouble
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; color: string }> = {
  checked_in:  { label: 'En séjour',   color: 'bg-violet-100 text-violet-700' },
  checked_out: { label: 'Parti',       color: 'bg-slate-100 text-slate-500' },
  reserved:    { label: 'Réservé',     color: 'bg-sky-100 text-sky-700' },
  cancelled:   { label: 'Annulé',      color: 'bg-rose-100 text-rose-700' },
};

export default function Bookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { loadData(); }, [user]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const data = await api.hotel.bookings(user.clinicId);
      setBookings(data);
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les réservations." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async (booking: any) => {
    try {
      await api.hotel.checkout({ booking_id: booking.id, room_id: booking.room_id, clinicId: user.clinicId });
      toast({ title: "Check-out effectué", description: `La chambre est maintenant en nettoyage.` });
      loadData();
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Échec du check-out." });
    }
  };

  const filtered = bookings.filter(b =>
    b.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.id?.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/hotel')} className="rounded-2xl bg-white shadow-sm border border-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <CalendarCheck className="h-8 w-8 text-violet-600" /> Journal des Séjours
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Historique complet des réservations et séjours clients.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="font-bold gap-2 border-slate-200 rounded-xl h-11 px-5 shadow-sm">
            <Download className="w-4 h-4" /> Exporter
          </Button>
          <Button className="bg-hotel-gradient text-white font-bold gap-2 shadow-lg shadow-violet-200 h-11 px-5 rounded-xl" onClick={() => navigate('/hotel')}>
            <LogIn className="w-4 h-4" /> Nouveau Check-in
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
        <CardHeader className="bg-slate-50/50 border-b p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher client, chambre, ID..."
                className="pl-10 h-11 bg-white border-slate-200 rounded-xl"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <Badge key={key} className={`${cfg.color} border-none text-[9px] font-black uppercase px-3 py-1`}>
                  {cfg.label}: {bookings.filter(b => b.status === key).length}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-6">Client</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chambre</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Arrivée</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Départ</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Montant</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statut</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right p-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center opacity-20">
                      <CalendarCheck className="h-16 w-16 mb-4" />
                      <p className="font-black text-lg uppercase tracking-widest">AUCUNE RÉSERVATION</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(booking => {
                  const cfg = statusConfig[booking.status] || statusConfig.reserved;
                  return (
                    <TableRow key={booking.id} className="group hover:bg-slate-50/50 transition-colors border-slate-100">
                      <TableCell className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-violet-50 flex items-center justify-center font-black text-violet-600 text-sm">
                            {booking.guest_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{booking.guest_name}</p>
                            <p className="text-[10px] text-slate-400">{booking.guest_phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BedDouble className="h-4 w-4 text-slate-300" />
                          <span className="text-sm font-black text-slate-700">{booking.room_number || '—'}</span>
                          <span className="text-[9px] text-slate-400 uppercase font-bold">{booking.room_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          <LogIn className="h-3 w-3 text-emerald-500" />
                          {booking.check_in ? new Date(booking.check_in).toLocaleDateString('fr-FR') : '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                          <LogOut className="h-3 w-3 text-rose-400" />
                          {booking.check_out ? new Date(booking.check_out).toLocaleDateString('fr-FR') : <span className="italic text-[10px]">En cours</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-black font-mono text-violet-600">
                          {Number(booking.total_amount || 0).toLocaleString()} <span className="text-[9px]">CFA</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${cfg.color} border-none text-[9px] uppercase font-black`}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right p-6">
                        {booking.status === 'checked_in' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[10px] font-black uppercase border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl"
                            onClick={() => handleCheckout(booking)}
                          >
                            <LogOut className="h-3 w-3 mr-1" /> Check-out
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="p-6 border-t bg-slate-50/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filtered.length} séjour(s) enregistré(s)</p>
        </CardFooter>
      </Card>
    </div>
  );
}
