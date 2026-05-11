import { createRouter, createWebHistory } from 'vue-router';

const routes = [
    {
        path: '/',
        name: 'Home',
        redirect: '/login',
        meta: { guest: true }
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/auth/LoginView.vue'),
        meta: { guest: true }
    },
    {
        path: '/dashboard',
        component: () => import('../components/layouts/AppLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Dashboard',
                component: () => import('../views/DashboardView.vue'),
            },
            {
                path: 'articles',
                name: 'Articles',
                component: () => import('../views/articles/ArticleListView.vue'),
            },
            {
                path: 'categories',
                name: 'Categories',
                component: () => import('../views/categories/CategoryListView.vue'),
            },
            {
                path: 'articles/:id',
                name: 'ArticleDetail',
                component: () => import('../views/articles/ArticleDetailView.vue'),
            },
            {
                path: 'alerts',
                name: 'Alerts',
                component: () => import('../views/alerts/AlertListView.vue'),
            },
            {
                path: 'stock',
                name: 'StockMovements',
                component: () => import('../views/stock/StockMovementListView.vue'),
            },
            {
                path: 'stock/overview',
                name: 'StockOverview',
                component: () => import('../views/stock/StockOverviewView.vue'),
            },
            {
                path: 'inventory',
                name: 'Inventory',
                component: () => import('../views/inventory/InventoryListView.vue'),
            },
            {
                path: 'inventory/:id',
                name: 'InventoryDetail',
                component: () => import('../views/inventory/InventoryDetailView.vue'),
            },
            {
                path: 'warehouses',
                name: 'Warehouses',
                component: () => import('../views/warehouses/WarehouseListView.vue'),
            },
            {
                path: 'warehouses/map',
                name: 'WarehouseHierarchy',
                component: () => import('../views/warehouses/WarehouseHierarchyView.vue'),
            },
            {
                path: 'purchase-orders',
                name: 'PurchaseOrders',
                component: () => import('../views/purchase-orders/PurchaseOrderListView.vue'),
            },
            {
                path: 'purchase-orders/create',
                name: 'PurchaseOrderCreate',
                component: () => import('../views/purchase-orders/PurchaseOrderFormView.vue'),
            },
            {
                path: 'purchase-orders/:id',
                name: 'PurchaseOrderDetail',
                component: () => import('../views/purchase-orders/PurchaseOrderDetailView.vue'),
            },
            {
                path: 'purchase-orders/:id/edit',
                name: 'PurchaseOrderEdit',
                component: () => import('../views/purchase-orders/PurchaseOrderFormView.vue'),
            },
            {
                path: 'purchase-orders/:id/receipt',
                name: 'PurchaseOrderReceipt',
                component: () => import('../views/purchase-orders/PurchaseOrderReceiptView.vue'),
            },
            {
                path: 'suppliers',
                name: 'Suppliers',
                component: () => import('../views/suppliers/SupplierListView.vue'),
            },
            {
                path: 'reports',
                name: 'Reports',
                component: () => import('../views/reports/ReportingView.vue'),
            },
        ]
    }
];

const router = createRouter({
    history: createWebHistory('/kiam/public/'),
    routes,
});

// Navigation Guards
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('kiam_token');
    
    if (to.meta.requiresAuth && !token) {
        next({ name: 'Login' });
    } else if (to.name === 'Login' && token) {
        next({ name: 'Dashboard' });
    } else {
        next();
    }
});

export default router;
