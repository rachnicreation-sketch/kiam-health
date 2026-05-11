<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Control Center <span class="text-kiam-600">KIAM</span></h1>
        <p class="text-sm text-gray-500 mt-1">Supervision en temps réel — {{ currentDateTime }}</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Warehouse Filter -->
        <div class="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
          <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <select v-model="selectedWarehouse" @change="fetchDashboardData" class="text-xs font-bold uppercase tracking-tight text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer">
            <option value="">Tous les Entrepôts</option>
            <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.nom }}</option>
          </select>
        </div>

        <!-- Type Filter -->
        <div class="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
          <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <select v-model="selectedType" @change="fetchDashboardData" class="text-xs font-bold uppercase tracking-tight text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer">
            <option value="all">Tout le Patrimoine</option>
            <option value="stocks">Stocks Uniquement</option>
            <option value="assets">Biens Uniquement</option>
          </select>
        </div>

        <span class="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span class="w-2 h-2 mr-1.5 rounded-full bg-green-500 animate-pulse"></span>
          LIVE
        </span>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
      <!-- Corporate Assets (Fixed) -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between group hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div class="h-12 w-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div class="text-right">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valeur des Biens</span>
            <h2 class="text-xl font-bold text-gray-900">{{ loading ? '...' : formatCurrency(kpis.valeur_biens) }}</h2>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-50 text-[9px] font-bold uppercase text-gray-400">
           IMMOBILIER & MOBILIER
        </div>
      </div>

      <!-- Inventory Stocks (Liquid) -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between group hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div class="h-12 w-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
             <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
             </svg>
          </div>
          <div class="text-right">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valeur des Stocks</span>
            <h2 class="text-xl font-bold text-indigo-600">{{ loading ? '...' : formatCurrency(kpis.valeur_stock) }}</h2>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-50 flex justify-between text-[9px] font-bold text-gray-400 uppercase">
           <span>Articles Entrepôt</span>
           <span class="text-indigo-600">{{ kpis.total_articles }} UNITS</span>
        </div>
      </div>

      <!-- Critical Stock Alerts -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between group hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div class="h-12 w-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
             <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
          </div>
          <div class="text-right">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ruptures Critique</span>
            <h2 class="text-2xl font-bold text-red-600">{{ loading ? '...' : kpis.articles_rupture }}</h2>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-50">
           <router-link :to="{ name: 'Alerts', query: { type: 'stock_rupture' } }" class="text-[10px] font-bold text-red-600 hover:text-red-800 transition-colors uppercase tracking-widest">
             Intervention Requise &rarr;
           </router-link>
        </div>
      </div>

      <!-- Global Occupancy -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between group hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div class="h-12 w-12 rounded-lg bg-kiam-50 text-kiam-600 flex items-center justify-center group-hover:bg-kiam-600 group-hover:text-white transition-colors">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div class="text-right">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Taux d'Occupation</span>
            <h2 class="text-2xl font-bold text-gray-900">{{ loading ? '...' : kpis.occupancy_rate }}%</h2>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2">
           <span :class="kpis.occupancy_rate > 90 ? 'text-red-500' : 'text-kiam-500'" class="text-[10px] font-bold uppercase tracking-tight">
             {{ kpis.occupancy_rate > 90 ? 'Saturation Critique' : 'Volume Optimisé' }}
           </span>
        </div>
      </div>

      <!-- Pro Efficiency Card (Visual Wow) -->
      <div class="bg-gradient-to-br from-blue-900 to-kiam-900 rounded-xl shadow-lg p-6 flex flex-col justify-between text-white relative overflow-hidden group">
        <div class="relative z-10 text-left">
          <div class="flex justify-between items-start">
            <span class="text-[10px] font-bold uppercase tracking-widest text-blue-200">Efficacité Flux</span>
            <div class="flex gap-0.5">
               <div class="w-1 h-3 bg-blue-300 rounded-full"></div>
               <div class="w-1 h-3 bg-blue-300 rounded-full"></div>
                <div class="w-1 h-3 rounded-full" :class="kpis.occupancy_rate > 50 ? 'bg-blue-300' : 'bg-blue-300/30'"></div>
            </div>
          </div>
          <div class="mt-4">
            <h2 class="text-3xl font-extrabold tracking-tighter">{{ loading ? '...' : (kpis.articles_rupture > 5 ? '75%' : '98%') }}</h2>
            <p class="text-[11px] text-blue-100 font-bold uppercase mt-1">{{ kpis.articles_rupture > 5 ? 'Flux à Optimiser' : 'Fluide & Performant' }}</p>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-white/10 relative z-10 text-left">
           <div class="flex justify-between items-center text-[10px] font-bold italic opacity-80">
              <span>Optimisation Rails</span>
              <span>{{ kpis.articles_rupture > 0 ? 'ALERT' : 'LIVE' }}</span>
           </div>
        </div>
        <!-- Decorative background icon -->
        <svg class="absolute -right-6 -bottom-6 w-32 h-32 text-white opacity-5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      </div>
    </div>

    <!-- Charts & Intelligence Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Movement Trends (Primary Chart) -->
      <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-6">
           <div>
              <h3 class="text-lg font-bold text-gray-800 uppercase tracking-tighter">Flux de Stock (6 Mois)</h3>
              <p class="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Entrées vs Sorties Mensuelles</p>
           </div>
           <div class="flex gap-4">
              <div class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-blue-500"></span> <span class="text-[10px] font-bold text-gray-500 uppercase">Entrées</span></div>
              <div class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-red-400"></span> <span class="text-[10px] font-bold text-gray-500 uppercase">Sorties</span></div>
           </div>
        </div>
        <div class="h-72 relative">
           <canvas id="trendChart"></canvas>
        </div>
      </div>

      <!-- Domain Distribution -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
         <h3 class="text-lg font-bold text-gray-800 uppercase tracking-tighter mb-6">Par Domaine</h3>
         <div class="h-72 relative">
            <canvas id="domainChart"></canvas>
         </div>
      </div>
    </div>

    <!-- Recent Activity & Warehouse Intelligence -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-6 border-b border-gray-50 flex justify-between items-center">
          <h3 class="text-lg font-bold text-gray-800 uppercase tracking-tighter">Activités Récentes</h3>
          <router-link :to="{ name: 'StockMovements' }" class="text-[10px] font-bold text-kiam-600 hover:text-kiam-700 uppercase tracking-widest">Tout voir</router-link>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th class="px-6 py-4">Article</th>
                <th class="px-6 py-4">Mouvement</th>
                <th class="px-6 py-4 text-right">Volume</th>
                <th class="px-6 py-4">Horodatage</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-if="!loading && recentMovements.length === 0">
                <td colspan="4" class="px-6 py-12 text-center text-gray-400 italic text-sm font-medium">Aucun mouvement récent détecté.</td>
              </tr>
              <tr v-for="m in recentMovements" :key="m.id" class="hover:bg-gray-50 transition-colors text-sm group">
                <td class="px-6 py-4">
                  <div class="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{{ m.article?.article }}</div>
                  <div class="text-[10px] text-gray-400 font-mono">{{ m.article?.reference }}</div>
                </td>
                <td class="px-6 py-4">
                  <span :class="m.type === 'entree' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter">
                    {{ m.type === 'entree' ? 'Réception' : 'Sortie' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right font-mono font-bold" :class="m.type === 'entree' ? 'text-green-600' : 'text-red-600'">
                  {{ m.type === 'entree' ? '+' : '-' }}{{ m.quantite }}
                </td>
                <td class="px-6 py-4">
                   <div class="text-[11px] text-gray-500 font-bold uppercase">{{ formatDate(m.created_at) }}</div>
                   <div class="text-[9px] text-gray-400">{{ formatTime(m.created_at) }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
         <h3 class="text-sm font-bold text-gray-800 mb-4 uppercase tracking-tighter">Occupation par Entrepôt (%)</h3>
         <div class="h-56 relative">
            <canvas id="warehouseChart"></canvas>
         </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import api from '../plugins/axios';
import Chart from 'chart.js/auto';

const loading = ref(true);
const kpis = ref({
    total_articles: 0,
    valeur_biens: 0,
    valeur_stock: 0,
    articles_rupture: 0,
    occupancy_rate: 0
});
const dashboardAlerts = ref([]);
const recentMovements = ref([]);
const warehouses = ref([]);
const selectedWarehouse = ref('');
const selectedType = ref('all');

// Cache charts to destroy them before re-rendering
const charts = {
    trend: null,
    domain: null,
    warehouse: null
};

const fetchDashboardData = async () => {
    loading.value = true;
    try {
        const params = {
            warehouse_id: selectedWarehouse.value,
            type: selectedType.value
        };

        const [kpiRes, chartRes, alertRes] = await Promise.all([
            api.get('/dashboard/kpis', { params }),
            api.get('/dashboard/charts', { params }),
            api.get('/alerts', { params: { statut: '0', limit: 8 } }),
        ]);

        kpis.value = kpiRes.data;
        recentMovements.value = chartRes.data.recent_movements;
        dashboardAlerts.value = alertRes.data.data;
        
        await nextTick();
        renderCharts(chartRes.data);
    } catch (e) {
        console.error('Failed to fetch dashboard data', e);
    } finally {
        loading.value = false;
    }
};

const fetchWarehouses = async () => {
    try {
        const res = await api.get('/warehouses');
        warehouses.value = res.data.data || res.data;
    } catch (e) {
        console.error('Failed to fetch warehouses', e);
    }
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(value || 0);
};

const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
const formatTime = (date) => new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const formatRelativeDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 60) return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff/60)}h`;
    return d.toLocaleDateString('fr-FR');
};

onMounted(async () => {
    await Promise.all([
        fetchWarehouses(),
        fetchDashboardData()
    ]);
});

const renderCharts = (data) => {
    const ctxTrend = document.getElementById('trendChart');
    if (ctxTrend && data.movements_trend) {
        if (charts.trend) charts.trend.destroy();
        charts.trend = new Chart(ctxTrend, {
            type: 'bar',
            data: {
                labels: data.movements_trend.labels,
                datasets: [
                    {
                        label: 'Entrées',
                        data: data.movements_trend.in,
                        backgroundColor: '#3b82f6',
                        borderRadius: 4
                    },
                    {
                        label: 'Sorties',
                        data: data.movements_trend.out,
                        backgroundColor: '#f87171',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { borderDash: [2, 4], drawBorder: false } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    const ctxDomain = document.getElementById('domainChart');
    if (ctxDomain && data.inventory_by_domain) {
        if (charts.domain) charts.domain.destroy();
        charts.domain = new Chart(ctxDomain, {
            type: 'doughnut',
            data: {
                labels: data.inventory_by_domain.labels.length ? data.inventory_by_domain.labels : ['Aucun'],
                datasets: [{
                    data: data.inventory_by_domain.data.length ? data.inventory_by_domain.data : [100],
                    backgroundColor: ['#0f172a', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#e2e8f0'],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 9, weight: 'bold' }, padding: 15, usePointStyle: true } }
                },
                cutout: '70%',
                spacing: 2
            }
        });
    }

    const ctxWarehouse = document.getElementById('warehouseChart');
    if (ctxWarehouse && data.occupancy_by_warehouse) {
        if (charts.warehouse) charts.warehouse.destroy();
        charts.warehouse = new Chart(ctxWarehouse, {
            type: 'bar',
            data: {
                labels: data.occupancy_by_warehouse.labels,
                datasets: [{
                    label: 'Occupation %',
                    data: data.occupancy_by_warehouse.data,
                    backgroundColor: '#10b981',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, max: 100, grid: { borderDash: [2, 4], drawBorder: false } },
                    y: { grid: { display: false } }
                }
            }
        });
    }
};
</script>
