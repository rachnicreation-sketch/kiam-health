<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Hash;
use App\Models\User;

try {
    $u = User::where('email', 'admin@kiam.local')->first();
    if (!$u) {
        User::create([
            'name'     => 'Super Admin',
            'email'    => 'admin@kiam.local',
            'password' => Hash::make('Admin@1234'),
        ]);
        echo "Created: admin@kiam.local / Admin@1234\n";
    } else {
        $u->update(['password' => Hash::make('Admin@1234')]);
        echo "Updated: admin@kiam.local / Admin@1234\n";
    }
} catch (Exception $e) {
    echo 'ERR: ' . $e->getMessage() . "\n";
}
