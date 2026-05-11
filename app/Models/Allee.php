<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Allee extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    public function rayonnages()
    {
        return $this->hasMany(Rayonnage::class);
    }
}
