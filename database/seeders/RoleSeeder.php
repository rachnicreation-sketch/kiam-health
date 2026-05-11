<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'Administrateur',
            'Gestionnaire inventaire',
            'Responsable entrepôt',
            'Responsable magasin',
            'Agent utilisateur',
            'Auditeur / lecteur'
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }
    }
}
