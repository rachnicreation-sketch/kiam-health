<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Vue d'Ensemble des Stocks</h1>
        <p class="text-sm text-gray-500 mt-1">Niveaux de stock, mouvements et alertes en temps réel.</p>
      </div>
      <div class="mt-4 sm:mt-0 flex gap-2">
        <button @click="exportCSV" class="px-4 py-2 border border-green-300 text-green-700 rounded-lg text-sm font-bold hover:bg-green-50 transition-all flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Export CSV
        </button>
        <router-link :to="{ name: 'StockMovements' }" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2">
          Mouvements
        </router-link>
        <router-link :to="{ name: 'Inventory' }" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md">
          Inventaire Physique
        </router-link>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/></svg>
        </div>
        <div>
          <div class="text-2xl font-bold text-gray-900">{{ kpis.total_articles ?? '--' }}</div>
          <div class="text-xs text-gray-500 uppercase font-semibold tracking-wider mt-0.5">Total Articles</div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div class="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div>
          <div class="text-2xl font-bold text-gray-900">{{ formatCurrencyShort(kpis.total_value) }}</div>
          <div class="text-xs text-gray-500 uppercase font-semibold tracking-wider mt-0.5">Valeur Stock</div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div class="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <div>
          <div class="text-2xl font-bold text-amber-600">{{ kpis.low_stock ?? '--' }}</div>
          <div class="text-xs text-gray-500 uppercase font-semibold tracking-wider mt-0.5">Stock Faible</div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div class="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
        </div>
        <div>
          <div class="text-2xl font-bold text-red-600">{{ kpis.out_of_stock ?? '--' }}</div>
          <div class="text-xs text-gray-500 uppercase font-semibold tracking-wider mt-0.5">Rupture de Stock</div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Movement Chart -->
      <div class="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Mouvements sur 30 jours</h3>
        <div v-if="chartDataLoaded" class="h-56">
          <Line :data="movementChartData" :options="chartOptions" />
        </div>
        <div v-else class="h-56 flex items-center justify-center text-gray-300">Chargement...</div>
      </div>
      <!-- Top Articles -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Top Articles en Rotation</h3>
        <div v-if="topArticles.length" class="space-y-3">
          <div v-for="(item, i) in topArticles.slice(0, 7)" :key="i" class="flex items-center gap-3">
            <span class="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">{{ i+1 }}</span>
            <div class="flex-1 min-w-0">
              <div class="text-xs font-semibold text-gray-800 truncate">{{ item.label }}</div>
              <div class="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                <div class="bg-blue-500 h-1.5 rounded-full" :style="{ width: ((item.value / topArticles[0]?.value) * 100) + '%' }"></div>
              </div>
            </div>
            <span class="text-xs font-bold text-gray-500 flex-shrink-0">{{ item.value }}</span>
          </div>
        </div>
        <div v-else class="text-sm text-gray-400 italic mt-8 text-center">Aucun mouvement récent.</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-end">
      <div class="space-y-1">
        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recherche</label>
        <input v-model="filters.search" @input="debouncedFetch" type="text" placeholder="SKU, nom produit..." class="block w-52 rounded-lg border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50">
      </div>
      <div class="space-y-1">
        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entrepôt</label>
        <select v-model="filters.warehouse_id" @change="fetchArticles" class="block w-44 rounded-lg border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50">
          <option value="">Tous</option>
          <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.nom }}</option>
        </select>
      </div>
      <div class="space-y-1">
        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Catégorie</label>
        <select v-model="filters.category_id" @change="fetchArticles" class="block w-44 rounded-lg border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50">
          <option value="">Toutes</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.nom }}</option>
        </select>
      </div>
      <div class="space-y-1">
        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Statut Stock</label>
        <select v-model="filters.stock_status" @change="fetchArticles" class="block w-40 rounded-lg border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50">
          <option value="">Tous</option>
          <option value="disponible">✅ Disponible</option>
          <option value="faible">⚠️ Stock Faible</option>
          <option value="rupture">🔴 Rupture</option>
        </select>
      </div>
      <button @click="resetFilters" class="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-700 border border-transparent hover:border-gray-200 rounded-lg transition-all uppercase tracking-wider">Réinitialiser</button>
      <div class="ml-auto text-xs text-gray-400 font-medium self-center">
        {{ articles.total ?? 0 }} article(s)
      </div>
    </div>

    <!-- Articles Table -->
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div v-if="loading" class="p-12 text-center">
        <svg class="animate-spin h-8 w-8 text-blue-500 mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
      </div>
      <div v-else-if="!articles.data?.length" class="p-12 text-center text-gray-400 italic">
        Aucun article trouvé avec ces critères.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-100">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU / Référence</th>
              <th class="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Produit</th>
              <th class="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Catégorie</th>
              <th class="px-6 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Qté Stock</th>
              <th class="px-6 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Min.</th>
              <th class="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valeur</th>
              <th class="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Emplacement</th>
              <th class="px-6 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Statut</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="a in articles.data" :key="a.id" class="hover:bg-gray-50/70 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500">{{ a.reference || 'N/A' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-semibold text-gray-900">{{ a.article }}</div>
                <div class="text-xs text-gray-400">{{ a.marque }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-xs text-gray-600">{{ a.category?.nom || a.categorie || '—' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span class="text-sm font-bold" :class="getQtyClass(a)">{{ a.quantite_stock }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center text-xs text-gray-400">{{ a.stock_minimum ?? 0 }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-700">{{ formatCurrencyShort(a.stock_value) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-xs text-gray-700">{{ a.warehouse?.nom || '—' }}</div>
                <div class="text-xs text-gray-400">{{ a.emplacement?.nom || '' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span :class="getStatusClass(a.stock_status)" class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {{ getStatusLabel(a.stock_status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div v-if="articles.last_page > 1" class="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        <p class="text-xs text-gray-500">Page {{ articles.current_page }} sur {{ articles.last_page }}</p>
        <div class="flex gap-2">
          <button @click="changePage(articles.current_page - 1)" :disabled="articles.current_page <= 1" class="px-3 py-1.5 border rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-gray-50">Préc.</button>
          <button @click="changePage(articles.current_page + 1)" :disabled="articles.current_page >= articles.last_page" class="px-3 py-1.5 border rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-gray-50">Suiv.</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import api from '../../plugins/axios';
import debounce from 'lodash/debounce';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const articles       = ref({ data: [] });
const kpis           = ref({});
const topArticles    = ref([]);
const warehouses     = ref([]);
const categories     = ref([]);
const loading        = ref(false);
const chartDataLoaded = ref(false);
let currentPage      = ref(1);

const movementChartData = ref({ labels: [], datasets: [] });

const filters = reactive({
  search: '', warehouse_id: '', category_id: '', stock_status: ''
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: true, position: 'top' } },
  scales: {
    y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
    x: { grid: { display: false } }
  }
};

const fetchArticles = async () => {
  loading.value = true;
  try {
    const res = await api.get('/stock/overview', {
      params: { ...filters, page: currentPage.value }
    });
    articles.value = res.data;
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
};

const fetchKpis = async () => {
  try {
    const res = await api.get('/stock/kpis', { params: { warehouse_id: filters.warehouse_id } });
    kpis.value = res.data;
  } catch (e) { console.error(e); }
};

const fetchChartData = async () => {
  try {
    const res = await api.get('/stock/chart-data');
    const d = res.data;
    topArticles.value = d.top_articles || [];
    movementChartData.value = {
      labels: d.movement_chart.labels,
      datasets: [
        {
          label: 'Entrées',
          data: d.movement_chart.entries,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.08)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Sorties',
          data: d.movement_chart.exits,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.06)',
          fill: true,
          tension: 0.4,
        }
      ]
    };
    chartDataLoaded.value = true;
  } catch (e) { console.error(e); }
};

const fetchDeps = async () => {
  try {
    const [wRes, cRes] = await Promise.all([api.get('/warehouses'), api.get('/categories')]);
    warehouses.value  = wRes.data.data || [];
    categories.value  = cRes.data.data || [];
  } catch (e) { console.error(e); }
};

const debouncedFetch = debounce(() => { currentPage.value = 1; fetchArticles(); }, 400);

const resetFilters = () => {
  Object.keys(filters).forEach(k => filters[k] = '');
  currentPage.value = 1;
  fetchArticles();
  fetchKpis();
};

const changePage = (page) => {
  currentPage.value = page;
  fetchArticles();
};

const exportCSV = async () => {
  try {
    const res = await api.get('/stock/overview', { params: { ...filters, per_page: 9999 } });
    const rows = res.data.data.map(a => [
      a.reference, a.article, a.marque, a.category?.nom || a.categorie,
      a.quantite_stock, a.stock_minimum, a.warehouse?.nom, a.stock_status
    ]);
    const header = ['Référence', 'Produit', 'Marque', 'Catégorie', 'Qté Stock', 'Stock Min.', 'Entrepôt', 'Statut'];
    const csv = [header, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stock_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  } catch (e) { alert('Erreur lors de l\'export.'); }
};

const formatCurrencyShort = (val) => {
  if (!val && val !== 0) return '—';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(val) + ' FCFA';
};

const getQtyClass = (a) => {
  if (a.stock_status === 'rupture') return 'text-red-600';
  if (a.stock_status === 'faible') return 'text-amber-600';
  return 'text-emerald-600';
};

const getStatusClass = (status) => {
  switch (status) {
    case 'disponible': return 'bg-emerald-100 text-emerald-700';
    case 'faible':     return 'bg-amber-100 text-amber-700';
    case 'rupture':    return 'bg-red-100 text-red-700';
    default:           return 'bg-gray-100 text-gray-500';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'disponible': return '✓ Dispo.';
    case 'faible':     return '⚠ Faible';
    case 'rupture':    return '✕ Rupture';
    default:           return status;
  }
};

onMounted(() => {
  fetchDeps();
  fetchArticles();
  fetchKpis();
  fetchChartData();
});
</script>
