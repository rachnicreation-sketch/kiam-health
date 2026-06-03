import React, { useState, useEffect } from "react";
import { Search, Loader2, User, FileText, Package, Bed, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/api-service";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "patient" | "invoice" | "staff" | "product" | "room" | "student" | "customer";
  url: string;
}

export const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        try {
          const data = await apiRequest(`search.php?query=${query}`);
          setResults(data);
          setOpen(true);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const getIcon = (type: string) => {
    switch (type) {
      case "patient": return <User className="mr-2 h-4 w-4 text-blue-500" />;
      case "customer": return <User className="mr-2 h-4 w-4 text-emerald-500" />;
      case "invoice": return <FileText className="mr-2 h-4 w-4 text-orange-500" />;
      case "product": return <Package className="mr-2 h-4 w-4 text-purple-500" />;
      case "room": return <Bed className="mr-2 h-4 w-4 text-indigo-500" />;
      case "student": return <GraduationCap className="mr-2 h-4 w-4 text-sky-500" />;
      default: return <Search className="mr-2 h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder={t("search.placeholder")}
          className="pl-10 pr-10 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl h-10 w-full"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
        )}
      </div>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger className="hidden" />
        <DropdownMenuContent 
          className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[400px] overflow-y-auto rounded-xl shadow-2xl border-slate-100 mt-2"
          align="start"
        >
          <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 py-2">
            {t("search.no_results")}
          </DropdownMenuLabel>
          
          {results.length > 0 ? (
            <>
              <DropdownMenuSeparator />
              {results.map((result) => (
                <DropdownMenuItem
                  key={`${result.type}-${result.id}`}
                  className="px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors rounded-lg mx-1"
                  onClick={() => {
                    navigate(result.url);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <div className="flex items-center">
                    {getIcon(result.type)}
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{result.title}</span>
                      <span className="text-xs text-slate-500">{result.subtitle}</span>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          ) : (
            query.length >= 2 && !loading && (
              <div className="px-4 py-6 text-center text-slate-400 italic text-sm">
                {t("search.no_results")}
              </div>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
