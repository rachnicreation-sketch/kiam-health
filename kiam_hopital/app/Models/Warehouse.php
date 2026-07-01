<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Observable;
use App\Models\Zone;
use App\Models\Article;

class Warehouse extends Model
{
    use HasFactory, SoftDeletes, Observable;

    protected static function boot()
    {
        parent::boot();
        static::bootObservable();
    }

    protected $guarded = ['id'];

    public function zones()
    {
        return $this->hasMany(Zone::class);
    }

    public function articles()
    {
        return $this->hasMany(Article::class);
    }
}
