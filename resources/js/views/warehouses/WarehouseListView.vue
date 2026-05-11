<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Gestion des Entrepôts</h1>
        <p class="text-sm text-gray-500 mt-1">Gérez vos sites de stockage et leur configuration.</p>
      </div>
      <button @click="openCreateModal" class="px-4 py-2 bg-kiam-600 text-white rounded-lg text-sm font-medium hover:bg-kiam-700 transition-colors shadow-lg shadow-kiam-100 uppercase tracking-tighter">
        Nouvel Entrepôt
      </button>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-blue-50 rounded-lg">
            <svg class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div>
            <p class="text-xs text-gray-400 font-bold uppercase">Total Entrepôts</p>
            <p class="text-2xl font-black text-gray-900">{{ warehouses.total || 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- List Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom / Code</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Localisation</th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Articles</th>
              <th scope="col" class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="w in warehouses.data" :key="w.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-bold text-gray-900">{{ w.nom }}</div>
                <div class="text-xs text-gray-400 font-mono">{{ w.code }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">{{ w.type }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ w.ville || '—' }} {{ w.adresse ? '('+w.adresse+')' : '' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                {{ w.articles_count }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="openEditModal(w)" class="text-kiam-600 hover:text-kiam-900 mr-3 transition-colors">Modifier</button>
                <button @click="deleteWarehouse(w.id)" class="text-red-600 hover:text-red-800 transition-colors">Supprimer</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Build and Visual Map Link -->
    <div class="flex justify-end">
        <router-link :to="{ name: 'WarehouseHierarchy' }" class="text-sm text-blue-600 font-bold hover:underline flex items-center gap-2">
            Voir la cartographie visuelle
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </router-link>
    </div>

    <!-- Create/Edit Modal -->
    <transition name="fade">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div class="px-6 py-4 bg-matiaba text-white flex justify-between items-center">
            <h3 class="font-bold uppercase tracking-tight">{{ isEdit ? 'Modifier' : 'Nouvel' }} Entrepôt</h3>
            <button @click="showModal = false" class="text-blue-200 hover:text-white">&times;</button>
          </div>
          <form @submit.prevent="submitForm" class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Nom de l'entrepôt *</label>
              <input v-model="form.nom" type="text" required class="w-full border-gray-200 rounded-lg focus:ring-kiam-500 focus:border-kiam-500 text-sm">
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Code *</label>
                <input v-model="form.code" type="text" required class="w-full border-gray-200 rounded-lg text-sm">
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Type *</label>
                <select v-model="form.type" required class="w-full border-gray-200 rounded-lg text-sm">
                  <option value="principal">Principal</option>
                  <option value="secondaire">Secondaire</option>
                  <option value="externe">Externe</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Rue / Adresse</label>
              <input v-model="form.adresse" type="text" class="w-full border-gray-200 rounded-lg text-sm">
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Ville</label>
                <input v-model="form.ville" type="text" class="w-full border-gray-200 rounded-lg text-sm">
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Capacité (m3)</label>
                <input v-model.number="form.capacite_m3" type="number" class="w-full border-gray-200 rounded-lg text-sm">
              </div>
            </div>
            <div class="pt-4 flex gap-3">
              <button type="button" @click="showModal = false" class="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold uppercase transition-colors hover:bg-gray-200">Annuler</button>
              <button type="submit" :disabled="submitting" class="flex-1 py-2 bg-kiam-600 text-white rounded-lg text-sm font-bold uppercase shadow-lg shadow-kiam-100 disabled:opacity-50">
                {{ submitting ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '../../plugins/axios';

const warehouses = ref({ data: [], total: 0 });
const showModal = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const currentId = ref(null);

const form = reactive({
    nom: '',
    code: '',
    type: 'principal',
    adresse: '',
    ville: '',
    pays: 'Gabon',
    capacite_m3: 0
});

const fetchWarehouses = async () => {
    try {
        const response = await api.get('/warehouses');
        warehouses.value = response.data;
    } catch (e) {
        console.error('Failed to fetch warehouses', e);
    }
};

const openCreateModal = () => {
    isEdit.value = false;
    currentId.value = null;
    Object.keys(form).forEach(k => form[k] = k === 'type' ? 'principal' : (k === 'pays' ? 'Gabon' : (k === 'capacite_m3' ? 0 : '')));
    showModal.value = true;
};

const openEditModal = (w) => {
    isEdit.value = true;
    currentId.value = w.id;
    Object.keys(form).forEach(k => form[k] = w[k] || '');
    showModal.value = true;
};

const submitForm = async () => {
    submitting.value = true;
    try {
        if (isEdit.value) {
            await api.put(`/warehouses/${currentId.value}`, form);
        } else {
            await api.post('/warehouses', form);
        }
        showModal.value = false;
        fetchWarehouses();
    } catch (e) {
        alert('Erreur lors de l\'enregistrement');
    } finally {
        submitting.value = false;
    }
};

const deleteWarehouse = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet entrepôt ?')) return;
    try {
        await api.delete(`/warehouses/${id}`);
        fetchWarehouses();
    } catch (e) {
        alert(e.response?.data?.message || 'Erreur lors de la suppression');
    }
};

onMounted(fetchWarehouses);
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
