import { useState, useEffect } from "react";
import {
  Video, Mic, MicOff, VideoOff, Send, MessageSquare, User,
  Calendar, CheckCircle2, AlertCircle, Phone, PhoneOff, Settings
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface ConsultationVideo {
  id: string;
  patientName: string;
  time: string;
  status: "scheduled" | "active" | "ended";
  notes?: string;
}

export default function Telemedicine() {
  const { toast } = useToast();
  const [consultations, setConsultations] = useState<ConsultationVideo[]>([
    { id: "TC-001", patientName: "Awa Diop", time: "14:30", status: "scheduled" },
    { id: "TC-002", patientName: "Ibrahima Ndiaye", time: "15:15", status: "scheduled" },
  ]);
  const [activeSession, setActiveSession] = useState<ConsultationVideo | null>(null);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [summary, setSummary] = useState("");

  const startSession = (session: ConsultationVideo) => {
    setActiveSession({ ...session, status: "active" });
    setChatMessages([{ sender: "Système", text: `La session de télémédecine avec ${session.patientName} a démarré.` }]);
    toast({ title: "Session démarrée" });
  };

  const endSession = () => {
    if (!activeSession) return;
    setConsultations(prev => prev.map(c => c.id === activeSession.id ? { ...c, status: "ended", notes: summary } : c));
    setActiveSession(null);
    setSummary("");
    toast({ title: "Session terminée", description: "Le compte-rendu a été enregistré dans le dossier patient." });
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages([...chatMessages, { sender: "Dr. Diallo", text: chatInput }]);
    setChatInput("");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Video className="h-7 w-7 text-sky-600" /> Télémédecine
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Consultation vidéo en direct et rédaction du compte-rendu lié au dossier patient.</p>
        </div>
      </div>

      {!activeSession ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-bold text-lg text-slate-900">Prochaines téléconsultations</h2>
            {consultations.filter(c => c.status === "scheduled").map(c => (
              <Card key={c.id} className="border-none shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{c.patientName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Aujourd'hui à {c.time}
                      </p>
                    </div>
                  </div>
                  <Button className="bg-sky-600 hover:bg-sky-700 text-white gap-1" onClick={() => startSession(c)}>
                    <Video className="h-4 w-4" /> Rejoindre l'appel
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-none shadow-md">
            <CardHeader><CardTitle className="text-sm font-bold text-muted-foreground uppercase">Guide Télémédecine</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <p>1. Assurez-vous d'avoir une connexion internet stable et d'autoriser l'accès à la caméra et au microphone.</p>
              <p>2. Le patient recevra une notification automatique par SMS et email avec le lien de connexion de sa consultation vidéo.</p>
              <p>3. En fin d'appel, saisissez votre compte-rendu médical pour l'intégrer automatiquement au dossier médical du patient.</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Simulator area */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-none bg-slate-950 text-white shadow-2xl relative overflow-hidden aspect-video">
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <Video className="h-16 w-16 text-slate-800 animate-pulse" />
                <p className="absolute bottom-4 left-4 text-xs font-semibold text-sky-400">Flux vidéo de {activeSession.patientName} (simulateur)</p>
              </div>

              {/* Doctor Pip */}
              <div className="absolute top-4 right-4 w-28 aspect-video rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                {videoOn ? <User className="h-6 w-6 text-slate-400" /> : <VideoOff className="h-6 w-6 text-rose-500" />}
              </div>

              {/* Call Controls */}
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
                <Button size="icon" variant={micOn ? "default" : "destructive"} className="rounded-full w-10 h-10" onClick={() => setMicOn(!micOn)}>
                  {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant={videoOn ? "default" : "destructive"} className="rounded-full w-10 h-10" onClick={() => setVideoOn(!videoOn)}>
                  {videoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="destructive" className="rounded-full w-12 h-12 bg-rose-600 hover:bg-rose-700" onClick={endSession}>
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </div>
            </Card>

            {/* Note taking */}
            <Card className="border-none shadow-sm">
              <CardContent className="p-4 space-y-3">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Compte-rendu de consultation en direct</Label>
                <Textarea placeholder="Observations cliniques, prescriptions..." value={summary} onChange={e => setSummary(e.target.value)} rows={4} />
              </CardContent>
            </Card>
          </div>

          {/* Chat Panel */}
          <Card className="border-none shadow-md flex flex-col h-[500px]">
            <CardHeader className="border-b"><CardTitle className="text-sm font-bold text-muted-foreground uppercase">Chat de consultation</CardTitle></CardHeader>
            <div className="flex-1 p-4 overflow-y-auto space-y-2 text-xs">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`p-2 rounded-lg ${msg.sender === "Dr. Diallo" ? "bg-sky-50 text-sky-900 text-right ml-8" : "bg-slate-50 text-slate-900 mr-8"}`}>
                  <p className="font-bold mb-0.5">{msg.sender}</p>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={sendChatMessage} className="p-3 border-t flex gap-2">
              <Input className="text-xs" placeholder="Écrire un message..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
              <Button type="submit" size="sm" className="bg-sky-600 hover:bg-sky-700 text-white">Envoyer</Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
