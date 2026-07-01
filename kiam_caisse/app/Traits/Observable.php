<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Request;

trait Observable
{
    protected static function bootObservable()
    {
        static::created(function ($model) {
            static::logChange($model, 'created');
        });

        static::updated(function ($model) {
            static::logChange($model, 'updated');
        });

        static::deleted(function ($model) {
            static::logChange($model, 'deleted');
        });
    }

    protected static function logChange($model, $action)
    {
        $user = auth()->user();
        
        $dataBefore = null;
        $dataAfter = $model->getAttributes();

        if ($action === 'updated') {
            $dataBefore = array_intersect_key($model->getOriginal(), $model->getDirty());
            $dataAfter = $model->getDirty();
        } elseif ($action === 'deleted') {
            $dataBefore = $model->getAttributes();
            $dataAfter = null;
        }

        AuditLog::create([
            'user_id' => $user ? $user->id : null,
            'action' => $action,
            'model' => get_class($model),
            'model_id' => $model->id,
            'data_before' => $dataBefore,
            'data_after' => $dataAfter,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }
}
