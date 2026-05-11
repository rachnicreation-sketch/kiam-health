<template>
  <div class="space-y-6">
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-kiam-600"></div>
    </div>

    <div v-else-if="article" class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex items-center gap-4">
          <router-link :to="{ name: 'Articles' }" class="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </router-link>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-gray-900">{{ article.article }}</h1>
              <span :class="getStatusBadgeClass(article.statut)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {{ article.statut }}
              </span>
            </div>
            <p class="text-sm text-gray-500 font-mono">
              {{ article.reference }} • {{ article.category?.name || article.categorie }}
              <span class="ml-2 px-2 py-0.5 bg-gray-100 rounded text-[9px] text-gray-400 font-bold uppercase">Ajouté le: {{ formatDate(article.created_at) }}</span>
            </p>
          </div>
        </div>
        <div class="flex gap-2 w-full md:w-auto">
          <button @click="printLabel" class="flex-1 md:flex-none px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Imprimer Étiquette</button>
          <button @click="openEditModal" class="flex-1 md:flex-none px-4 py-2 bg-kiam-600 text-white rounded-lg text-sm font-medium hover:bg-kiam-700 transition-colors shadow-lg shadow-kiam-100 uppercase tracking-tighter font-bold">Modifier</button>
        </div>
      </div>

      <!-- Edit Modal (Slide-over) -->
      <transition name="slide-over">
        <div v-if="showEditModal" class="fixed inset-0 overflow-hidden z-50">
          <div class="absolute inset-0 overflow-hidden">
            <div class="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showEditModal = false"></div>
            <div class="fixed inset-y-0 right-0 pl-10 max-w-full flex">
              <div class="w-screen max-w-md">
                <div class="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
                  <div class="py-6 px-4 bg-matiaba text-white sm:px-6">
                    <div class="flex items-center justify-between">
                      <h2 class="text-lg font-bold uppercase tracking-tight">Modifier l'Article</h2>
                      <button @click="showEditModal = false" class="text-blue-200 hover:text-white">
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                  <div class="relative flex-1 py-6 px-4 sm:px-6">
                    <form @submit.prevent="submitEditForm" class="space-y-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Dénomination *</label>
                        <input v-model="form.article" type="text" required class="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm transition-all">
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700">Référence *</label>
                          <input v-model="form.reference" type="text" required class="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm">
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700">Fabricant</label>
                          <input v-model="form.fabricant" type="text" class="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm">
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700">Catégorie *</label>
                          <select v-model="form.category_id" required class="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm">
                            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                          </select>
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700">Entrepôt</label>
                          <select v-model="form.warehouse_id" @change="fetchEmplacements" class="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm">
                            <option value="">Sélectionner</option>
                            <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.nom }}</option>
                          </select>
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700">Emplacement (Slot)</label>
                          <select v-model="form.emplacement_id" class="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm">
                            <option value="">Sélectionner</option>
                            <option v-for="e in emplacements" :key="e.id" :value="e.id">{{ e.code }}</option>
                          </select>
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700">Statut</label>
                          <select v-model="form.statut" class="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm">
                            <option value="actif">Actif</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="reparer">À Réparer</option>
                            <option value="obsolete">Obsolète</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Domaine d'utilisation</label>
                        <input v-model="form.domaine_utilisation" type="text" class="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm" placeholder="Ex: Maintenance, Bureautique, etc.">
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700">Prix Achat</label>
                          <input v-model.number="form.prix_achat" type="number" step="0.01" class="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm">
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700">Stock Min.</label>
                          <input v-model.number="form.stock_minimum" type="number" class="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm">
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700">Type Amortissement</label>
                          <select v-model="form.type_amortissement" class="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm">
                            <option value="">Aucun</option>
                            <option value="lineaire">Linéaire</option>
                            <option value="degressif">Dégressif</option>
                          </select>
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700">Durée (Ans)</label>
                          <input v-model.number="form.duree_amortissement" type="number" class="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm">
                        </div>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Valeur Résiduelle</label>
                        <input v-model.number="form.valeur_residuelle" type="number" step="0.01" class="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm">
                      </div>
                      <div class="pt-5 flex justify-end gap-3 border-t border-gray-100">
                        <button type="button" @click="showEditModal = false" class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
                        <button type="submit" :disabled="saving" class="px-6 py-2 bg-kiam-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-kiam-100 hover:bg-kiam-700 disabled:opacity-50">
                          {{ saving ? 'Mise à jour...' : 'Sauvegarder' }}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Stats & Info -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div class="space-y-1">
                <span class="text-xs text-gray-400 uppercase font-bold tracking-tighter">Stock Actuel</span>
                <div class="text-2xl font-bold text-gray-900">{{ article.quantite_stock }} <span class="text-gray-400 text-sm font-normal">{{ article.unite_mesure }}</span></div>
              </div>
              <div class="space-y-1">
                <span class="text-xs text-gray-400 uppercase font-bold tracking-tighter">Valeur Stock</span>
                <div class="text-2xl font-bold text-kiam-600">{{ formatCurrency(article.quantite_stock * article.prix_achat) }}</div>
              </div>
              <div class="space-y-1">
                <span class="text-xs text-gray-400 uppercase font-bold tracking-tighter">Prix Unitaire</span>
                <div class="text-2xl font-bold text-gray-900">{{ formatCurrency(article.prix_achat) }}</div>
              </div>
              <div class="space-y-1">
                <span class="text-xs text-gray-400 uppercase font-bold tracking-tighter">Stock Min.</span>
                <div class="text-2xl font-bold" :class="article.quantite_stock <= article.stock_minimum ? 'text-red-500' : 'text-gray-900'">{{ article.stock_minimum }}</div>
              </div>
            </div>
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
               <div class="flex items-center gap-4 text-xs font-medium text-gray-500">
                  <span class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> {{ article.warehouse?.nom }}</span>
                  <span class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> {{ article.supplier?.nom }}</span>
               </div>
            </div>
          </div>

          <!-- Movement History -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-4 border-b border-gray-50 flex justify-between items-center">
              <h3 class="font-bold text-gray-800">Historique des Mouvements</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="bg-gray-50 text-xs font-bold text-gray-400 uppercase">
                  <tr>
                    <th class="px-6 py-3">Date</th>
                    <th class="px-6 py-3">Type</th>
                    <th class="px-6 py-3 text-right">Quantité</th>
                    <th class="px-6 py-3">Opérateur</th>
                    <th class="px-6 py-3">Note</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50 text-gray-600">
                   <tr v-for="m in article.stock_movements" :key="m.id" class="hover:bg-gray-50 transition-colors">
                     <td class="px-6 py-4">{{ formatDate(m.created_at) }}</td>
                     <td class="px-6 py-4">
                       <span :class="m.type === 'entree' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase">{{ m.type }}</span>
                     </td>
                     <td class="px-6 py-4 text-right font-mono font-bold" :class="m.type === 'entree' ? 'text-green-600' : 'text-red-600'">
                       {{ m.type === 'entree' ? '+' : '-' }}{{ m.quantite }}
                     </td>
                     <td class="px-6 py-4 text-xs font-medium">{{ m.user?.name }}</td>
                     <td class="px-6 py-4 text-xs italic text-gray-400">{{ m.notes || m.commentaire || '-' }}</td>
                   </tr>
                </tbody>
              </table>
              <div v-if="!article.stock_movements?.length" class="p-10 text-center text-gray-400 italic">Aucun mouvement pour cet article</div>
            </div>
          </div>
        </div>

        <!-- Right Panel: Financials & Asset Tracking -->
        <div class="space-y-6">
          <!-- QR Code Preview (Pro touch) -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
             <div class="w-32 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center mb-4 relative group overflow-hidden p-2 shadow-inner">
                <!-- Real QR Code using bwip-js API (Identifiant: Dénomination + Référence) -->
                <img 
                  :src="`https://bwipjs-api.metafloor.com/?bcid=qrcode&text=${encodeURIComponent(article.article + ' | REF: ' + article.reference)}&scale=3&rotate=N`" 
                  alt="QR Code" 
                  class="w-full h-full object-contain"
                >
                <div class="absolute inset-0 bg-kiam-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                   <span @click="printLabel" class="text-white font-bold text-xs uppercase">Imprimer</span>
                </div>
             </div>
             <div class="text-[10px] font-mono text-gray-400">UUID: {{ article.reference }}</div>
             <p class="mt-2 text-xs text-gray-400 italic">Identifiant unique pour scan WMS</p>
             
             <!-- Real Barcode using bwip-js API -->
             <div class="mt-4 pt-4 border-t border-gray-50 w-full flex flex-col items-center">
                <div class="h-12 w-full flex items-center justify-center mb-1 overflow-hidden">
                    <img 
                      :src="`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(article.article + ' | REF: ' + article.reference)}&scale=2&rotate=N&includetext=true`" 
                      alt="Barcode"
                      class="max-w-full h-auto"
                    >
                </div>
                <span class="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Format Code128</span>
             </div>
          </div>

          <!-- Amortization Panel -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-4 bg-matiaba text-white flex justify-between items-center">
               <h3 class="text-xs font-bold uppercase tracking-widest">Suivi Financier</h3>
               <svg class="w-4 h-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <div class="p-6 space-y-4">
               <div>
                  <span class="text-xs text-gray-400 block uppercase font-bold text-[10px]">Méthode</span>
                  <span class="text-sm font-bold text-gray-900">{{ article.type_amortissement || 'Non amortissable' }}</span>
               </div>
               <div>
                  <span class="text-xs text-gray-400 block uppercase font-bold text-[10px]">Durée de Vie</span>
                  <span class="text-sm font-bold text-gray-900">{{ article.duree_amortissement || '-' }} Ans</span>
               </div>
               <div class="pt-4 mt-4 border-t border-gray-50">
                  <span class="text-xs text-gray-400 block uppercase font-bold text-[10px] mb-2">Amortissement Actuel</span>
                  <div class="relative pt-1">
                    <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                      <div :style="{ width: amortizationProgress + '%' }" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-1000"></div>
                    </div>
                  </div>
                  <div class="flex justify-between items-end">
                     <div>
                        <span class="text-[10px] text-gray-400 block">Valeur Comptable</span>
                        <span class="text-lg font-bold text-gray-900">{{ formatCurrency(currentBookValue) }}</span>
                     </div>
                     <span class="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded font-bold">{{ amortizationProgress }}% Consommé</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="bg-white p-20 rounded-xl shadow-sm border border-gray-100 text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      </div>
      <h2 class="text-xl font-bold text-gray-900 mb-2">Article non trouvé</h2>
      <p class="text-gray-500 mb-6">L'article demandé n'existe pas ou n'a pas pu être chargé.</p>
      <router-link :to="{ name: 'Articles' }" class="px-6 py-2 bg-kiam-600 text-white rounded-lg font-bold">Retour à la liste</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import { useRoute } from 'vue-router';
import api from '../../plugins/axios';

const route = useRoute();
const article = ref(null);
const categories = ref([]);
const warehouses = ref([]);
const emplacements = ref([]);
const loading = ref(true);
const showEditModal = ref(false);
const saving = ref(false);

const form = reactive({
    article: '',
    reference: '',
    prix_achat: 0,
    stock_minimum: 0,
    categorie: '',
    category_id: '',
    fabricant: '',
    domaine_utilisation: '',
    warehouse_id: '',
    emplacement_id: '',
    statut: '',
    type_amortissement: '',
    duree_amortissement: 0,
    valeur_residuelle: 0
});

const fetchArticle = async () => {
    loading.value = true;
    try {
        const [articleRes, catRes, warRes] = await Promise.all([
            api.get(`/articles/${route.params.id}`),
            api.get('/categories'),
            api.get('/warehouses')
        ]);
        article.value = articleRes.data;
        categories.value = catRes.data;
        warehouses.value = warRes.data.data || warRes.data;
    } catch (e) {
        console.error('Failed to fetch article details', e);
    } finally {
        loading.value = false;
    }
};

const openEditModal = () => {
    if (!article.value) return;
    form.article = article.value.article;
    form.reference = article.value.reference;
    form.prix_achat = article.value.prix_achat;
    form.stock_minimum = article.value.stock_minimum;
    form.categorie = article.value.categorie;
    form.category_id = article.value.category_id;
    form.fabricant = article.value.fabricant;
    form.domaine_utilisation = article.value.domaine_utilisation;
    form.statut = article.value.statut;
    form.type_amortissement = article.value.type_amortissement || '';
    form.duree_amortissement = article.value.duree_amortissement || 0;
    form.valeur_residuelle = article.value.valeur_residuelle || 0;
    form.warehouse_id = article.value.warehouse_id || '';
    form.emplacement_id = article.value.emplacement_id || '';
    if (form.warehouse_id) {
        fetchEmplacements();
    }
    showEditModal.value = true;
};

const fetchEmplacements = async () => {
    if (!form.warehouse_id) {
        emplacements.value = [];
        return;
    }
    try {
        const response = await api.get(`/warehouses/${form.warehouse_id}/emplacements`);
        emplacements.value = response.data;
    } catch (e) {
        console.error('Error fetching emplacements', e);
    }
};

const submitEditForm = async () => {
    saving.value = true;
    try {
        const response = await api.put(`/articles/${article.value.id}`, form);
        article.value = response.data;
        showEditModal.value = false;
    } catch (e) {
        alert('Erreur lors de la mise à jour de l\'article.');
    } finally {
        saving.value = false;
    }
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(value || 0);
};

const formatDate = (date) => {
    if (!date) return '-';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return date;
        return d.toLocaleDateString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
    } catch (e) {
        return date;
    }
};

const getStatusBadgeClass = (status) => {
    switch (status) {
        case 'actif': return 'bg-green-100 text-green-800';
        case 'maintenance': return 'bg-yellow-100 text-yellow-800';
        case 'reparer': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const printLabel = () => {
    window.print();
};

// MOCK Financial Logic (Pro feature)
const currentBookValue = computed(() => {
    if (!article.value?.prix_achat) return 0;
    if (!article.value.duree_amortissement) return article.value.prix_achat;
    
    // Linear calculation based on date_acquisition
    const acqDate = new Date(article.value.date_acquisition || article.value.created_at);
    const now = new Date();
    const diffYears = (now - acqDate) / (1000 * 60 * 60 * 24 * 365.25);
    const annualDepreciation = article.value.prix_achat / article.value.duree_amortissement;
    
    const newValue = article.value.prix_achat - (annualDepreciation * diffYears);
    return Math.max(newValue, article.value.valeur_residuelle || 0);
});

const amortizationProgress = computed(() => {
    if (!article.value?.prix_achat) return 0;
    const initial = article.value.prix_achat;
    const current = currentBookValue.value;
    return Math.round(((initial - current) / initial) * 100);
});

onMounted(fetchArticle);
</script>

<style scoped>
@media print {
  .space-y-6, .flex, .grid, .bg-gray-500, .z-50 {
    display: none !important;
  }
  
  .print-label-container {
    display: block !important;
    width: 80mm;
    height: 80mm;
    padding: 5mm;
    border: 1px solid #eee;
    text-align: center;
    font-family: 'Courier New', Courier, monospace;
  }
  
  body * {
    visibility: hidden;
  }
  
  .print-label-container, .print-label-container * {
    visibility: visible;
  }
  
  .print-label-container {
    position: absolute;
    left: 0;
    top: 0;
  }
}

.slide-over-enter-active, .slide-over-leave-active {
  transition: transform 0.3s ease-in-out;
}
.slide-over-enter-from, .slide-over-leave-to {
  transform: translateX(100%);
}
</style>
