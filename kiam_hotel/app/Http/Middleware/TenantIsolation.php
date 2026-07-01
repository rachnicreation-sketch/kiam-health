<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

/**
 * Middleware TenantIsolation
 * 
 * Applique une isolation stricte par tenant au niveau des routes.
 * - Extrait le tenant_id du JWT
 * - Valide l'accès du user au tenant demandé
 * - Rejette les accès cross-tenant
 * - Enregistre les tentatives suspectes
 */
class TenantIsolation
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Ne pas appliquer sur les routes publiques
        if ($this->isPublicRoute($request)) {
            return $next($request);
        }

        // Extraire le tenant_id du JWT ou de la session
        $tenantId = $this->extractTenantId($request);

        if (!$tenantId) {
            return $this->sendUnauthorized('Tenant ID non trouvé');
        }

        // Vérifier que l'utilisateur a accès à ce tenant
        if (!$this->userHasAccessToTenant($request, $tenantId)) {
            $this->logSecurityEvent('unauthorized_tenant_access', $request, $tenantId);
            return $this->sendForbidden('Accès à ce tenant refusé');
        }

        // Vérifier la tentative d'accès cross-tenant
        if ($this->isCrossTenantAttempt($request, $tenantId)) {
            $this->logSecurityEvent('cross_tenant_attempt', $request, $tenantId);
            return $this->sendForbidden('Accès à des ressources d\'un autre tenant détecté');
        }

        // Stocker le tenant_id dans la requête pour utilisation dans les contrôleurs
        $request->attributes->put('tenant_id', $tenantId);

        // Ajouter le tenant_id aux headers de réponse (pour le debug)
        $response = $next($request);
        $response->headers->set('X-Tenant-ID', $tenantId);

        return $response;
    }

    /**
     * Extraire le tenant ID du JWT ou de la session
     *
     * @param Request $request
     * @return string|null
     */
    protected function extractTenantId(Request $request): ?string
    {
        // Option 1 : JWT Token
        $authHeader = $request->header('Authorization');
        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            $token = substr($authHeader, 7);
            try {
                $decoded = JWT::decode(
                    $token,
                    new Key(config('app.key') ?: 'secret', 'HS256')
                );
                return $decoded->tenant_id ?? null;
            } catch (\Exception $e) {
                \Log::error('Invalid JWT token', ['error' => $e->getMessage()]);
            }
        }

        // Option 2 : Session utilisateur
        if (auth('sanctum')->check()) {
            $user = auth('sanctum')->user();
            return $user->tenant_id ?? $user->clinic_id ?? null;
        }

        // Option 3 : Header personnalisé
        return $request->header('X-Tenant-ID');
    }

    /**
     * Vérifier que l'utilisateur a accès au tenant
     *
     * @param Request $request
     * @param string $tenantId
     * @return bool
     */
    protected function userHasAccessToTenant(Request $request, string $tenantId): bool
    {
        $user = auth('sanctum')->user();

        if (!$user) {
            return false;
        }

        // Les admins SaaS peuvent accéder à tous les tenants
        if ($user->hasRole('saas_admin') || $user->global_role === 'saas_admin') {
            return true;
        }

        // Vérifier que le tenant_id du user correspond
        $userTenantId = $user->tenant_id ?? $user->clinic_id ?? null;

        if ($userTenantId !== $tenantId) {
            return false;
        }

        return true;
    }

    /**
     * Détecter les tentatives d'accès cross-tenant
     *
     * @param Request $request
     * @param string $tenantId
     * @return bool
     */
    protected function isCrossTenantAttempt(Request $request, string $tenantId): bool
    {
        // Vérifier les paramètres de route
        $routeParams = $request->route()->parameters ?? [];

        foreach ($routeParams as $value) {
            if (is_string($value) && strpos($value, $tenantId) === false && strlen($value) > 3) {
                // Potentiel ID d'un autre tenant
                $otherTenantId = $this->checkIfOtherTenant($value);
                if ($otherTenantId) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Vérifier si l'ID appartient à un autre tenant
     *
     * @param string $id
     * @return bool
     */
    protected function checkIfOtherTenant(string $id): bool
    {
        // Implémenter une vérification selon votre structure de BD
        // Exemple : checker les prefixes (PT- pour patients, etc.)
        // ou faire une requête BD pour vérifier le tenant_id de la ressource

        return false;
    }

    /**
     * Vérifier si la route est publique (ne pas filtrer)
     *
     * @param Request $request
     * @return bool
     */
    protected function isPublicRoute(Request $request): bool
    {
        $publicRoutes = [
            'login',
            'register',
            'forgot-password',
            'reset-password',
            'health',
            'status'
        ];

        foreach ($publicRoutes as $route) {
            if ($request->is($route) || $request->is("api/$route")) {
                return true;
            }
        }

        return false;
    }

    /**
     * Enregistrer les événements de sécurité
     *
     * @param string $event
     * @param Request $request
     * @param string $tenantId
     * @return void
     */
    protected function logSecurityEvent(string $event, Request $request, string $tenantId): void
    {
        \Log::warning("Security Event: $event", [
            'tenant_id' => $tenantId,
            'user_id' => auth('sanctum')->id(),
            'ip' => $request->ip(),
            'path' => $request->path(),
            'method' => $request->method(),
            'timestamp' => now()
        ]);
    }

    /**
     * Répondre avec une erreur 401 Unauthorized
     *
     * @param string $message
     * @return Response
     */
    protected function sendUnauthorized(string $message): Response
    {
        return response()->json([
            'status' => 'error',
            'code' => 'UNAUTHORIZED',
            'message' => $message
        ], 401);
    }

    /**
     * Répondre avec une erreur 403 Forbidden
     *
     * @param string $message
     * @return Response
     */
    protected function sendForbidden(string $message): Response
    {
        return response()->json([
            'status' => 'error',
            'code' => 'FORBIDDEN',
            'message' => $message
        ], 403);
    }
}
