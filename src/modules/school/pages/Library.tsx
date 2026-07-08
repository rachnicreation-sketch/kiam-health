import { useState } from "react";
import {
  BookOpen, Search, Plus, Filter, Book, CheckCircle2,
  AlertCircle, Users, Clock, Calendar, Bookmark, RotateCcw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";

interface LibraryBook {
  id: string;
  title: string;
  author: string;
  category: string;
  available: boolean;
  rackLocation: string;
}

interface BorrowRecord {
  id: string;
  studentName: string;
  bookTitle: string;
  borrowDate: string;
  dueDate: string;
  status: "borrowed" | "returned" | "overdue";
}

const MOCK_BOOKS: LibraryBook[] = [
  { id: "B001", title: "L'Enfant Noir", author: "Camara Laye", category: "Littérature", available: true, rackLocation: "A-12" },
  { id: "B002", title: "Une Si Longue Lettre", author: "Mariama Bâ", category: "Littérature", available: false, rackLocation: "A-15" },
  { id: "B003", title: "Physique Chimie Terminale S", author: "Ed. Hatier", category: "Scolaire", available: true, rackLocation: "B-03" },
];

const MOCK_BORROWS: BorrowRecord[] = [
  { id: "BR-001", studentName: "Abdoulaye Diallo", bookTitle: "Une Si Longue Lettre", borrowDate: "2026-07-01", dueDate: "2026-07-15", status: "borrowed" },
  { id: "BR-002", studentName: "Fatou Sow", bookTitle: "L'Enfant Noir", borrowDate: "2026-06-15", dueDate: "2026-06-30", status: "overdue" },
];

export default function Library() {
  const { toast } = useToast();
  const [books, setBooks] = useState<LibraryBook[]>(MOCK_BOOKS);
  const [borrows, setBorrows] = useState<BorrowRecord[]>(MOCK_BORROWS);
  const [search, setSearch] = useState("");

  const returnBook = (id: string) => {
    setBorrows(prev => prev.map(b => b.id === id ? { ...b, status: "returned" } : b));
    toast({ title: "Livre retourné avec succès", description: "L'exemplaire est de nouveau disponible." });
  };

  const filteredBooks = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <BookOpen className="h-7 w-7 text-amber-600" /> Bibliothèque
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gestion du catalogue de livres, suivi des emprunts et relances des retards.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Livres référencés" value={String(books.length)} icon={Book} iconClassName="bg-amber-100 text-amber-600" />
        <StatCard title="Emprunts en cours" value={String(borrows.filter(b => b.status === "borrowed" || b.status === "overdue").length)} icon={Bookmark} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="Retards" value={String(borrows.filter(b => b.status === "overdue").length)} icon={AlertCircle} iconClassName="bg-rose-100 text-rose-600" />
        <StatCard title="Disponible" value={String(books.filter(b => b.available).length)} icon={CheckCircle2} iconClassName="bg-emerald-100 text-emerald-600" />
      </div>

      <Tabs defaultValue="catalog">
        <TabsList className="bg-slate-50 border border-slate-200">
          <TabsTrigger value="catalog">Catalogue</TabsTrigger>
          <TabsTrigger value="borrows">Emprunts en cours</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Rechercher par titre, auteur..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredBooks.map(book => (
              <Card key={book.id} className="border-none shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline">{book.category}</Badge>
                    <Badge className={`text-[10px] ${book.available ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {book.available ? "Disponible" : "Emprunté"}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-tight">{book.title}</h3>
                    <p className="text-xs text-muted-foreground">Auteur : {book.author}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Emplacement : Rayon {book.rackLocation}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="borrows" className="mt-4">
          <Card className="border-none shadow-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs text-muted-foreground uppercase">
                    <tr>
                      <th className="px-6 py-3">Élève</th>
                      <th className="px-6 py-3">Livre</th>
                      <th className="px-6 py-3">Date Emprunt</th>
                      <th className="px-6 py-3">Date Retour attendu</th>
                      <th className="px-6 py-3">Statut</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {borrows.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold">{b.studentName}</td>
                        <td className="px-6 py-4">{b.bookTitle}</td>
                        <td className="px-6 py-4 text-xs">{b.borrowDate}</td>
                        <td className="px-6 py-4 text-xs">{b.dueDate}</td>
                        <td className="px-6 py-4">
                          <Badge className={`text-[10px] ${b.status === "returned" ? "bg-emerald-100 text-emerald-700" : b.status === "overdue" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"}`}>
                            {b.status === "returned" ? "Retourné" : b.status === "overdue" ? "En retard" : "En cours"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {b.status !== "returned" && (
                            <Button size="xs" variant="outline" className="text-xs h-7 gap-1" onClick={() => returnBook(b.id)}>
                              <RotateCcw className="w-3.5 h-3.5" /> Enregistrer Retour
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
