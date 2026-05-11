<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center text-left">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 uppercase">Inventaires Physiques</h1>
        <p class="text-sm text-gray-500 mt-1">Sessions de comptage et ajustements de stock selon les entrepôts.</p>
      </div>
      <div class="flex gap-2">
        <button @click="windowPrint" class="px-4 py-2 border border-blue-300 rounded-lg text-sm font-bold text-blue-700 hover:bg-blue-50 transition-all flex items-center gap-2 shadow-sm uppercase tracking-tighter">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2m8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimer
        </button>
        <button @click="openCreateModal" class="px-4 py-2 bg-kiam-600 text-white rounded-lg text-sm font-bold hover:bg-kiam-700 transition-all flex items-center gap-2 shadow-lg shadow-kiam-100 uppercase tracking-tighter">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          Nouvelle Session
        </button>
      </div>
    </div>

    <!-- Inventory Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-left">
      <div v-if="loading" class="p-12 text-center text-gray-400">Chargement...</div>
      <div v-else-if="!sessions.data?.length" class="p-12 text-center text-gray-400 italic">
        Aucune session d'inventaire trouvée.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
            <tr>
              <th class="px-6 py-4">ID / Référence</th>
              <th class="px-6 py-4">Entrepôt</th>
              <th class="px-6 py-4">Date Début</th>
              <th class="px-6 py-4">Statut</th>
              <th class="px-6 py-4">Opérateur</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50 bg-white">
            <tr v-for="s in sessions.data" :key="s.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 font-mono">#INV-{{ s.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ s.warehouse?.nom }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(s.date_debut) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getStatusBadgeClass(s.statut)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {{ s.statut }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{{ s.user?.name }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <router-link :to="{ name: 'InventoryDetail', params: { id: s.id } }" class="text-kiam-600 hover:text-kiam-900 font-bold text-sm">
                  {{ s.statut === 'en_cours' ? 'Continuer le Comptage' : 'Voir Rapport' }}
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Session Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity bg-gray-900/60 backdrop-blur-sm" @click="showModal = false"></div>
        <div class="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-2xl shadow-2xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="p-6 bg-matiaba text-white">
            <h3 class="text-xl font-bold uppercase tracking-tight">Ouvrir Session Inventaire</h3>
            <p class="text-xs text-blue-200 mt-1">Sélectionnez l'emplacement pour initialiser les stocks théoriques.</p>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Entrepôt à inventorier</label>
              <select v-model="form.warehouse_id" class="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm">
                <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.nom }} ({{ w.code }})</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Notes / Référence</label>
              <input v-model="form.reference" type="text" placeholder="Ex: Inventaire Annuel 2026" class="mt-1 block w-full border-gray-300 rounded-lg shadow-sm sm:text-sm">
            </div>
          </div>
          <div class="p-4 bg-gray-50 flex justify-end gap-3 mt-4">
             <button @click="showModal = false" class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Annuler</button>
             <button @click="startSession" :disabled="!form.warehouse_id || creating" class="px-6 py-2 bg-kiam-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-kiam-100 hover:bg-kiam-700 disabled:opacity-50">
               {{ creating ? 'Initialisation...' : 'Lancer l\'Inventaire' }}
             </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../../plugins/axios';

const router = useRouter();
const sessions = ref({ data: [] });
const warehouses = ref([]);
const loading = ref(true);
const showModal = ref(false);
const creating = ref(false);
const form = ref({ warehouse_id: '', reference: '' });

const fetchSessions = async () => {
    loading.value = true;
    try {
        const res = await api.get('/inventories');
        sessions.value = res.data;
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const openCreateModal = async () => {
    showModal.value = true;
    try {
        const res = await api.get('/warehouses');
        warehouses.value = res.data.data || res.data;
    } catch (e) {
        console.error(e);
    }
};

const startSession = async () => {
    creating.value = true;
    try {
        const res = await api.post('/inventories', form.value);
        router.push({ name: 'InventoryDetail', params: { id: res.data.id } });
    } catch (e) {
        alert('Erreur: ' + (e.response?.data?.message || 'Inconnue'));
    } finally {
        creating.value = false;
    }
};

const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
};

const windowPrint = () => {
    window.print();
};

const getStatusBadgeClass = (status) => {
    switch (status) {
        case 'en_cours': return 'bg-blue-100 text-blue-800';
        case 'cloture': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-50 text-gray-600';
    }
};

onMounted(fetchSessions);
</script>
