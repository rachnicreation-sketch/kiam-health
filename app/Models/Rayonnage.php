<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rayonnage extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function allee()
    {
        return $this->belongsTo(Allee::class);
    }

    public function emplacements()
    {
        return $this->hasMany(Emplacement::class);
    }
}
