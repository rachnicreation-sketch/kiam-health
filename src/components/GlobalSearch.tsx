import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  User, 
  Stethoscope, 
  Receipt, 
  FlaskConical,
  X,
  ChevronRight,
  TrendingRight
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
  
  const [results, setResults] = useState<{
    patients: Patient[],
    doctors: UserType[],
    invoices: Invoice[],
    labTests: LabTest[]
  }>({
    patients: [],
    doctors: [],
    invoices: [],
    labTests: []
  });

  useEffect(() => {
    if (query.length < 2) {
      setResults({ patients: [], doctors: [], invoices: [], labTests: [] });
      return;
    }

    const q = query.toLowerCase();
    const clinicId = user?.clinicId;
    if (!clinicId) return;

    const allPatients: Patient[] = JSON.parse(localStorage.getItem('kiam_patients') || '[]');
    const allUsers: UserType[] = JSON.parse(localStorage.getItem('kiam_users') || '[]');
    const allInvoices: Invoice[] = JSON.parse(localStorage.getItem('kiam_invoices') || '[]');
    const allLabTests: LabTest[] = JSON.parse(localStorage.getItem('kiam_lab_tests') || '[]');

    setResults({
      patients: allPatients.filter(p => p.clinicId === clinicId && (p.name.toLowerCase().includes(q) || p.firstName?.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))).slice(0, 5),
      doctors: allUsers.filter(u => u.clinicId === clinicId && u.role === 'doctor' && u.name.toLowerCase().includes(q)).slice(0, 3),
      invoices: allInvoices.filter(i => i.clinicId === clinicId && i.id.toLowerCase().includes(q)).slice(0, 3),
      labTests: allLabTests.filter(t => t.clinicId === clinicId && t.testName.toLowerCase().includes(q)).slice(0, 3)
    });
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
              <CommandEmpty>Aucun résultat trouvé pour "{query}"</CommandEmpty>
              
              {results.patients.length > 0 && (
                <CommandGroup heading="Patients">
                   {results.patients.map(p => (
                     <CommandItem 
                       key={p.id} 
                       onSelect={() => handleSelect(`/patients/${p.id}`)}
                       className="flex items-center justify-between cursor-pointer"
                     >
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                             <User className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-sm font-bold uppercase">{p.name} {p.firstName}</span>
                             <span className="text-[10px] text-muted-foreground font-mono">{p.id}</span>
                          </div>
                       </div>
                       <ChevronRight className="h-4 w-4 text-muted-foreground opacity-20" />
                     </CommandItem>
                   ))}
                </CommandGroup>
              )}

              {results.doctors.length > 0 && (
                <CommandGroup heading="Personnel Médical">
                   {results.doctors.map(d => (
                     <CommandItem 
                       key={d.id} 
                       onSelect={() => handleSelect('/hr')}
                       className="flex items-center gap-3 cursor-pointer"
                     >
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                           <Stethoscope className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-sm font-bold uppercase">Dr {d.name}</span>
                           <span className="text-[10px] text-muted-foreground">{d.specialty}</span>
                        </div>
                     </CommandItem>
                   ))}
                </CommandGroup>
              )}

              {results.invoices.length > 0 && (
                <CommandGroup heading="Factures & Paiements">
                   {results.invoices.map(i => (
                     <CommandItem 
                       key={i.id} 
                       onSelect={() => handleSelect('/billing')}
                       className="flex items-center justify-between cursor-pointer"
                     >
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                              <Receipt className="h-4 w-4 text-amber-600" />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-sm font-bold">{i.id}</span>
                              <span className="text-[10px] text-muted-foreground">{i.total.toLocaleString()} CFA</span>
                           </div>
                        </div>
                        <Badge variant={i.status === 'paid' ? 'default' : 'outline'} className="text-[8px] h-3 px-1">{i.status}</Badge>
                     </CommandItem>
                   ))}
                </CommandGroup>
              )}

              {results.labTests.length > 0 && (
                <CommandGroup heading="Analyses Labo">
                   {results.labTests.map(t => (
                     <CommandItem 
                       key={t.id} 
                       onSelect={() => handleSelect('/laboratory')}
                       className="flex items-center gap-3 cursor-pointer"
                     >
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                           <FlaskConical className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-sm font-bold">{t.testName}</span>
                           <span className="text-[10px] text-muted-foreground capitalize">{t.status}</span>
                        </div>
                     </CommandItem>
                   ))}
                </CommandGroup>
              )}

              <div className="p-2 mt-2 border-t bg-muted/20">
                 <p className="text-[9px] text-muted-foreground flex items-center gap-1.5 uppercase font-bold tracking-tighter">
                   <TrendingRight className="h-3 w-3" /> Tapez au moins 2 caractères pour lancer la recherche intelligente.
                 </p>
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
