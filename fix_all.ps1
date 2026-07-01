$tenants = @("kiam_health", "kiam_hopital", "kiam_ecole", "kiam_erp", "kiam_ges", "kiam_hotel", "kiam_caisse", "kiam_saas")
$phpPath = "C:\wamp64\bin\php\php8.2.18\php.exe"

foreach ($tenant in $tenants) {
    $tenantDir = "C:\wamp64\www\kiam\$tenant"
    if (-Not (Test-Path $tenantDir)) { continue }

    Write-Host "=== Fixing $tenant ==="

    # ─── 1. Fix vite.config.ts base path ───────────────────────────────────
    $viteConfig = "$tenantDir\vite.config.ts"
    if (Test-Path $viteConfig) {
        $content = Get-Content $viteConfig -Raw
        # Replace base: '/kiam/dist/' with tenant-specific path
        $content = $content -replace "base:\s*'[^']*'", "base: '/$tenant/dist/'"
        Set-Content $viteConfig $content
        Write-Host "  [1] vite.config.ts base fixed => /$tenant/dist/"
    }

    # ─── 2. Rebuild frontend with correct base path ─────────────────────────
    Write-Host "  [2] Rebuilding frontend..."
    Set-Location $tenantDir
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [2] Build OK"
    } else {
        Write-Host "  [2] Build FAILED: $buildResult"
    }

    # ─── 3. Copy dist/ into public/dist/ for WAMP to serve ──────────────────
    $distSrc = "$tenantDir\dist"
    $distDest = "$tenantDir\public\dist"
    if (Test-Path $distDest) {
        Remove-Item -Recurse -Force $distDest
    }
    if (Test-Path $distSrc) {
        Copy-Item -Recurse $distSrc $distDest
        Write-Host "  [3] dist/ copied to public/dist/"
    }

    # ─── 4. Create admin user in each database ───────────────────────────────
    Write-Host "  [4] Creating admin user..."
    $createAdmin = @"
<?php
require __DIR__ . '/vendor/autoload.php';
`$app = require __DIR__ . '/bootstrap/app.php';
`$kernel = `$app->make(Illuminate\Contracts\Console\Kernel::class);
`$kernel->bootstrap();

use Illuminate\Support\Facades\Hash;
use App\Models\User;

try {
    \$user = User::where('email', 'admin@$tenant.local')->first();
    if (!\$user) {
        User::create([
            'name'     => 'Super Admin',
            'email'    => 'admin@$tenant.local',
            'password' => Hash::make('admin123'),
        ]);
        echo "Admin created: admin@$tenant.local / admin123\n";
    } else {
        echo "Admin already exists: admin@$tenant.local\n";
    }
} catch (Exception \$e) {
    echo "Error: " . \$e->getMessage() . "\n";
}
EOF
"@
    # Use artisan tinker with a temp file approach instead
    $tmpFile = "$tenantDir\create_admin_tmp.php"
    @"
<?php
require __DIR__ . '/vendor/autoload.php';
`$app = require_once __DIR__ . '/bootstrap/app.php';
`$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\Hash;
use App\Models\User;
try {
    \`$u = User::where('email', 'admin@kiam.local')->first();
    if (!\`$u) {
        User::create(['name'=>'Super Admin','email'=>'admin@kiam.local','password'=>Hash::make('Admin@1234')]);
        echo "Created: admin@kiam.local / Admin@1234\n";
    } else {
        \`$u->update(['password' => Hash::make('Admin@1234')]);
        echo "Updated: admin@kiam.local / Admin@1234\n";
    }
} catch(Exception \`$e) { echo 'ERR: '.\`$e->getMessage()."\n"; }
"@ | Set-Content $tmpFile

    & $phpPath $tmpFile 2>&1 | Write-Host
    Remove-Item $tmpFile -ErrorAction SilentlyContinue

    Write-Host "  $tenant done!"
    Write-Host ""
}

Write-Host "All tenants fully ready!"
