<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Article;
use App\Models\User;
use App\Models\Warehouse;

class StockMovement extends Model
{
    /** @use HasFactory<\Database\Factories\StockMovementFactory> */
    use HasFactory, \App\Traits\Observable;

    protected static function boot()
    {
        parent::boot();
        static::bootObservable();

        static::saved(function ($movement) {
            if ($article = $movement->article) {
                $article->syncQuantities();
            }
        });

        static::deleted(function ($movement) {
            if ($article = $movement->article) {
                $article->syncQuantities();
            }
        });
    }

    protected $guarded = ['id'];

    protected $casts = [
        'date_mouvement' => 'date',
    ];

    public function article()
    {
        return $this->belongsTo(Article::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function warehouseFrom()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_from');
    }

    public function warehouseTo()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_to');
    }
}
