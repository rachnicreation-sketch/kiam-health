<template>
  <div v-if="loading" class="flex justify-center items-center h-64">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
  </div>
  <div v-else class="max-w-6xl mx-auto space-y-6 pb-20">
    <div class="flex items-center gap-4">
      <router-link :to="{ name: 'PurchaseOrderDetail', params: { id: order.id } }" class="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
      </router-link>
      <div>
        <h1 class="text-2xl font-black text-gray-900 tracking-tight">Réception de marchandises</h1>
        <p class="text-sm text-gray-500">Enregistrement des quantités reçues pour <span class="font-bold text-gray-700">{{ order.reference }}</span></p>
      </div>
    </div>

    <div class="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4">
        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div class="text-sm text-blue-800">
            <p class="font-bold">Instructions de réception</p>
            <p>Saisissez les quantités effectivement reçues. Le stock sera mis à jour en fonction des mouvements d'entrée générés.</p>
        </div>
    </div>

    <form @submit.prevent="submitReceipt" class="space-y-6">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50/50">
            <tr>
              <th scope="col" class="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Article / SKU</th>
              <th scope="col" class="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">Attendu</th>
              <th scope="col" class="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">Déjà Reçu</th>
              <th scope="col" class="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest w-40">Réceptionner (Qté)</th>
              <th scope="col" class="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Traçabilité (Lot / DLUO)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="(item, index) in receiptForm.items" :key="item.id" class="hover:bg-gray-50/30 transition-colors">
              <td class="px-6 py-4">
                <div class="text-sm font-bold text-gray-900">{{ item.article_name }}</div>
                <div class="text-[10px] text-gray-500 font-mono uppercase">{{ item.article_ref }}</div>
              </td>
              <td class="px-6 py-4 text-center text-sm font-bold text-gray-500">
                {{ item.ordered_quantity }}
              </td>
              <td class="px-6 py-4 text-center text-sm font-bold text-blue-600">
                {{ item.previously_received }}
              </td>
              <td class="px-6 py-4">
                <div class="relative">
                    <input type="number" v-model.number="item.received_quantity" min="0" :max="item.ordered_quantity - item.previously_received" step="0.1" class="block w-full rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-lg text-center font-black text-green-700 bg-green-50/30">
                    <button type="button" @click="receiveRemaining(index)" class="absolute -right-2 top-1/2 -translate-y-1/2 p-2 text-green-600 hover:text-green-700 transition-transform hover:scale-110" title="Tout réceptionner">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                    </button>
                </div>
              </td>
              <td class="px-6 py-4 space-y-2">
                <input type="text" v-model="item.batch_number" placeholder="N° de Lot" class="block w-full rounded-lg border-gray-100 text-[10px] font-bold uppercase tracking-tight focus:border-blue-500 focus:ring-blue-500 sm:text-xs">
                <div class="flex gap-2">
                    <input type="date" v-model="item.expiry_date" class="block w-full rounded-lg border-gray-100 text-[10px] font-bold focus:border-blue-500 focus:ring-blue-500 sm:text-xs" title="Date de péremption">
                    <input type="text" v-model="item.serial_number" placeholder="S/N" class="block w-full rounded-lg border-gray-100 text-[10px] font-bold focus:border-blue-500 focus:ring-blue-500 sm:text-xs">
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-between items-center bg-white p-6 rounded-2xl shadow-lg border border-gray-100 sticky bottom-6 z-10">
        <div>
            <p class="text-xs text-gray-500 font-bold uppercase tracking-widest">Articles à réceptionner</p>
            <p class="text-2xl font-black text-gray-900">{{ itemsToReceiveCount }} ligne(s)</p>
        </div>
        <div class="flex gap-3">
          <router-link :to="{ name: 'PurchaseOrderDetail', params: { id: order.id } }" class="px-8 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
            Abandonner
          </router-link>
          <button type="submit" :disabled="saving || itemsToReceiveCount === 0" class="px-8 py-3 bg-green-600 text-white rounded-xl text-sm font-black hover:bg-green-700 disabled:opacity-50 transition-all shadow-xl shadow-green-100 flex items-center gap-2">
            <svg v-if="saving" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            {{ saving ? 'Traitement en cours...' : 'Valider la Réception' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../../plugins/axios';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const saving = ref(false);
const order = ref({});

const receiptForm = reactive({
    items: []
});

const itemsToReceiveCount = computed(() => {
    return receiptForm.items.filter(i => (i.received_quantity || 0) > 0).length;
});

const fetchOrder = async () => {
    loading.value = true;
    try {
        const response = await api.get(`/purchase-orders/${route.params.id}`);
        order.value = response.data;
        
        receiptForm.items = order.value.items.map(item => ({
            id: item.id,
            article_name: item.article?.article,
            article_ref: item.article?.reference,
            ordered_quantity: item.quantity,
            previously_received: parseFloat(item.received_quantity) || 0,
            received_quantity: 0,
            batch_number: '',
            expiry_date: '',
            serial_number: ''
        }));
    } catch (e) {
        console.error(e);
        alert("Erreur de chargement.");
    } finally {
        loading.value = false;
    }
};

const receiveRemaining = (index) => {
    const item = receiptForm.items[index];
    item.received_quantity = item.ordered_quantity - item.previously_received;
};

const submitReceipt = async () => {
    if (itemsToReceiveCount.value === 0) return;
    
    saving.value = true;
    try {
        await api.post(`/purchase-orders/${order.value.id}/receive`, {
            items: receiptForm.items.filter(i => i.received_quantity > 0)
        });
        router.push({ name: 'PurchaseOrderDetail', params: { id: order.value.id } });
    } catch (e) {
        console.error(e);
        alert(e.response?.data?.message || "Erreur lors de la réception.");
    } finally {
        saving.value = false;
    }
};

onMounted(fetchOrder);
</script>
