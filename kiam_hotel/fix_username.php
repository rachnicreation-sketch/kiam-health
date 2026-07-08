<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

$user = User::where('email', 'admin@kiam.local')->first();
if ($user) {
    $user->username = 'admin';
    $user->save();
    echo "Updated username for admin@kiam.local to 'admin'\n";
} else {
    echo "User not found\n";
}
