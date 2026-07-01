<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    /** @use HasFactory<\Database\Factories\InventoryFactory> */
    use HasFactory, \App\Traits\Observable;

    protected static function boot()
    {
        parent::boot();
        static::bootObservable();
    }

    protected $guarded = ['id'];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
    ];

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lines()
    {
        return $this->hasMany(InventoryLine::class);
    }
}
