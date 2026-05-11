<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Mouvements de Stock</h1>
        <p class="text-sm text-gray-500 mt-1">Historique des entrées, sorties et transferts.</p>
      </div>
      <div class="mt-4 sm:mt-0 flex gap-3">
        <button @click="showModal = true" class="px-4 py-2 bg-kiam-600 text-white rounded-lg text-sm font-medium hover:bg-kiam-700 transition-colors shadow-sm flex items-center gap-2">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nouveau Mouvement
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
      <div class="space-y-1">
        <label class="text-[10px] font-bold text-gray-400 uppercase">Type</label>
        <select v-model="filters.type" @change="fetchMovements" class="block w-40 pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm rounded-lg bg-gray-50 font-medium">
          <option value="">Tous</option>
          <option value="entree">Entrée</option>
          <option value="sortie">Sortie</option>
          <option value="transfert">Transfert</option>
        </select>
      </div>
      <div class="space-y-1">
        <label class="text-[10px] font-bold text-gray-400 uppercase">Du</label>
        <input v-model="filters.start_date" type="date" @change="fetchMovements" class="block w-40 pl-3 pr-3 py-2 border-gray-300 focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm rounded-lg bg-gray-50">
      </div>
      <div class="space-y-1">
        <label class="text-[10px] font-bold text-gray-400 uppercase">Au</label>
        <input v-model="filters.end_date" type="date" @change="fetchMovements" class="block w-40 pl-3 pr-3 py-2 border-gray-300 focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm rounded-lg bg-gray-50">
      </div>
      <div class="space-y-1">
        <label class="text-[10px] font-bold text-gray-400 uppercase">Catégorie</label>
        <input v-model="filters.category" type="text" placeholder="Ex: Informatique" @input="fetchMovements" class="block w-40 pl-3 pr-3 py-2 border-gray-300 focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm rounded-lg bg-gray-50">
      </div>
      <button @click="resetFilters" class="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 uppercase border border-transparent hover:border-gray-200 rounded-lg transition-all">Réinitialiser</button>

      <div class="ml-auto flex gap-2">
        <button @click="windowPrint" class="p-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Imprimer">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2m8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
        </button>
        <button @click="downloadPDF" class="p-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Télécharger PDF">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden relative">
      <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
        <svg class="animate-spin h-8 w-8 text-kiam-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Article</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Quantité</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Auteur</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="m in movements.data" :key="m.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDate(m.created_at) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ m.article?.article }}</div>
                <div class="text-xs text-gray-500">{{ m.article?.reference }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getTypeBadgeClass(m.type)" class="px-2 py-1 text-xs font-semibold rounded-full uppercase">
                  {{ m.type }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold" :class="m.type === 'entree' ? 'text-green-600' : 'text-red-600'">
                {{ m.type === 'entree' ? '+' : '-' }}{{ m.quantite }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ m.user?.name || 'Système' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal for New Movement -->
    <transition name="slide-over">
      <div v-if="showModal" class="fixed inset-0 overflow-hidden z-50">
        <div class="absolute inset-0 bg-gray-500 bg-opacity-75" @click="showModal = false"></div>
        <div class="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <div class="w-screen max-w-md">
            <div class="h-full flex flex-col bg-white shadow-xl">
              <div class="py-6 px-4 bg-kiam-700 sm:px-6">
                <h2 class="text-lg font-medium text-white">Nouveau Mouvement</h2>
              </div>
              <div class="p-6 overflow-y-auto">
                <form @submit.prevent="submitForm" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Article</label>
                    <select v-model="form.article_id" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
                      <option v-for="a in articles" :key="a.id" :value="a.id">{{ a.article }} ({{ a.reference }})</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Type de mouvement</label>
                    <select v-model="form.type" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
                      <option value="entree">Entrée (Réception)</option>
                      <option value="sortie">Sortie (Usage/Vente)</option>
                      <option value="transfert">Transfert Interne</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Quantité</label>
                    <input v-model.number="form.quantite" type="number" required min="1" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Motif / Commentaire</label>
                    <textarea v-model="form.motif" rows="3" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm"></textarea>
                  </div>
                  <div class="pt-5 flex justify-end gap-3">
                    <button type="button" @click="showModal = false" class="bg-white py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700">Annuler</button>
                    <button type="submit" class="bg-kiam-600 text-white py-2 px-4 border border-transparent rounded-md text-sm font-medium">Valider</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import api from '../../plugins/axios';

const movements = ref({ data: [] });
const articles = ref([]);
const loading = ref(false);
const showModal = ref(false);
const filters = reactive({ 
    type: '',
    start_date: '',
    end_date: '',
    category: '',
    domain: ''
});

const resetFilters = () => {
    Object.keys(filters).forEach(k => filters[k] = '');
    fetchMovements();
};
const form = reactive({ article_id: '', type: 'entree', quantite: 1, motif: '' });

const fetchMovements = async () => {
    loading.value = true;
    try {
        const res = await api.get('/stock-movements', { params: filters });
        movements.value = res.data;
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const fetchArticles = async () => {
    try {
        const res = await api.get('/articles');
        articles.value = res.data.data || res.data;
    } catch (e) {
        console.error(e);
    }
};

const submitForm = async () => {
    try {
        await api.post('/stock-movements', form);
        showModal.value = false;
        fetchMovements();
        form.article_id = '';
        form.quantite = 1;
        form.motif = '';
    } catch (e) {
        alert('Erreur lors du mouvement. Vérifiez le stock disponible.');
    }
};

const formatDate = (date) => {
    return new Date(date).toLocaleString('fr-FR');
};

const windowPrint = () => {
    window.print();
};

const downloadPDF = () => {
    const token = localStorage.getItem('kiam_token');
    const params = new URLSearchParams(filters).toString();
    window.open(`/kiam/public/api/reports/mouvements-pdf?token=${token}&${params}`, '_blank');
};

const getTypeBadgeClass = (type) => {
    if (type === 'entree') return 'bg-green-100 text-green-800';
    if (type === 'sortie') return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
};

onMounted(() => {
    fetchMovements();
    fetchArticles();
});
</script>

<style scoped>
.slide-over-enter-active, .slide-over-leave-active { transition: all 0.3s ease-out; }
.slide-over-enter-from, .slide-over-leave-to { transform: translateX(100%); }
</style>
