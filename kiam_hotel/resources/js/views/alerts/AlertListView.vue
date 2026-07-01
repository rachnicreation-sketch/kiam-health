<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 uppercase tracking-tight">Centre de Notifications</h1>
        <p class="text-sm text-gray-500 mt-1">Gérez les alertes de stock et les notifications système.</p>
      </div>
      <div class="mt-4 sm:mt-0 flex gap-3">
        <button @click="markAllAsRead" class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors uppercase tracking-widest text-[10px] font-bold">
          Tout marquer lu
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center">
      <select v-model="filters.statut" @change="fetchAlerts" class="pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-kiam-500 bg-gray-50">
        <option value="">Tous les statuts</option>
        <option value="non_lu">Non lus</option>
        <option value="lu">Lus</option>
      </select>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
      <div v-if="loading" class="p-20 flex justify-center"><div class="animate-spin h-8 w-8 text-kiam-600 border-2 border-kiam-600 border-b-transparent rounded-full"></div></div>
      
      <div v-else class="divide-y divide-gray-50 text-left">
        <div v-for="alert in alerts.data" :key="alert.id" class="p-6 hover:bg-gray-50 transition-colors group">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div class="flex gap-4">
                <div class="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" :class="alert.type === 'stock_rupture' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'">
                   <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                   </svg>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="font-bold text-gray-900">{{ alert.message }}</h3>
                    <span v-if="alert.statut === 'non_lu'" class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] uppercase font-bold">Nouveau</span>
                  </div>
                  <p class="text-sm text-gray-500 mt-1">Article: <span class="font-medium text-gray-700">{{ alert.article?.article }}</span> • Ref: {{ alert.article?.reference }}</p>
                </div>
             </div>
              <div class="flex items-center gap-4">
                 <div class="text-right">
                   <span class="text-xs text-gray-400 block uppercase font-bold tracking-tighter">{{ formatDate(alert.created_at) }}</span>
                   <span class="text-[10px] text-gray-400 font-mono">{{ formatTime(alert.created_at) }}</span>
                 </div>
                 <div class="flex items-center gap-2">
                    <router-link v-if="alert.article_id" :to="{ name: 'ArticleDetail', params: { id: alert.article_id } }" class="p-2 text-kiam-500 hover:bg-kiam-50 rounded-full transition-colors" title="Détails de l'article">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </router-link>
                    <button v-if="alert.statut === 'non_lu'" @click="markAsRead(alert.id)" class="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Marquer comme lu">
                      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" /></svg>
                    </button>
                 </div>
              </div>
          </div>
        </div>
        <div v-if="alerts.data.length === 0" class="p-20 text-center text-gray-400 italic">Aucune alerte trouvée.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '../../plugins/axios';

const alerts = ref({ data: [] });
const loading = ref(false);
const filters = reactive({ statut: 'non_lu' });

const fetchAlerts = async (page = 1) => {
    loading.value = true;
    try {
        const response = await api.get('/alerts', { params: { ...filters, page } });
        alerts.value = response.data;
    } catch (e) {
        console.error('Error fetching alerts', e);
    } finally {
        loading.value = false;
    }
};

const markAsRead = async (id) => {
    try {
        await api.put(`/alerts/${id}`, { statut: 'lu' });
        fetchAlerts();
    } catch (e) {
        console.error('Failed to mark alert as read', e);
    }
};

const markAllAsRead = async () => {
    try {
        await api.post('/alerts/mark-all-read');
        fetchAlerts();
    } catch (e) {
        console.error('Failed to mark all as read', e);
    }
};

const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', { dateStyle: 'medium' });
const formatTime = (date) => new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

onMounted(fetchAlerts);
</script>
