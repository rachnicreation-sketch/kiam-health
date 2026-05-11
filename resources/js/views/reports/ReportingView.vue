<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 uppercase tracking-tighter">Inventory <span class="text-kiam-600">Reporting</span></h1>
        <p class="text-xs text-gray-500 mt-1 uppercase font-bold tracking-widest">Analyse Décisionnelle & Performance</p>
      </div>
      <div class="flex gap-3">
        <button @click="windowPrint" class="px-4 py-2 bg-white border border-blue-200 rounded-lg text-xs font-bold uppercase tracking-widest text-blue-600 hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-2">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2m8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Imprimer
        </button>
        <button @click="exportToCSV" class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
          <svg class="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          CSV
        </button>
        <button @click="exportReport" class="px-4 py-2 bg-white border border-red-200 rounded-lg text-xs font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 transition-colors shadow-sm flex items-center gap-2">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          PDF
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Top Consumed Articles -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-6 border-b border-gray-50 bg-gray-50/30">
          <h3 class="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Consommation Majeure (Top 5)
          </h3>
        </div>
        <div class="p-0">
          <table class="w-full text-left">
            <thead>
              <tr class="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-gray-50/20">
                <th class="px-6 py-4">Article</th>
                <th class="px-6 py-4 text-right">Volume Sortie</th>
                <th class="px-6 py-4 text-right">Stock Actuel</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="item in reporting.top_consumed" :key="item.reference" class="hover:bg-gray-50 transition-colors text-sm font-medium">
                <td class="px-6 py-4">
                  <div class="text-gray-900">{{ item.article }}</div>
                  <div class="text-[10px] text-gray-400 font-mono uppercase">{{ item.reference }}</div>
                </td>
                <td class="px-6 py-4 text-right text-blue-600 font-bold font-mono">{{ item.quantite_utilisee }}</td>
                <td class="px-6 py-4 text-right">
                   <span :class="item.quantite_stock <= 0 ? 'text-red-600' : 'text-gray-600'" class="font-bold">{{ item.quantite_stock }}</span>
                </td>
              </tr>
              <tr v-if="loading" v-for="i in 5" :key="i">
                <td colspan="3" class="px-6 py-4 animate-pulse bg-gray-50/50 h-12"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Dormant Articles (Slow Moving) -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-6 border-b border-gray-50 bg-gray-50/30">
          <h3 class="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
            <svg class="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Articles Dormants (+30j)
          </h3>
        </div>
        <div class="p-0">
          <table class="w-full text-left">
            <thead>
              <tr class="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-gray-50/20">
                <th class="px-6 py-4">Article</th>
                <th class="px-6 py-4 text-right">Dernier Mvt</th>
                <th class="px-6 py-4 text-right">Stock Immobile</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="item in reporting.dormant_articles" :key="item.reference" class="hover:bg-gray-50 transition-colors text-sm font-medium">
                <td class="px-6 py-4">
                  <div class="text-gray-900">{{ item.article }}</div>
                  <div class="text-[10px] text-gray-400 font-mono uppercase">{{ item.reference }}</div>
                </td>
                <td class="px-6 py-4 text-right text-gray-400 text-xs tracking-tighter">{{ formatRelativeDate(item.updated_at) }}</td>
                <td class="px-6 py-4 text-right">
                   <span class="text-orange-600 font-bold">{{ item.quantite_stock }}</span>
                </td>
              </tr>
              <tr v-if="loading" v-for="i in 5" :key="i">
                <td colspan="3" class="px-6 py-4 animate-pulse bg-gray-50/50 h-12"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Pro Intelligence Note -->
    <div class="bg-blue-900 rounded-xl p-8 text-white relative overflow-hidden shadow-xl group">
       <div class="relative z-10 max-w-2xl">
          <h2 class="text-2xl font-black uppercase tracking-tighter mb-2">Recommandation du Système Intelligence</h2>
          <p class="text-blue-200 text-sm font-medium leading-relaxed">
             Basé sur les flux des 30 derniers jours, nous recommandons une réduction de commande de 15% sur les articles du domaine <span class="bg-blue-800 px-1 rounded text-white px-2">CONSOMMABLE</span> pour optimiser l'espace en Zone C.
          </p>
          <div class="mt-6 flex gap-4">
             <button class="bg-blue-600 hover:bg-blue-500 text-xs font-black uppercase tracking-widest px-6 py-3 rounded-lg transition-all shadow-lg hover:translate-y-[-2px]">Appliquer Optimisation</button>
             <button class="text-xs font-bold uppercase tracking-widest px-6 py-3 border border-white/20 rounded-lg hover:bg-white/10 transition-colors">Ignorer</button>
          </div>
       </div>
       <!-- Abstract Visual Element -->
       <div class="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-kiam-600/20 to-transparent"></div>
       <svg class="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../plugins/axios';

const loading = ref(true);
const reporting = ref({
    top_consumed: [],
    dormant_articles: []
});

const fetchReporting = async () => {
    loading.value = true;
    try {
        const res = await api.get('/dashboard/reporting');
        reporting.value = res.data;
    } catch (e) {
        console.error('Failed to fetch reporting', e);
    } finally {
        loading.value = false;
    }
};

const formatRelativeDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Aujourd'hui";
    return `Il y a ${diff} jours`;
};

const exportToCSV = () => {
    const headers = ['Type', 'Article', 'Reference', 'Valeur', 'Stock'];
    const rows = [];
    
    reporting.value.top_consumed.forEach(i => {
        rows.push(['TOP_CONSUMED', i.article, i.reference, i.quantite_utilisee, i.quantite_stock]);
    });
    
    reporting.value.dormant_articles.forEach(i => {
        rows.push(['DORMANT', i.article, i.reference, '-', i.quantite_stock]);
    });
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "kiam_report_" + new Date().toISOString().split('T')[0] + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const windowPrint = () => {
    window.print();
};

const exportReport = () => {
    const token = localStorage.getItem('kiam_token');
    window.open(`/kiam/public/api/reports/patrimoine-pdf?token=${token}`, '_blank');
};

onMounted(fetchReporting);
</script>
