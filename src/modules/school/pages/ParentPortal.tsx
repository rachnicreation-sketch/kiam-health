import { useState } from "react";
import {
  Users, Search, Plus, Filter, MessageSquare, CheckCircle2,
  AlertCircle, DollarSign, Clock, Calendar, FileText, Send
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface ParentChild {
  studentName: string;
  className: string;
  notesAverage: number;
  absencesCount: number;
}

const MOCK_CHILDREN: ParentChild[] = [
  { studentName: "Saliou Diop", className: "4ème B", notesAverage: 14.5, absencesCount: 2 },
  { studentName: "Mariama Diop", className: "CM1-A", notesAverage: 16.8, absencesCount: 0 },
];

export default function ParentPortal() {
  const { toast } = useToast();
  const [children] = useState<ParentChild[]>(MOCK_CHILDREN);
  const [message, setMessage] = useState("");

  const sendMessageToSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    toast({ title: "Message envoyé", description: "L'administration ou l'enseignant vous répondra sous peu." });
    setMessage("");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Users className="h-7 w-7 text-amber-600" /> Portail Parents
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Espace dédié aux parents d'élèves pour le suivi des notes, absences, règlements de scolarité et messagerie directe.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Children details */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg text-slate-900">Mes Enfants</h2>
          {children.map((child, i) => (
            <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base">{child.studentName}</h3>
                    <p className="text-xs text-muted-foreground">Classe : {child.className}</p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">Inscrit</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <p className="text-2xl font-black text-slate-800">{child.notesAverage}/20</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">Moyenne Générale</p>
                  </div>
                  <div className="bg-rose-50 p-2.5 rounded-xl">
                    <p className="text-2xl font-black text-rose-700">{child.absencesCount}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">Absences</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Messaging with school */}
        <Card className="border-none shadow-md">
          <CardHeader className="border-b">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-600" /> Contacter l'établissement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={sendMessageToSchool} className="space-y-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Destinataire</Label>
                <select className="w-full mt-1 border border-slate-200 rounded-lg p-2 text-sm bg-white">
                  <option>Administration Générale</option>
                  <option>Enseignant Principal de Saliou</option>
                  <option>Enseignant Principal de Mariama</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Message</Label>
                <Textarea className="mt-1" rows={4} placeholder="Saisissez votre message..." value={message} onChange={e => setMessage(e.target.value)} />
              </div>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2">
                <Send className="h-4 w-4" /> Envoyer le message
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
