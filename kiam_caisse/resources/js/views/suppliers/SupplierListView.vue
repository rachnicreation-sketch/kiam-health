<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center text-left">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 uppercase tracking-tight">Annuaire Fournisseurs & CRM</h1>
        <p class="text-sm text-gray-500 mt-1">Gérez vos relations partenaires, contrats et historiques d'achat.</p>
      </div>
      <button @click="showCreateModal = true" class="px-4 py-2 bg-kiam-600 text-white rounded-lg text-sm font-medium hover:bg-kiam-700 transition-all flex items-center gap-2 shadow-lg shadow-kiam-100">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        Nouveau Partenaire
      </button>
    </div>

    <!-- Quick Stats for Suppliers -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div class="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        </div>
        <div>
          <span class="text-xs text-gray-400 font-bold uppercase">Total Partenaires</span>
          <div class="text-xl font-bold text-gray-900">{{ suppliers.total || 0 }}</div>
        </div>
      </div>
      <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div class="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        </div>
        <div>
          <span class="text-xs text-gray-400 font-bold uppercase">Commandes en cours</span>
          <div class="text-xl font-bold text-gray-900">12</div>
        </div>
      </div>
      <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div class="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <span class="text-xs text-gray-400 font-bold uppercase">Volume Achats (MTD)</span>
          <div class="text-xl font-bold text-gray-900">$45,200</div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-left">
      <div class="p-4 border-b border-gray-50 bg-gray-50 flex gap-4">
        <div class="relative flex-1">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input 
            v-model="search"
            @input="fetchSuppliers"
            type="text" 
            placeholder="Rechercher par nom, code ou contact..." 
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm"
          >
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <tr>
              <th class="px-6 py-4">Nom / Partenaire</th>
              <th class="px-6 py-4">Contact Principal</th>
              <th class="px-6 py-4">Coordonnées</th>
              <th class="px-6 py-4">Catégorie</th>
              <th class="px-6 py-4">Statut</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            <tr v-if="loading" class="animate-pulse">
                <td colspan="6" class="px-6 py-10 text-center text-gray-400">Chargement des données...</td>
            </tr>
            <tr v-for="item in suppliers.data" :key="item.id" class="hover:bg-gray-50 transition-colors group">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-lg uppercase shadow-sm">
                    {{ item.nom.substring(0, 1) }}
                  </div>
                  <div>
                    <div class="text-sm font-bold text-gray-900">{{ item.nom }}</div>
                    <div class="text-[10px] text-gray-400 font-mono">{{ item.code }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-700 font-medium">{{ item.contact_nom || '-' }}</div>
                <div class="text-xs text-gray-400">{{ item.contact_fonction || 'Commercial' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                 <div class="flex flex-col text-xs text-gray-500 gap-1">
                   <span class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> {{ item.email }}</span>
                   <span class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> {{ item.telephone }}</span>
                 </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                 <span class="px-2 py-1 rounded text-[10px] bg-blue-50 text-blue-600 font-bold uppercase tracking-tighter">{{ item.type || 'Standard' }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-[10px] leading-5 font-bold rounded-full bg-green-100 text-green-800 uppercase">Certifié</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="text-kiam-600 hover:text-kiam-900 mr-4 font-bold">Détails</button>
                <button class="text-gray-400 hover:text-red-600">
                   <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Slide-over -->
    <div v-if="showCreateModal" class="fixed inset-0 overflow-hidden z-50">
      <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" @click="showCreateModal = false"></div>
      <div class="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div class="w-screen max-w-md">
          <form @submit.prevent="submitForm" class="h-full flex flex-col bg-white shadow-2xl">
            <div class="p-6 bg-matiaba text-white">
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-bold">Nouveau Partenaire KIAM</h2>
                <button type="button" @click="showCreateModal = false" class="text-white hover:text-blue-200">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l18 18" /></svg>
                </button>
              </div>
              <p class="mt-2 text-blue-100 text-xs">Enregistrez un nouveau fournisseur ou prestataire de services.</p>
            </div>

            <div class="flex-1 relative overflow-y-auto p-6 space-y-6">
               <div class="space-y-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Informations Générales</h3>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Nom du Fournisseur *</label>
                    <input v-model="form.nom" type="text" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Code Unique (SIRET/Identifiant)</label>
                    <input v-model="form.code" type="text" placeholder="FOU-XXXX" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm">
                  </div>
               </div>

               <div class="space-y-4">
                  <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Contact & Coordonnées</h3>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Email</label>
                      <input v-model="form.email" type="email" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Téléphone</label>
                      <input v-model="form.telephone" type="text" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Nom du Contact</label>
                    <input v-model="form.contact_nom" type="text" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
                  </div>
               </div>
            </div>

            <div class="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
               <button type="button" @click="showCreateModal = false" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-white">Annuler</button>
               <button type="submit" class="px-4 py-2 bg-kiam-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-kiam-100 hover:bg-kiam-700 transition-colors">Enregistrer le Partenaire</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../plugins/axios';

const suppliers = ref({ data: [], total: 0 });
const loading = ref(true);
const search = ref('');
const showCreateModal = ref(false);

const form = ref({
    nom: '',
    code: '',
    email: '',
    telephone: '',
    adresse: '',
    contact_nom: '',
    contact_fonction: '',
    site_web: '',
});

const fetchSuppliers = async () => {
    loading.value = true;
    try {
        const res = await api.get('/suppliers', { params: { search: search.value } });
        suppliers.value = res.data;
    } catch (e) {
        console.error('Failed to load suppliers', e);
    } finally {
        loading.value = false;
    }
};

const submitForm = async () => {
    try {
        await api.post('/suppliers', form.value);
        showCreateModal.value = false;
        fetchSuppliers();
        // Reset
        form.value = { nom: '', code: '', email: '', telephone: '', contact_nom: '' };
    } catch (e) {
        alert('Erreur: ' + (e.response?.data?.message || 'Inconnue'));
    }
};

onMounted(fetchSuppliers);
</script>
