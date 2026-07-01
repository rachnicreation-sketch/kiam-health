<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900">Bons de Commande</h1>
        <p class="text-sm text-gray-500 mt-1">Gérez vos commandes fournisseurs et réceptions.</p>
      </div>
      <div class="flex gap-3">
        <button @click="exportData" class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm">
           <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
           Exporter Excel
        </button>
        <router-link :to="{ name: 'PurchaseOrderCreate' }" class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nouveau Bon
        </router-link>
      </div>
    </div>

    <!-- Advanced Filters & Search -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
      <div class="flex flex-wrap gap-4 items-center">
        <!-- Search -->
        <div class="flex-1 min-w-[300px] relative">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input type="text" v-model="filters.search" @input="debouncedFetch" placeholder="Numéro BC, Nom du fournisseur..." class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm">
        </div>

        <!-- Status Filter -->
        <select v-model="filters.status" @change="fetchOrders" class="rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500">
          <option value="">Tous les statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="valide">Validé</option>
          <option value="en_cours">En Cours</option>
          <option value="recu_partiel">Reçu Partiel</option>
          <option value="recu">Reçu</option>
          <option value="annule">Annulé</option>
        </select>

        <!-- Supplier Filter -->
        <select v-model="filters.supplier_id" @change="fetchOrders" class="rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 max-w-[200px]">
          <option value="">Tous les fournisseurs</option>
          <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.nom }}</option>
        </select>

        <!-- Warehouse Filter -->
        <select v-model="filters.warehouse_id" @change="fetchOrders" class="rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 max-w-[200px]">
          <option value="">Destination: Tous</option>
          <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.nom }}</option>
        </select>

        <button @click="resetFilters" class="text-sm text-gray-500 hover:text-blue-600 font-medium">Réinitialiser</button>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">BC #</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fournisseur</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date Prévue</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Destination</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Montant</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="loading" class="animate-pulse">
              <td colspan="7" class="px-6 py-4 text-center text-gray-400">Chargement des commandes...</td>
            </tr>
            <tr v-else-if="orders.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="mt-2 text-sm font-medium">Aucun bon de commande trouvé.</p>
              </td>
            </tr>
            <tr v-for="order in orders" :key="order.id" class="hover:bg-gray-50 transition-colors group">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                <router-link :to="{ name: 'PurchaseOrderDetail', params: { id: order.id } }" class="group-hover:underline">
                  {{ order.reference }}
                </router-link>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ order.supplier?.nom }}</div>
                <div class="text-[10px] text-gray-500 uppercase">Créé le {{ new Date(order.created_at).toLocaleDateString() }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ order.expected_arrival_date ? new Date(order.expected_arrival_date).toLocaleDateString() : 'À définir' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ order.warehouse?.nom || 'N/A' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                {{ formatCurrency(order.total_amount) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getStatusClass(order.status)" class="px-2.5 py-1 inline-flex text-[10px] leading-5 font-bold rounded-full uppercase tracking-tighter shadow-sm border">
                  {{ formatStatus(order.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <router-link :to="{ name: 'PurchaseOrderDetail', params: { id: order.id } }" class="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md transition-colors">
                  Ouvrir
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="px-6 py-3 flex items-center justify-between border-t border-gray-200 bg-gray-50">
        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white disabled:opacity-50">Précédent</button>
        <div class="text-sm text-gray-500 font-medium">Page {{ currentPage }} sur {{ totalPages }}</div>
        <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white disabled:opacity-50">Suivant</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import api from '../../plugins/axios';
import debounce from 'lodash/debounce';

const orders = ref([]);
const suppliers = ref([]);
const warehouses = ref([]);
const loading = ref(true);

const filters = reactive({
    status: '',
    supplier_id: '',
    warehouse_id: '',
    search: ''
});

const currentPage = ref(1);
const totalPages = ref(1);

const fetchDependencies = async () => {
    try {
        const [supRes, whRes] = await Promise.all([
            api.get('/suppliers'),
            api.get('/warehouses')
        ]);
        suppliers.value = supRes.data.data;
        warehouses.value = whRes.data.data;
    } catch (e) {
        console.error('Meta fetch failed', e);
    }
};

const fetchOrders = async (page = 1) => {
    loading.value = true;
    try {
        const params = { page, ...filters };
        const response = await api.get('/purchase-orders', { params });
        orders.value = response.data.data;
        currentPage.value = response.data.current_page;
        totalPages.value = response.data.last_page;
    } catch (e) {
        console.error('Errors fetching purchase orders', e);
    } finally {
        loading.value = false;
    }
};

const debouncedFetch = debounce(() => fetchOrders(1), 500);

const resetFilters = () => {
    filters.status = '';
    filters.supplier_id = '';
    filters.warehouse_id = '';
    filters.search = '';
    fetchOrders(1);
};

const changePage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        fetchOrders(page);
    }
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(value);
};

const formatStatus = (status) => {
    const map = {
        'brouillon': 'Brouillon',
        'valide': 'Validé',
        'en_cours': 'En Cours',
        'recu_partiel': 'Recu Partiel',
        'recu': 'REÇU',
        'annule': 'Annulé'
    };
    return map[status] || status;
};

const getStatusClass = (status) => {
    switch (status) {
        case 'brouillon': return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'valide': return 'bg-blue-50 text-blue-700 border-blue-100';
        case 'en_cours': return 'bg-orange-50 text-orange-700 border-orange-100';
        case 'recu_partiel': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
        case 'recu': return 'bg-green-100 text-green-800 border-green-200';
        case 'annule': return 'bg-red-50 text-red-700 border-red-100';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const exportData = () => {
    alert('Exportation Excel en cours de préparation...');
};

onMounted(() => {
    fetchDependencies();
    fetchOrders();
});
</script>
