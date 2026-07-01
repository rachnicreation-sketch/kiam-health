<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@matiaba.local'],
            [
                'name' => 'Admin MATIABA Firm',
                'password' => Hash::make('Admin2026@KIAM!'),
                'email_verified_at' => now(),
            ]
        );

        $role = Role::where('name', 'Administrateur')->first();
        if ($role) {
            $admin->assignRole($role);
        }
    }
}
