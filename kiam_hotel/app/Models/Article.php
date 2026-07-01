<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Article extends Model
{
    /** @use HasFactory<\Database\Factories\ArticleFactory> */
    use HasFactory, SoftDeletes, \App\Traits\Observable;
    protected static function boot()
    {
        parent::boot();
        static::bootObservable();
    }

    protected $fillable = [
        'article', 'reference', 'code_barre', 'marque', 'fabricant', 'categorie', 'category_id',
        'domaine_utilisation', 'date_acquisition', 'supplier_id', 
        'numero_facture', 'prix_achat', 'quantite_acquise', 
        'quantite_utilisee', 'quantite_reservee', 'quantite_stock', 
        'stock_minimum', 'localisation', 'total', 'observation', 
        'magasin_id', 'warehouse_id', 'emplacement_id', 'statut', 
        'type_amortissement', 'duree_amortissement', 'valeur_residuelle'
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function emplacement()
    {
        return $this->belongsTo(Emplacement::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    /**
     * Recalculate quantities based on movements.
     */
    public function syncQuantities()
    {
        $movements = $this->stockMovements()->get();
        
        $totalEntree = $movements->where('type', 'entree')->sum('quantite');
        $totalSortie = $movements->where('type', 'sortie')->sum('quantite');
        
        // Qté Utilisée is the sum of all 'sortie' movements
        $this->quantite_utilisee = $totalSortie;
        
        // Qté en Stock = Initial Acquired + Total Entree - Total Sortie
        $this->quantite_stock = $this->quantite_acquise + $totalEntree - $totalSortie;
        
        $this->save();
    }
}
