<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Gestion des Catégories</h1>
        <p class="text-sm text-gray-500 mt-1">Définissez les types d'articles et leur classification (Stock vs Patrimoine).</p>
      </div>
      <div class="mt-4 sm:mt-0">
        <button @click="openCreateModal" class="px-4 py-2 bg-kiam-600 text-white rounded-lg text-sm font-medium hover:bg-kiam-700 transition-colors shadow-sm flex items-center gap-2">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle Catégorie
        </button>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden relative">
      <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 backdrop-blur-[1px]">
        <svg class="animate-spin h-8 w-8 text-kiam-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Classification</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
              <th scope="col" class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="categories.length === 0 && !loading">
              <td colspan="4" class="px-6 py-10 text-center text-gray-500">Aucune catégorie trouvée.</td>
            </tr>
            <tr v-for="item in categories" :key="item.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                {{ item.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="item.type === 'patrimoine' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'" class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-tighter">
                  {{ item.type === 'patrimoine' ? 'Patrimoine (Biens)' : 'Stock (Consommables)' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {{ item.description || '—' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="openEditModal(item)" class="text-blue-600 hover:text-blue-900 mr-3 transition-colors">Modifier</button>
                <button @click="deleteCategory(item.id)" class="text-red-600 hover:text-red-900 transition-colors">Supprimer</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Category -->
    <transition name="fade">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 class="text-lg font-bold text-gray-800 uppercase tracking-tight">{{ isEdit ? 'Modifier' : 'Ajouter' }} une Catégorie</h2>
            <button @click="showModal = false" class="text-gray-400 hover:text-gray-600">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <form @submit.prevent="submitForm" class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Nom de la catégorie *</label>
              <input v-model="form.name" type="text" required class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Type de Bien *</label>
              <select v-model="form.type" required class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm">
                <option value="stock">Stock (Articles / Consommables)</option>
                <option value="patrimoine">Patrimoine (Mobilier / Immobilier)</option>
              </select>
              <p class="mt-1 text-[10px] text-gray-400 italic">Détermine comment l'article est comptabilisé sur le tableau de bord.</p>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Description</label>
              <textarea v-model="form.description" rows="3" class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm"></textarea>
            </div>
            <div class="pt-4 flex justify-end gap-3">
              <button type="button" @click="showModal = false" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
              <button type="submit" :disabled="saving" class="px-4 py-2 text-sm font-medium text-white bg-kiam-600 rounded-lg hover:bg-kiam-700 disabled:opacity-50">
                {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import api from '../../plugins/axios';

const categories = ref([]);
const loading = ref(false);
const saving = ref(false);
const showModal = ref(false);
const isEdit = ref(false);
const currentId = ref(null);

const form = reactive({
    name: '',
    type: 'stock',
    description: ''
});

const fetchCategories = async () => {
    loading.value = true;
    try {
        const res = await api.get('/categories');
        categories.value = res.data;
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const openCreateModal = () => {
    isEdit.value = false;
    currentId.value = null;
    form.name = '';
    form.type = 'stock';
    form.description = '';
    showModal.value = true;
};

const openEditModal = (item) => {
    isEdit.value = true;
    currentId.value = item.id;
    form.name = item.name;
    form.type = item.type;
    form.description = item.description;
    showModal.value = true;
};

const submitForm = async () => {
    saving.value = true;
    try {
        if (isEdit.value) {
            await api.put(`/categories/${currentId.value}`, form);
        } else {
            await api.post('/categories', form);
        }
        showModal.value = false;
        fetchCategories();
    } catch (e) {
        alert(e.response?.data?.message || 'Une erreur est survenue.');
    } finally {
        saving.value = false;
    }
};

const deleteCategory = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer cette catégorie ?')) return;
    try {
        await api.delete(`/categories/${id}`);
        fetchCategories();
    } catch (e) {
        alert(e.response?.data?.message || 'Erreur lors de la suppression.');
    }
};

onMounted(fetchCategories);
</script>
