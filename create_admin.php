<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Hash;
use App\Models\User;

$adminEmail = 'admin@kiam.local';
$adminPassword = 'KiamAdmin@2026!';

try {
    $u = User::where('username', 'admin')->first();
    if (!$u) {
        User::create([
            'name'     => 'Super Admin',
            'username' => 'admin',
            'email'    => $adminEmail,
            'password' => Hash::make($adminPassword),
        ]);
        echo "Created: admin / $adminPassword\n";
    } else {
        $u->update(['password' => Hash::make($adminPassword)]);
        echo "Updated: admin / $adminPassword\n";
    }
} catch (Exception $e) {
    echo 'ERR: ' . $e->getMessage() . "\n";
}
