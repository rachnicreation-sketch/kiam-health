import { useState, useEffect } from "react";
import { Receipt, Download, FileText, Plus } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";

export default function Billing() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.clinicId) {
      loadPayments();
    }
  }, [user]);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const data = await api.school.payments(user!.clinicId!);
      setPayments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-2 sm:p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-edu-gradient flex items-center justify-center text-white shadow-lg"><Receipt /></div>
            Facturation Scolarité
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Gestion des factures, échéanciers et reçus.</p>
        </div>
        <Button className="bg-edu-gradient text-white h-11 px-6 rounded-xl shadow-lg shadow-sky-200">
          <Plus className="w-4 h-4 mr-2" /> Nouveau Paiement
        </Button>
      </div>

      <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[2rem]">
         <CardContent className="p-0">
           <div className="overflow-x-auto">
             <Table>
               <TableHeader className="bg-slate-50/30">
                  <TableRow className="border-none">
                    <TableHead className="px-6 py-4">Paiement / ID</TableHead>
                    <TableHead className="py-4">Élève</TableHead>
                    <TableHead className="py-4">Montant</TableHead>
                    <TableHead className="py-4">Statut</TableHead>
                    <TableHead className="text-right px-6 py-4">Reçu</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10">Chargement...</TableCell></TableRow>
                  ) : payments.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-400 italic">Aucun paiement enregistré</TableCell></TableRow>
                  ) : (
                    payments.map(payment => (
                      <TableRow key={payment.id} className="hover:bg-sky-50/30 transition-colors">
                         <TableCell className="px-6 py-4 font-mono text-sm">{payment.id}</TableCell>
                         <TableCell className="py-4 font-bold">{payment.name} {payment.first_name}</TableCell>
                         <TableCell className="py-4 font-black text-slate-800">{payment.amount} CFA</TableCell>
                         <TableCell className="py-4">
                            <Badge className={payment.status === 'paid' ? "bg-emerald-100 text-emerald-700 border-none" : "bg-amber-100 text-amber-700 border-none"}>
                              {payment.status === 'paid' ? 'Payé' : 'En attente'}
                            </Badge>
                         </TableCell>
                         <TableCell className="text-right px-6 py-4"><Download className="w-5 h-5 text-slate-400 inline cursor-pointer hover:text-sky-600" /></TableCell>
                      </TableRow>
                    ))
                  )}
               </TableBody>
             </Table>
           </div>
         </CardContent>
      </Card>
    </div>
  );
}
