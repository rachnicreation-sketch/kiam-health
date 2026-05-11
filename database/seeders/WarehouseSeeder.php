<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Warehouse;

class WarehouseSeeder extends Seeder
{
    public function run(): void
    {
        $warehouse = Warehouse::create([
            'nom' => 'Entrepôt Central NESOP',
            'code' => 'ENT-001',
            'type' => 'entrepot',
            'adresse' => 'Kinshasa, Gombe',
            'responsable' => 'Responsable Logistique',
        ]);

        $zone = $warehouse->zones()->create([
            'nom' => 'Zone de Stockage Informatique',
            'code' => 'Z-INF',
        ]);

        $allee = $zone->allees()->create(['nom' => 'Allée A', 'code' => 'AL-A']);
        $rayonnage = $allee->rayonnages()->create(['nom' => 'Rayon 1', 'code' => 'R-1']);
        
        $rayonnage->emplacements()->createMany([
            ['nom' => 'Emplacement 1A', 'code' => 'EMP-1A'],
            ['nom' => 'Emplacement 1B', 'code' => 'EMP-1B'],
        ]);
    }
}
