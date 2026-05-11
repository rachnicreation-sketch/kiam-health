<template>
  <div class="space-y-6">
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-kiam-600"></div>
    </div>

    <div v-else-if="session" class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex items-center gap-4">
          <router-link :to="{ name: 'Inventory' }" class="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </router-link>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-gray-900 uppercase">Session Inventaire #{{ session.id }}</h1>
              <span :class="getStatusBadgeClass(session.statut)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {{ session.statut }}
              </span>
            </div>
            <p class="text-sm text-gray-500 uppercase tracking-tight">{{ session.warehouse?.nom }} • Démarre le {{ formatDate(session.date_debut) }}</p>
          </div>
        </div>
        <div class="flex gap-2 w-full md:w-auto">
          <button 
            @click="windowPrint" 
            class="px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2m8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimer
          </button>
          <button 
            @click="downloadPDF" 
            class="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF
          </button>
          <button 
            v-if="session.statut === 'en_cours'"
            @click="validateSession" 
            :disabled="validating"
            class="flex-1 md:flex-none px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 disabled:opacity-50"
          >
            {{ validating ? 'Validation...' : 'Clôturer' }}
          </button>
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <span class="text-[10px] text-gray-400 font-bold uppercase block mb-1">Articles à compter</span>
          <div class="text-2xl font-extrabold text-gray-900">{{ session.lines?.length || 0 }}</div>
        </div>
        <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <span class="text-[10px] text-gray-400 font-bold uppercase block mb-1">Progression</span>
          <div class="text-2xl font-extrabold text-blue-600">{{ progressionPercent }}%</div>
        </div>
        <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <span class="text-[10px] text-gray-400 font-bold uppercase block mb-1">Écarts Détectés</span>
          <div class="text-2xl font-extrabold text-red-500">{{ totalDiscrepancies }}</div>
        </div>
        <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <span class="text-[10px] text-gray-400 font-bold uppercase block mb-1">Valeur Ajustement</span>
          <div class="text-2xl font-extrabold text-gray-900">{{ formatCurrency(totalAdjustmentValue) }}</div>
        </div>
      </div>

      <!-- Inventory Lines Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-left">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
              <tr>
                <th class="px-6 py-4">Article / Référence</th>
                <th class="px-6 py-4 text-center">Théorique</th>
                <th class="px-6 py-4 text-center w-40">Physique (Saisie)</th>
                <th class="px-6 py-4 text-center">Écart</th>
                <th class="px-6 py-4 text-right">Impact Financier</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50 bg-white">
              <tr v-for="line in session.lines" :key="line.id" class="hover:bg-gray-50 transition-colors group">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-bold text-gray-900 uppercase tracking-tight">{{ line.article?.article }}</div>
                  <div class="text-[10px] text-gray-400 font-mono">{{ line.article?.reference }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-500">
                  {{ line.qte_theorique }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <input 
                    v-if="session.statut === 'en_cours'"
                    v-model.number="line.qte_reelle" 
                    @change="updateLine(line)"
                    type="number" 
                    class="w-24 text-center py-1.5 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-kiam-500 transition-all"
                  >
                  <span v-else class="text-sm font-bold">{{ line.qte_reelle }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center font-mono font-bold">
                  <span :class="line.ecart === 0 ? 'text-gray-300' : (line.ecart > 0 ? 'text-green-600' : 'text-red-500')">
                    {{ line.ecart > 0 ? '+' : '' }}{{ line.ecart }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                   {{ formatCurrency(line.ecart * line.article?.prix_achat) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../../plugins/axios';

const route = useRoute();
const router = useRouter();
const session = ref(null);
const loading = ref(true);
const validating = ref(false);

const fetchSession = async () => {
    loading.value = true;
    try {
        const response = await api.get(`/inventories/${route.params.id}`);
        session.value = response.data;
    } catch (e) {
        console.error('Failed to fetch inventory session', e);
    } finally {
        loading.value = false;
    }
};

const updateLine = async (line) => {
    try {
        const res = await api.put(`/inventory-lines/${line.id}`, { quantite_physique: line.qte_reelle });
        line.ecart = res.data.ecart;
    } catch (e) {
        alert('Erreur lors de la mise à jour de la ligne');
    }
};

const validateSession = async () => {
    if (!confirm('Voulez-vous vraiment clôturer cet inventaire ? Les stocks seront mis à jour automatiquement.')) return;
    
    validating.value = true;
    try {
        await api.post(`/inventories/${session.value.id}/validate`);
        router.push({ name: 'Inventory' });
    } catch (e) {
        alert(e.response?.data?.message || 'Erreur lors de la validation');
    } finally {
        validating.value = false;
    }
};

const windowPrint = () => {
    window.print();
};

const downloadPDF = () => {
    const token = localStorage.getItem('kiam_token');
    window.open(`/kiam/public/api/reports/inventory-pdf/${session.value.id}?token=${token}`, '_blank');
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(value || 0);
};

const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
};

const getStatusBadgeClass = (status) => {
    switch (status) {
        case 'en_cours': return 'bg-blue-100 text-blue-800';
        case 'cloture': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-50 text-gray-600';
    }
};

const progressionPercent = computed(() => {
    if (!session.value?.lines?.length) return 0;
    const counted = session.value.lines.filter(l => l.qte_reelle > 0 || l.ecart != -l.qte_theorique).length;
    return Math.round((counted / session.value.lines.length) * 100);
});

const totalDiscrepancies = computed(() => {
    if (!session.value?.lines?.length) return 0;
    return session.value.lines.filter(l => l.ecart !== 0).length;
});

const totalAdjustmentValue = computed(() => {
    if (!session.value?.lines?.length) return 0;
    return session.value.lines.reduce((acc, l) => acc + (l.ecart * (l.article?.prix_achat || 0)), 0);
});

onMounted(fetchSession);
</script>
