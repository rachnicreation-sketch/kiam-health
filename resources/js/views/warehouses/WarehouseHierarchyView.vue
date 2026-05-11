<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Cartographie des Entrepôts</h1>
        <p class="text-sm text-gray-500 mt-1">Vue hiérarchique et spatiale de vos espaces de stockage.</p>
      </div>
      <div class="flex gap-2">
         <button @click="fetchWarehouses" class="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
         </button>
      </div>
    </div>

    <!-- Warehouse Selector Tabs -->
    <div class="flex border-b border-gray-200 overflow-x-auto gap-8">
      <button 
        v-for="w in warehouses" 
        :key="w.id"
        @click="selectedWarehouse = w"
        :class="selectedWarehouse?.id === w.id ? 'border-kiam-600 text-kiam-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
        class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
      >
        {{ w.nom }} ({{ w.code }})
      </button>
    </div>

    <div v-if="selectedWarehouse" class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Info Sidebar -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Détails Entrepôt</h3>
           <div class="space-y-4">
              <div>
                <span class="text-xs text-gray-400 block">Type</span>
                <span class="text-sm font-bold text-gray-900 border-l-2 border-kiam-500 pl-2 ml-1 uppercase">{{ selectedWarehouse.type }}</span>
              </div>
              <div>
                <span class="text-xs text-gray-400 block">Capacité Max (m3)</span>
                <span class="text-sm font-bold text-gray-900">{{ selectedWarehouse.capacite_m3 || 'N/A' }} m3</span>
              </div>
              <div>
                <span class="text-xs text-gray-400 block">Localisation</span>
                <span class="text-sm text-gray-700">{{ selectedWarehouse.ville || 'Non définie' }}</span>
              </div>
              <div class="pt-4 mt-4 border-t border-gray-50">
                <span class="text-xs text-gray-400 block mb-2">Occupation</span>
                <div class="w-full bg-gray-100 rounded-full h-4 overflow-hidden shadow-inner">
                  <div class="bg-kiam-600 h-full transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold" :style="{ width: occupancyPercent + '%' }">
                    {{ occupancyPercent }}%
                  </div>
                </div>
              </div>
           </div>
        </div>

        <div class="bg-matiaba text-white p-6 rounded-xl shadow-lg border border-blue-900">
           <h3 class="text-xs font-bold text-blue-300 uppercase tracking-widest mb-4">Zones Actives</h3>
           <ul class="space-y-3">
             <li v-for="z in selectedWarehouse.zones" :key="z.id" @click="selectedZone = z" :class="selectedZone?.id === z.id ? 'bg-blue-800' : ''" class="flex justify-between items-center p-2 rounded cursor-pointer hover:bg-blue-800 transition-colors">
               <span class="text-sm font-medium">{{ z.nom }}</span>
               <span class="text-[10px] bg-blue-700 px-1.5 py-0.5 rounded">{{ z.code }}</span>
             </li>
           </ul>
        </div>
      </div>

      <!-- Main Map/Hierarchy View -->
      <div class="lg:col-span-3 space-y-6">
        <div class="bg-white p-8 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
          <div v-if="selectedZone" class="space-y-8">
            <div class="flex justify-between items-end border-b pb-4">
               <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                 <svg class="w-6 h-6 text-kiam-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                 Zone : {{ selectedZone.nom }}
               </h2>
               <div class="text-xs text-gray-400">Cliquez sur un slot pour voir le détail</div>
            </div>

            <!-- Virtual Grid Representation -->
            <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
               <div v-for="a in selectedZone.allees" :key="a.id" class="space-y-3">
                 <div class="text-xs font-bold text-gray-500 uppercase tracking-tighter bg-gray-50 p-1 rounded text-center">Allée {{ a.code }}</div>
                 <div v-for="r in a.rayonnages" :key="r.id" class="p-3 bg-white border-2 border-dashed border-gray-200 rounded-lg hover:border-kiam-500 transition-all group">
                    <div class="text-[10px] font-bold text-gray-400 mb-2">Rayon {{ r.code }}</div>
                    <div class="grid grid-cols-2 gap-1">
                      <div v-for="e in r.emplacements" :key="e.id" 
                        class="h-6 rounded-sm flex items-center justify-center text-[8px] font-bold transition-transform hover:scale-110 cursor-pointer"
                        :class="e.articles_count > 0 ? 'bg-kiam-500 text-white' : 'bg-gray-100 text-gray-400'"
                        @click="showSlotDetails(e)"
                        :title="'Slot ' + e.code + (e.articles_count > 0 ? ': ' + e.articles_count + ' articles' : ': Vide')"
                      >
                        {{ e.code }}
                      </div>
                    </div>
                 </div>
               </div>
            </div>
            
            <div v-if="selectedZone.allees?.length === 0" class="flex flex-col items-center justify-center py-20 grayscale opacity-30">
               <svg class="w-20 h-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
               <span class="mt-4 text-sm font-medium">Aucune allée configurée dans cette zone</span>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-40 border-2 border-dashed border-gray-100 rounded-xl">
             <div class="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <p class="text-gray-500 font-medium">Sélectionnez une zone pour visualiser sa structure</p>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else-if="!loading" class="text-center py-40 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        <p class="text-gray-400">Aucun entrepôt disponible. Configurez vos espaces de stockage dans les paramètres.</p>
    </div>

    <!-- Slot Details Modal -->
    <transition name="fade">
      <div v-if="selectedSlot" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden font-sans">
          <div class="px-6 py-4 bg-matiaba text-white flex justify-between items-center">
            <div>
              <h3 class="font-bold uppercase tracking-tight">Détails Emplacement : {{ selectedSlot.code }}</h3>
              <p class="text-[10px] text-blue-200">Zone: {{ selectedZone.nom }} | Rayon: {{ selectedSlot.rayonnage_code || '-' }}</p>
            </div>
            <button @click="selectedSlot = null" class="text-blue-200 hover:text-white text-2xl">&times;</button>
          </div>
          <div class="p-6 max-h-[60vh] overflow-y-auto">
            <div v-if="slotLoading" class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-kiam-600"></div>
            </div>
            <div v-else-if="slotArticles.length > 0" class="space-y-4">
              <div v-for="art in slotArticles" :key="art.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-white border border-gray-200 rounded-md flex items-center justify-center p-1">
                    <img :src="`https://bwipjs-api.metafloor.com/?bcid=qrcode&text=KIAM-ARTICLE-${art.id}&scale=1`" class="w-full h-full object-contain">
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-gray-900">{{ art.article }}</h4>
                    <p class="text-[10px] text-gray-400 font-mono">{{ art.reference }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-black text-kiam-600">{{ art.quantite_stock }} u.</div>
                  <router-link :to="{ name: 'ArticleDetail', params: { id: art.id } }" class="text-[10px] text-blue-500 font-bold hover:underline">Fiche Produit</router-link>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-10 text-gray-400 italic">
              Cet emplacement est actuellement vide.
            </div>
          </div>
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button @click="selectedSlot = null" class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold uppercase text-gray-600 hover:bg-gray-100">Fermer</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../../plugins/axios';

const loading = ref(true);
const warehouses = ref([]);
const selectedWarehouse = ref(null);
const selectedZone = ref(null);
const selectedSlot = ref(null);
const slotArticles = ref([]);
const slotLoading = ref(false);

const fetchWarehouses = async () => {
    loading.value = true;
    try {
        const response = await api.get('/warehouses?include=full_hierarchy');
        warehouses.value = response.data.data || response.data;
        if (warehouses.value.length > 0) {
            selectedWarehouse.value = warehouses.value[0];
            if (selectedWarehouse.value.zones?.length > 0) {
                selectedZone.value = selectedWarehouse.value.zones[0];
            }
        }
    } catch (e) {
        console.error('Failed to fetch warehouses', e);
    } finally {
        loading.value = false;
    }
};

const showSlotDetails = async (slot) => {
    selectedSlot.value = slot;
    slotLoading.value = true;
    slotArticles.value = [];
    try {
        const response = await api.get('/articles', { params: { emplacement_id: slot.id } });
        slotArticles.value = response.data.data || response.data;
    } catch (e) {
        console.error('Failed to fetch slot articles', e);
    } finally {
        slotLoading.value = false;
    }
};

const occupancyPercent = computed(() => {
    if (!selectedWarehouse.value) return 0;
    // Mock occupancy calculation or use real volume data
    const cap = selectedWarehouse.value.capacite_m3 || 1000;
    // In a real app, this would come from a backend aggregation
    return Math.min(Math.round((selectedWarehouse.value.articles_count || 5) * 12), 100);
});

onMounted(fetchWarehouses);
</script>

<style scoped>
.group:hover div {
    font-weight: bold;
}
</style>
