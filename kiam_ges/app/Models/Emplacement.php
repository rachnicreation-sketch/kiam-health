<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Emplacement extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function rayonnage()
    {
        return $this->belongsTo(Rayonnage::class);
    }

    public function articles()
    {
        return $this->hasMany(Article::class);
    }
}
