<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Informatique', 'type' => 'stock'],
            ['name' => 'Mobilier', 'type' => 'patrimoine'],
            ['name' => 'Immobilier', 'type' => 'patrimoine'],
            ['name' => 'Outillage', 'type' => 'stock'],
            ['name' => 'Consommables', 'type' => 'stock'],
            ['name' => 'Véhicules', 'type' => 'patrimoine'],
        ];

        foreach ($categories as $cat) {
            $category = \App\Models\Category::firstOrCreate(['name' => $cat['name']], $cat);
            
            // Link existing articles with this string category to this ID
            \App\Models\Article::where('categorie', $cat['name'])
                ->whereNull('category_id')
                ->update(['category_id' => $category->id]);
        }
    }
}
