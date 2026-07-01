<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Article;
use App\Models\StockMovement;

class SyncInitialMovements extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:sync-initial-movements';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create initial stock movements for existing articles without history';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $articles = Article::all();
        $count = 0;

        foreach ($articles as $article) {
            // Check if movement already exists
            if ($article->stockMovements()->count() === 0 && $article->quantite_acquise > 0) {
                StockMovement::create([
                    'article_id' => $article->id,
                    'user_id' => 1, // Default to admin/system user
                    'type' => 'entree',
                    'quantite' => $article->quantite_acquise,
                    'quantite_avant' => 0,
                    'quantite_apres' => $article->quantite_acquise,
                    'date_mouvement' => $article->created_at,
                    'motif' => 'acquisition',
                    'notes' => 'Initialisation historique (Sync)',
                    'warehouse_to' => $article->warehouse_id,
                    'created_at' => $article->created_at,
                    'updated_at' => $article->created_at,
                ]);
                $count++;
                $this->info("Created initial movement for: {$article->article}");
            }
        }

        $this->info("Synchronization complete. {$count} movements created.");
    }
}
