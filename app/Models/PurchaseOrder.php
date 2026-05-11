<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    /** @use HasFactory<\Database\Factories\PurchaseOrderFactory> */
    use HasFactory, \App\Traits\Observable;
    
    protected $fillable = [
        'supplier_id', 'warehouse_id', 'user_id', 'reference', 'total_amount', 'status', 'expected_arrival_date', 'notes',
        'carrier', 'tracking_number', 'estimated_shipping_date', 'estimated_delivery_date'
    ];

    protected static function boot()
    {
        parent::boot();
        static::bootObservable();

        static::creating(function ($model) {
            if (!$model->reference) {
                // Generate a unique reference like BC-2026-00001
                $latest = static::latest('id')->first();
                $nextId = $latest ? $latest->id + 1 : 1;
                $model->reference = 'BC-' . date('Y') . '-' . str_pad($nextId, 5, '0', STR_PAD_LEFT);
            }
        });
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }
}
