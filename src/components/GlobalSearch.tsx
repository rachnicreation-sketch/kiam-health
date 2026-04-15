import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  User, 
  Stethoscope, 
  Receipt, 
  FlaskConical,
  X,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Patient, User as UserType, Invoice, LabTest } from "@/lib/mock-data";
import { 
  Command, 
  CommandGroup, 
  CommandItem, 
  CommandList, 
  CommandInput,
  CommandEmpty 
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export function GlobalSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const clinicId = user?.clinicId;
    if (!clinicId) return;

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await api.search.query(clinicId, query);
        setResults(data);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, user]);

  const handleSelect = (path: string) => {
    setOpen(false);
    setQuery("");
    navigate(path);
  };

  return (
    <div className="relative w-full max-w-sm">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 cursor-pointer hover:bg-muted/80 transition-colors border border-transparent focus-within:border-primary/20">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground w-48 text-left">
              {query || "Rechercher un dossier..."}
            </span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[400px]" align="start">
          <Command className="rounded-lg shadow-md border-none">
            <CommandInput 
              placeholder="Rechercher patient, médecin, facture..." 
              value={query}
              onValueChange={setQuery}
              className="border-none focus:ring-0"
            />
            <CommandList className="max-h-[400px] overflow-y-auto">
              <CommandEmpty>{isLoading ? "Recherche en cours..." : `Aucun résultat pour "${query}"`}</CommandEmpty>
              
              <CommandGroup heading="Résultats">
                {results.map((res: any) => (
                  <CommandItem 
                    key={`${res.type}-${res.id}`} 
                    onSelect={() => handleSelect(res.url)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        res.type === 'patient' ? 'bg-primary/10 text-primary' : 
                        res.type === 'staff' ? 'bg-emerald-100 text-emerald-600' : 
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {res.type === 'patient' ? <User className="h-4 w-4" /> : 
                         res.type === 'staff' ? <Stethoscope className="h-4 w-4" /> : 
                         <Receipt className="h-4 w-4" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold uppercase">{res.title}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{res.subtitle}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-20" />
                  </CommandItem>
                ))}
              </CommandGroup>

              <div className="p-2 mt-2 border-t bg-muted/20">
                 <p className="text-[9px] text-muted-foreground flex items-center gap-1.5 uppercase font-bold tracking-tighter">
                   <TrendingUp className="h-3 w-3" /> Résultats issus de la base de données MySQL.
                 </p>
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
