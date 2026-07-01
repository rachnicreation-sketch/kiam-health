<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Article;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class StockSyncFromExcel extends Command
{
    protected $signature = 'stock:sync-excel {--dry-run}';
    protected $description = 'Sync article stock from INVENTAIRE BUREAU_.xls';

    public function handle()
    {
        $filePath = 'C:\Users\USER02\Documents\BUREAU\INVENTAIRE BUREAU_.xls';
        $jsonPath = 'C:\tmp\inventory_data.json';

        $this->info("Extracting data from Excel...");
        $tempJson = "C:\\tmp\\inventory_temp.json";
        
        // Run python script to extract JSON
        $pythonScript = "import pandas as pd; import json; df = pd.read_excel(r'{$filePath}', header=7); df = df.dropna(subset=['ARTICLE']).fillna(''); data = df.to_dict(orient='records'); f = open(r'{$tempJson}', 'w', encoding='utf-8'); json.dump(data, f, ensure_ascii=False); f.close()";
        
        $cmd = "python -c " . escapeshellarg($pythonScript);
        shell_exec($cmd);
        
        if (!file_exists($tempJson)) {
            $this->error("Failed to extract data from Excel. Temporary file not created.");
            return 1;
        }

        $output = file_get_contents($tempJson);
        $items = json_decode($output, true);
        @unlink($tempJson);

        if (!$items) {
            $this->error("Invalid JSON data extracted.");
            return 1;
        }

        $this->info("Found " . count($items) . " items to sync.");

        $admin = User::first(); // Use first user for movement attribution

        DB::transaction(function () use ($items, $admin) {
            foreach ($items as $item) {
                $articleName = isset($item['ARTICLE']) ? trim($item['ARTICLE']) : null;
                $reference = isset($item['REFERENCES']) ? trim($item['REFERENCES']) : null;

                if (!$articleName) continue;

                $this->line("Processing: $articleName ($reference)");

                // Try to find by unique reference first
                $article = null;
                if ($reference) {
                    $article = Article::where('reference', $reference)->first();
                }

                if (!$article) {
                    $article = Article::where('article', $articleName)->first();
                }

                if (!$article) {
                    $this->warn(" Article not found. Creating new article...");
                    $article = new Article();
                    $article->article = $articleName;
                    $article->reference = $reference;
                }

                $article->marque = $item['MARQUE'] ?? $article->marque;
                $article->domaine_utilisation = $item['DOMAINE D\'UTLISATION'] ?? $article->domaine_utilisation;
                $article->categorie = $item['SECTEUR'] ?? $article->categorie;
                $article->numero_facture = $item['NUMERO DE FACTURE'] ?? $article->numero_facture;
                $article->observation = $item['OBSERVATION'] ?? $article->observation;
                $article->prix_achat = floatval($item['PRIX D\'ACHAT'] ?? $article->prix_achat);
                
                // Handle Supplier
                $supplierName = $item['FOURNISSEUR'] ?? null;
                if ($supplierName && $supplierName !== '') {
                    $supplier = \App\Models\Supplier::firstOrCreate(['nom' => $supplierName]);
                    $article->supplier_id = $supplier->id;
                }

                // Handle quantities
                $qteAcquise = floatval($item['Qté ACQUISE'] ?? ($item['Qté ACQUISE'] ?? 0));
                $qteUtiliseeExcel = floatval($item['Qté UTILISEE'] ?? 0);
                $qteStockExcel = floatval($item['Qté en STOCK'] ?? 0);

                // If qteAcquise is 0 but we have stock, use stock as acquired base
                if ($qteAcquise == 0 && $qteStockExcel > 0) {
                    $qteAcquise = $qteStockExcel + $qteUtiliseeExcel;
                }

                $article->quantite_acquise = $qteAcquise;
                
                if (!$this->option('dry-run')) {
                    $article->save();
                    
                    // Recalculate based on existing movements or create adjustment if needed
                    $article->syncQuantities();
                    
                    // If after sync, the stock doesn't match the Excel, create an adjustment movement
                    if ($article->quantite_stock != $qteStockExcel) {
                        $diff = $qteStockExcel - $article->quantite_stock;
                        $type = $diff > 0 ? 'entree' : 'sortie';
                        
                        StockMovement::create([
                            'article_id' => $article->id,
                            'type' => $type,
                            'quantite' => abs($diff),
                            'date_mouvement' => now(),
                            'motif' => 'Initialisation/Correction via Inventaire Bureau',
                            'user_id' => $admin->id,
                            'quantite_avant' => $article->quantite_stock,
                            'quantite_apres' => $qteStockExcel,
                        ]);
                    }
                } else {
                    $this->info(" [DRY RUN] Would update/sync $articleName: Acquis=$qteAcquise, ExcelStock=$qteStockExcel, ExcelUtilisee=$qteUtiliseeExcel");
                }
            }
        });

        $this->info("Synchronization completed.");
    }
}
