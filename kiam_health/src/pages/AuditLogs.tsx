import React, { useState, useEffect } from "react";
import { History, Search, Download, Filter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/api-service";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  user_display_name: string;
  created_at: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await apiRequest("logs.php");
        setLogs(data);
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.user_display_name.toLowerCase().includes(search.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
            <History className="w-8 h-8 text-blue-600" />
            {t("logs.title")}
          </h1>
          <p className="text-slate-500 font-medium">Suivez toutes les actions effectuées par vos collaborateurs.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="rounded-xl font-bold h-11 border-slate-200">
             <Download className="w-4 h-4 mr-2" /> Exporter
           </Button>
        </div>
      </div>

      <Card className="rounded-[2rem] border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden">
        <CardHeader className="border-b border-slate-50 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Rechercher une action, un utilisateur..." 
                className="pl-10 h-11 rounded-xl bg-white border-slate-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 bg-white">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-4">{t("logs.user")}</th>
                  <th className="px-6 py-4">{t("logs.action")}</th>
                  <th className="px-6 py-4">{t("logs.entity")}</th>
                  <th className="px-6 py-4">{t("logs.date")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
                        <span className="font-bold text-xs uppercase tracking-widest">{t("common.loading")}</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                            {log.user_display_name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-900">{log.user_display_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 uppercase tracking-tighter">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                        <span className="text-slate-400 mr-2">{log.entity_type}</span>
                        {log.entity_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                        {format(new Date(log.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">
                      Aucun log trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
