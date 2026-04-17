import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { 
  Send, 
  User, 
  Search, 
  MessageSquare, 
  MoreVertical,
  Circle,
  Paperclip,
  Smile,
  Hash
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface UserChat {
  id: string;
  name: string;
  role: string;
  email: string;
}

export default function Messaging() {
  const { user } = useAuth();
  const [colleagues, setColleagues] = useState<UserChat[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserChat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.clinicId) {
      loadColleagues();
    }
  }, [user]);

  useEffect(() => {
    if (user?.clinicId && selectedUser) {
      loadChat();
      const interval = setInterval(loadChat, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedUser, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const loadColleagues = async () => {
    try {
      const data = await api.messages.listUsers(user!.clinicId!);
      setColleagues(data.filter((u: UserChat) => u.id !== user?.id));
    } catch (error) {
      console.error("Error loading colleagues:", error);
    }
  };

  const loadChat = async () => {
    if (!selectedUser || !user) return;
    try {
      const data = await api.messages.chatHistory(user.clinicId!, user.id, selectedUser.id);
      setMessages(data);
    } catch (error) {
      console.error("Error loading chat:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !user) return;

    try {
      await api.messages.sendMessage(user.clinicId!, {
        sender_id: user.id,
        receiver_id: selectedUser.id,
        content: newMessage
      });
      setNewMessage("");
      loadChat();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const filteredColleagues = colleagues.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 animate-in fade-in duration-500">
      {/* Sidebar List */}
      <Card className="w-80 flex flex-col shadow-xl border-none overflow-hidden bg-white/80 backdrop-blur-md">
        <div className="p-4 bg-primary text-white">
           <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> Messagerie
              </h2>
              <Badge variant="outline" className="border-white/30 text-white text-[10px] uppercase">Interne</Badge>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input 
                placeholder="Rechercher un collègue..." 
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30 h-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredColleagues.map((c) => (
              <div 
                key={c.id}
                onClick={() => setSelectedUser(c)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group ${selectedUser?.id === c.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase">{c.name.substring(0,2)}</AvatarFallback>
                  </Avatar>
                  <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-emerald-500 text-white border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-slate-800 truncate">{c.name}</p>
                    <span className="text-[10px] text-muted-foreground">Now</span>
                  </div>
                  <p className="text-[10px] font-medium text-primary uppercase tracking-wider">{c.role}</p>
                </div>
              </div>
            ))}
            {filteredColleagues.length === 0 && (
               <div className="text-center py-8 text-muted-foreground text-xs italic">
                  Aucun collègue trouvé
               </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col shadow-xl border-none overflow-hidden bg-white/80 backdrop-blur-md">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 border-2 border-primary/10">
                   <AvatarFallback className="bg-primary/5 text-primary text-sm font-black uppercase">{selectedUser.name.substring(0,2)}</AvatarFallback>
                </Avatar>
                <div>
                   <h3 className="font-black text-slate-800 leading-tight">{selectedUser.name}</h3>
                   <div className="flex items-center gap-2">
                      <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">{selectedUser.role} • En ligne</span>
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                 <Button variant="ghost" size="icon" className="text-muted-foreground"><Hash className="h-4 w-4" /></Button>
                 <Button variant="ghost" size="icon" className="text-muted-foreground"><MoreVertical className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Messages Body */}
            <ScrollArea className="flex-1 p-6 bg-slate-50/30">
              <div className="space-y-6">
                 <div className="flex justify-center">
                    <Badge variant="outline" className="text-[9px] uppercase font-bold text-muted-foreground bg-white shadow-sm border-slate-100">Aujourd'hui</Badge>
                 </div>
                {messages.map((m, i) => {
                  const isMe = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[70%] space-y-1`}>
                        <div className={`p-4 rounded-2xl shadow-sm border ${isMe ? 'bg-primary text-white rounded-tr-none border-primary' : 'bg-white text-slate-800 rounded-tl-none border-slate-100'}`}>
                          <p className="text-sm font-medium leading-relaxed">{m.content}</p>
                        </div>
                        <p className={`text-[9px] font-bold text-muted-foreground px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && m.is_read && <span className="ml-2 text-primary uppercase">Lu</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-white border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <div className="absolute left-3 bottom-3 flex gap-1">
                     <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-full">
                       <Paperclip className="h-4 w-4" />
                     </Button>
                     <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-full">
                       <Smile className="h-4 w-4" />
                     </Button>
                  </div>
                  <textarea 
                    className="w-full pl-24 pr-4 py-3 bg-muted/30 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 resize-none max-h-32 min-h-[48px]"
                    placeholder="Tapez votre message ici..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                </div>
                <Button type="submit" size="icon" className="h-12 w-12 rounded-2xl shrink-0 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/50">
            <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 animate-bounce">
              <MessageSquare className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Kiam Chat</h3>
            <p className="text-sm text-muted-foreground max-w-xs mt-2 font-medium">
              Sélectionnez un collègue dans la liste pour démarrer une conversation sécurisée.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-8">
               <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase">Consultations</span>
               </div>
               <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Laboratoire</span>
               </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
