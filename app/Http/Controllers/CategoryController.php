<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        return \App\Models\Category::all();
    }

    public function store(\Illuminate\Http\Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|unique:categories',
            'type' => 'required|in:stock,patrimoine',
            'description' => 'nullable|string'
        ]);

        $category = \App\Models\Category::create($data);
        return response()->json($category, 201);
    }

    public function show(\App\Models\Category $category)
    {
        return $category;
    }

    public function update(\Illuminate\Http\Request $request, \App\Models\Category $category)
    {
        $data = $request->validate([
            'name' => 'required|string|unique:categories,name,' . $category->id,
            'type' => 'required|in:stock,patrimoine',
            'description' => 'nullable|string'
        ]);

        $category->update($data);
        return response()->json($category);
    }

    public function destroy(\App\Models\Category $category)
    {
        // Check if category has articles
        if ($category->articles()->exists()) {
            return response()->json(['message' => 'Impossible de supprimer une catégorie liée à des articles.'], 422);
        }
        $category->delete();
        return response()->json(null, 204);
    }
}
