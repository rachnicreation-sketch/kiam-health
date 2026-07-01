<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryLine extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }

    public function article()
    {
        return $this->belongsTo(Article::class);
    }
}
