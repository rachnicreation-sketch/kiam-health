<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ArticleController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\AlertController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\StockKpiController;
use App\Http\Controllers\ReportController;

Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::get('/articles/export', [ArticleController::class, 'export']);

Route::middleware(['auth:sanctum'])->group(function () {
    // Reports & Exports
    Route::get('/reports/patrimoine-pdf', [ReportController::class, 'exportPatrimoinePDF']);
    Route::get('/reports/mouvements-pdf', [ReportController::class, 'exportMouvementsPDF']);
    Route::get('/reports/inventory-pdf/{id}', [ReportController::class, 'exportInventoryPDF']);

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/dashboard/kpis', [DashboardController::class, 'getKpis']);
    Route::get('/dashboard/charts', [DashboardController::class, 'getChartData']);
    Route::get('/dashboard/reporting', [DashboardController::class, 'getReportingData']);

    // Stock Module
    Route::get('/stock/overview', [ArticleController::class, 'stockOverview']);
    Route::get('/stock/kpis', [StockKpiController::class, 'kpis']);
    Route::get('/stock/chart-data', [StockKpiController::class, 'chartData']);

    Route::apiResource('articles', ArticleController::class);
    Route::apiResource('stock-movements', StockMovementController::class);
    Route::apiResource('inventories', InventoryController::class);
    Route::post('/inventories/{inventory}/validate', [InventoryController::class, 'validateSession']);
    Route::put('/inventory-lines/{line}', [InventoryController::class, 'updateLine']);
    Route::apiResource('suppliers', SupplierController::class);
    Route::apiResource('warehouses', WarehouseController::class);
    Route::get('/warehouses/{warehouse}/emplacements', [WarehouseController::class, 'allEmplacements']);
    Route::apiResource('categories', CategoryController::class);
    Route::get('/alerts/unread-count', [AlertController::class, 'unreadCount']);
    Route::post('/alerts/mark-all-read', [AlertController::class, 'markAllAsRead']);
    Route::apiResource('alerts', AlertController::class);

    Route::apiResource('purchase-orders', PurchaseOrderController::class);
    Route::patch('/purchase-orders/{purchaseOrder}/status', [PurchaseOrderController::class, 'updateStatus']);
    Route::post('/purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive']);
    Route::get('/purchase-orders/{purchaseOrder}/pdf', [PurchaseOrderController::class, 'exportPDF']);
    Route::get('/purchase-orders/{purchaseOrder}/history', [PurchaseOrderController::class, 'getHistory']);
});
