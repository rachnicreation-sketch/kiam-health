<template>
  <div v-if="loading" class="flex justify-center items-center h-64">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
  <div v-else-if="error" class="bg-red-50 p-6 rounded-xl border border-red-100 text-center mx-auto max-w-2xl mt-10">
    <svg class="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
    <p class="text-red-700 font-medium">{{ error }}</p>
    <button @click="fetchOrder" class="mt-4 text-sm text-red-600 font-bold hover:underline">Réessayer</button>
  </div>
  <div v-else class="space-y-6 max-w-6xl mx-auto pb-10">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div class="flex items-center gap-4">
        <router-link :to="{ name: 'PurchaseOrderList' }" class="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </router-link>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-extrabold text-gray-900 tracking-tight">{{ order.reference }}</h1>
            <span :class="getStatusClass(order.status)" class="px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest border">
              {{ formatStatus(order.status) }}
            </span>
          </div>
          <p class="text-sm text-gray-500 mt-1">Émis par <span class="font-medium text-gray-700">{{ order.user?.name }}</span> le {{ formatDate(order.created_at) }}</p>
        </div>
      </div>
      
      <div class="flex flex-wrap gap-2 w-full md:w-auto">
        <button @click="exportPDF" class="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 text-sm transition-colors shadow-sm">
          <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          Générer PDF
        </button>

        <template v-if="order.status === 'brouillon'">
          <router-link :to="{ name: 'PurchaseOrderEdit', params: { id: order.id } }" class="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 text-sm transition-colors">
            Modifier
          </router-link>
          <button @click="updateStatus('valide')" class="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 text-sm transition-colors shadow-md">
            Valider la commande
          </button>
        </template>

        <template v-if="order.status === 'valide'">
          <button @click="updateStatus('en_cours')" class="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 text-sm transition-colors shadow-md">
            Expédier / En cours
          </button>
        </template>

        <template v-if="['valide', 'en_cours', 'recu_partiel'].includes(order.status)">
          <router-link :to="{ name: 'PurchaseOrderReceipt', params: { id: order.id } }" class="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 text-sm transition-colors shadow-md">
            Enregistrer Réception
          </router-link>
        </template>

        <button v-if="['brouillon', 'valide'].includes(order.status)" @click="updateStatus('annule')" class="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 text-red-600 hover:bg-red-50 text-sm font-bold rounded-lg transition-colors border border-transparent hover:border-red-100">
          Annuler
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Main Info -->
      <div class="lg:col-span-3 space-y-6">
        <!-- Details Card -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 class="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                <svg class="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Articles commandés
            </h2>
            <span class="text-xs font-bold px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">{{ order.items?.length }} ligne(s)</span>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-white">
                <tr>
                  <th class="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Désignation / Article</th>
                  <th class="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Qte Commandée</th>
                  <th class="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Qte Reçue</th>
                  <th class="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">P.U (FCFA)</th>
                  <th class="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="item in order.items" :key="item.id" class="hover:bg-gray-50/50 transition-colors group">
                  <td class="px-6 py-4">
                    <div class="text-sm font-bold text-gray-900">{{ item.article?.article }}</div>
                    <div class="text-[10px] text-gray-500 font-mono uppercase">REF: {{ item.article?.reference }}</div>
                    <div v-if="item.batch_number" class="mt-1.5 flex flex-wrap gap-1.5">
                        <span class="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md border border-blue-100 font-bold uppercase tracking-tighter">LOT: {{ item.batch_number }}</span>
                        <span v-if="item.expiry_date" class="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded-md border border-red-100 font-bold uppercase tracking-tighter">EXP: {{ formatDate(item.expiry_date) }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center text-sm font-bold text-gray-700">
                    {{ item.quantity }}
                  </td>
                  <td class="px-6 py-4 text-center">
                    <div class="flex flex-col items-center">
                        <div class="flex items-center gap-1.5">
                             <span :class="getReceiptStatusClass(item)" class="text-sm font-extrabold">
                                {{ item.received_quantity }}
                            </span>
                            <svg v-if="item.received_quantity >= item.quantity" class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                        </div>
                        <div v-if="item.quantity > item.received_quantity && item.received_quantity > 0" class="w-20 h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden border border-gray-100">
                            <div class="h-full bg-blue-500 transition-all duration-500" :style="{ width: (item.received_quantity/item.quantity*100) + '%' }"></div>
                        </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right text-sm text-gray-500 font-medium">
                    {{ formatCurrencyShort(item.unit_price) }}
                  </td>
                  <td class="px-6 py-4 text-right text-sm font-extrabold text-gray-900 tracking-tight">
                    {{ formatCurrency(item.total_price) }}
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50/50">
                <tr>
                  <td colspan="4" class="px-6 py-6 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Montant Total HT</td>
                  <td class="px-6 py-6 text-right text-2xl font-black text-blue-700 tracking-tighter">{{ formatCurrency(order.total_amount) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- History/Tabs -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="flex border-b border-gray-100 bg-gray-50/30">
                <button @click="activeTab = 'history'" :class="activeTab === 'history' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'" class="px-6 py-4 text-xs font-bold border-b-2 transition-all uppercase tracking-widest">Historique des actions</button>
                <button @click="activeTab = 'notes'" :class="activeTab === 'notes' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'" class="px-6 py-4 text-xs font-bold border-b-2 transition-all uppercase tracking-widest">Notes & Observations</button>
            </div>
            <div class="p-6">
                <!-- History Timeline -->
                <div v-if="activeTab === 'history'" class="flow-root">
                    <ul role="list" class="-mb-8">
                        <li v-for="(log, idx) in history" :key="log.id">
                            <div class="relative pb-8">
                                <span v-if="idx !== history.length - 1" class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-100" aria-hidden="true"></span>
                                <div class="relative flex space-x-3">
                                    <div>
                                        <span :class="getLogIconClass(log.action)" class="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white shadow-sm transition-transform hover:scale-110">
                                            <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path v-if="log.action === 'created'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                                <path v-else-if="log.action === 'updated'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </span>
                                    </div>
                                    <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                        <div>
                                            <p class="text-sm text-gray-600">
                                                <span class="font-bold text-gray-800">{{ formatLogAction(log) }}</span> par <span class="font-medium text-blue-600">{{ log.user?.name || 'Système' }}</span>
                                            </p>
                                        </div>
                                        <div class="whitespace-nowrap text-right text-[10px] font-bold text-gray-400 uppercase">
                                            <time :datetime="log.created_at">{{ formatDateRelative(log.created_at) }}</time>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
                <!-- Notes Content -->
                <div v-else-if="activeTab === 'notes'">
                    <div v-if="order.notes" class="bg-amber-50 rounded-lg p-5 border-l-4 border-amber-400">
                        <p class="text-sm text-amber-800 leading-relaxed italic">"{{ order.notes }}"</p>
                    </div>
                    <div v-else class="text-center py-10">
                        <svg class="w-12 h-12 text-gray-100 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" /></svg>
                        <p class="text-sm text-gray-400">Aucune note particulière pour cette commande.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Supplier Brief Card -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5">Informations Fournisseur</h3>
            <div class="flex items-start gap-4 mb-6">
                <div class="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-100">
                    {{ order.supplier?.nom?.charAt(0) }}
                </div>
                <div class="min-w-0">
                    <div class="text-base font-black text-gray-900 truncate">{{ order.supplier?.nom }}</div>
                    <div class="flex items-center gap-1 mt-1">
                        <span class="w-2 h-2 rounded-full bg-green-500"></span>
                        <span class="text-[10px] text-gray-400 font-bold uppercase">Fournisseur Actif</span>
                    </div>
                </div>
            </div>
            <div class="space-y-4 pt-4 border-t border-gray-50">
                <div class="flex items-center gap-3">
                    <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <span class="text-xs text-gray-600 truncate">{{ order.supplier?.email || 'N/A' }}</span>
                </div>
                <div class="flex items-center gap-3">
                    <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    <span class="text-xs text-gray-600">{{ order.supplier?.telephone || 'N/A' }}</span>
                </div>
            </div>
        </div>

        <!-- Logistics & Shipping Card -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logistique & Destination</h3>
            
            <div class="space-y-5">
                <!-- Warehouse -->
                <div class="flex items-start gap-4">
                    <div class="h-10 w-10 flex-shrink-0 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <div>
                        <div class="text-[10px] text-gray-400 uppercase font-black tracking-tight mb-0.5">Entrepôt de livraison</div>
                        <div class="text-sm font-extrabold text-gray-800 leading-tight">{{ order.warehouse?.nom || 'Non spécifié' }}</div>
                        <div v-if="order.warehouse?.adresse" class="text-[10px] text-gray-500 mt-1 italic">{{ order.warehouse.adresse }}</div>
                    </div>
                </div>

                <!-- Arrival Date -->
                <div class="flex items-start gap-4">
                    <div class="h-10 w-10 flex-shrink-0 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                        <div class="text-[10px] text-gray-400 uppercase font-black tracking-tight mb-0.5">Réception attendue</div>
                        <div class="text-sm font-extrabold text-gray-800 leading-tight">
                            {{ order.expected_arrival_date ? formatDate(order.expected_arrival_date) : 'Non planifiée' }}
                        </div>
                    </div>
                </div>

                <!-- Logistics Status (Conditional) -->
                <div v-if="order.carrier || order.status === 'en_cours'" class="pt-5 border-t border-gray-50">
                    <div class="flex items-start gap-4">
                        <div class="h-10 w-10 flex-shrink-0 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
                        </div>
                        <div class="min-w-0">
                            <div class="text-[10px] text-gray-400 uppercase font-black tracking-tight mb-0.5">Expédition</div>
                            <div class="text-sm font-extrabold text-gray-800 truncate">{{ order.carrier || 'Transporteur en attente' }}</div>
                            <div class="text-[10px] text-blue-600 font-black font-mono mt-1 break-all">{{ order.tracking_number || 'A renseigner' }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '../../plugins/axios';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const route = useRoute();
const order = ref({});
const history = ref([]);
const loading = ref(true);
const error = ref(null);
const activeTab = ref('history');

const fetchOrder = async () => {
    loading.value = true;
    error.value = null;
    try {
        const response = await api.get(`/purchase-orders/${route.params.id}`);
        order.value = response.data;
        fetchHistory();
    } catch (e) {
        error.value = "Impossible de charger les détails de la commande.";
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const fetchHistory = async () => {
    try {
        const response = await api.get(`/purchase-orders/${route.params.id}/history`);
        history.value = response.data;
    } catch (e) {
        console.warn('Could not fetch history', e);
    }
};

const updateStatus = async (status) => {
    const labels = {
        'valide': 'Valider cette commande ?',
        'en_cours': 'Marquer comme étant en cours d\'expédition ?',
        'annule': 'Voulez-vous vraiment annuler cette commande ?'
    };
    
    if (!confirm(labels[status] || `Passer au statut ${status} ?`)) return;
    
    try {
        await api.patch(`/purchase-orders/${order.value.id}/status`, { status });
        fetchOrder();
    } catch (e) {
        alert(e.response?.data?.message || "Erreur lors de la mise à jour du statut.");
    }
};

const exportPDF = async () => {
    try {
        const response = await api.get(`/purchase-orders/${order.value.id}/pdf`, {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `BC-${order.value.reference}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (e) {
        console.error("Erreur PDF:", e);
        alert("Erreur lors de la génération du PDF.");
    }
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(value);
};

const formatCurrencyShort = (value) => {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);
};

const formatDate = (dateString) => {
    if(!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatDateRelative = (dateString) => {
    if(!dateString) return '...';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
};

const formatStatus = (status) => {
    const map = {
        'brouillon': 'Brouillon',
        'valide': 'Validée',
        'en_cours': 'En Expédition',
        'recu_partiel': 'Recue Partielle',
        'recu': 'REÇUE',
        'annule': 'Annulée'
    };
    return map[status] || status;
};

const getStatusClass = (status) => {
    switch (status) {
        case 'brouillon': return 'bg-gray-50 text-gray-600 border-gray-100';
        case 'valide': return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'en_cours': return 'bg-orange-50 text-orange-600 border-orange-100';
        case 'recu_partiel': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
        case 'recu': return 'bg-green-50 text-green-700 border-green-100';
        case 'annule': return 'bg-red-50 text-red-600 border-red-100';
        default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
};

const getReceiptStatusClass = (item) => {
    if (item.received_quantity >= item.quantity) return 'text-green-600';
    if (item.received_quantity > 0) return 'text-blue-600';
    return 'text-gray-400';
};

const getLogIconClass = (action) => {
    switch (action) {
        case 'created': return 'bg-green-500';
        case 'updated': return 'bg-blue-500';
        case 'deleted': return 'bg-red-500';
        default: return 'bg-gray-400';
    }
};

const formatLogAction = (log) => {
    if (log.action === 'created') return "Commande initialisée";
    if (log.action === 'updated') {
        const after = log.data_after || {};
        if (after.status) return `Status : ${formatStatus(after.status)}`;
        return "Modification des données";
    }
    return "Action diverse";
};

onMounted(fetchOrder);
</script>
