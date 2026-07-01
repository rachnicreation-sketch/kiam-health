<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

/**
 * Trait TenantIsolated
 * 
 * Assure l'isolation automatique des données par tenant.
 * Chaque query est filtrée pour inclure uniquement les données du tenant courant.
 * 
 * Usage : use TenantIsolated; dans le modèle Eloquent
 */
trait TenantIsolated
{
    /**
     * Boot the trait
     */
    protected static function bootTenantIsolated(): void
    {
        /**
         * Ajouter un scope global qui filtre par tenant_id
         */
        static::addGlobalScope('tenant', function (Builder $builder) {
            $tenantId = self::getTenantId();
            
            if ($tenantId) {
                $builder->where(self::getTenantColumn(), $tenantId);
            }
        });

        /**
         * Avant de créer, assigner le tenant_id courant
         */
        static::creating(function (Model $model) {
            $tenantId = self::getTenantId();
            if ($tenantId && !$model->getAttribute(self::getTenantColumn())) {
                $model->setAttribute(self::getTenantColumn(), $tenantId);
            }
        });
    }

    /**
     * Obtenir le tenant ID courant à partir du JWT token
     * 
     * @return string|null
     */
    public static function getTenantId(): ?string
    {
        $request = request();
        
        // Option 1 : Depuis le header Authorization (JWT)
        $authHeader = $request->header('Authorization');
        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            $token = substr($authHeader, 7);
            try {
                $decoded = \Firebase\JWT\JWT::decode(
                    $token,
                    new \Firebase\JWT\Key(config('app.key') ?: 'secret', 'HS256')
                );
                return $decoded->tenant_id ?? null;
            } catch (\Exception $e) {
                // Token invalide
            }
        }

        // Option 2 : Depuis la session utilisateur
        if (auth()->check()) {
            $user = auth()->user();
            if (method_exists($user, 'getTenantId')) {
                return $user->getTenantId();
            }
            return $user->tenant_id ?? $user->clinic_id ?? null;
        }

        // Option 3 : Depuis la requête
        return $request->input('tenant_id') ?? 
               $request->query('tenant_id') ?? 
               $request->header('X-Tenant-ID') ?? null;
    }

    /**
     * Obtenir le nom de la colonne tenant
     * Peut être surchargée dans les modèles si nécessaire
     * 
     * @return string
     */
    public static function getTenantColumn(): string
    {
        return 'tenant_id';
    }

    /**
     * Désactiver temporairement l'isolation (admin SaaS)
     * 
     * @return Builder
     */
    public static function withoutTenantFilter(): Builder
    {
        return static::query()->withoutGlobalScope('tenant');
    }

    /**
     * Vérifier si l'enregistrement appartient au tenant courant
     * 
     * @return bool
     */
    public function belongsToCurrentTenant(): bool
    {
        return $this->{self::getTenantColumn()} === self::getTenantId();
    }

    /**
     * Tracer les accès non autorisés aux données
     * 
     * @param mixed $id
     * @return void
     */
    protected static function logUnauthorizedAccess(mixed $id): void
    {
        $tenantId = self::getTenantId();
        \Log::warning('Tentative d\'accès non autorisé', [
            'model' => static::class,
            'record_id' => $id,
            'current_tenant' => $tenantId,
            'ip' => request()->ip(),
            'user_id' => auth()->id()
        ]);
    }
}
