<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="flex items-center gap-4">
      <router-link :to="{ name: 'PurchaseOrderList' }" class="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </router-link>
      <h1 class="text-2xl font-bold tracking-tight text-gray-900">{{ isEditing ? 'Modifier' : 'Nouveau' }} Bon de Commande</h1>
    </div>

    <form @submit.prevent="saveOrder" class="space-y-6">
      <!-- General Info -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Informations Générales
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fournisseur *</label>
            <select v-model="form.supplier_id" required class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
              <option value="" disabled>Sélectionner un fournisseur</option>
              <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">{{ supplier.nom }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Entrepôt de destination</label>
            <select v-model="form.warehouse_id" class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
              <option :value="null">Sélectionner un entrepôt</option>
              <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">{{ warehouse.nom }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date prévue de réception</label>
            <input type="date" v-model="form.expected_arrival_date" class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
          </div>
        </div>
        <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes / Instructions</label>
            <textarea v-model="form.notes" rows="2" class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Conditions de livraison, commentaires..."></textarea>
        </div>
      </div>

      <!-- Articles -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 class="text-lg font-semibold text-gray-900">Articles commandés</h2>
          <button type="button" @click="addItem" class="text-sm text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            Ajouter une ligne
          </button>
        </div>
        
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Article</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase w-32">Quantité</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase w-48">Prix Unitaire (FCFA)</th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase w-40">Total</th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase w-16"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="(item, index) in form.items" :key="index" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4">
                <select v-model="item.article_id" required @change="articleSelected(index)" class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option value="" disabled>Sélectionner un article</option>
                  <option v-for="article in articles" :key="article.id" :value="article.id">
                    [{{ article.reference || 'N/A' }}] {{ article.article }}
                  </option>
                </select>
              </td>
              <td class="px-6 py-4">
                <input type="number" v-model.number="item.quantity" step="0.1" required class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-center font-bold">
              </td>
              <td class="px-6 py-4">
                <input type="number" v-model.number="item.unit_price" required class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-right font-bold">
              </td>
              <td class="px-6 py-4 text-right text-sm font-bold text-gray-900">
                {{ formatCurrency(item.quantity * item.unit_price) }}
              </td>
              <td class="px-6 py-4 text-right">
                <button type="button" @click="removeItem(index)" class="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-blue-50/50">
            <tr>
              <td colspan="3" class="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase">Total Général</td>
              <td class="px-6 py-4 text-right text-lg font-bold text-blue-700">{{ formatCurrency(totalAmount) }}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="flex justify-end gap-3">
        <router-link :to="{ name: 'PurchaseOrderList' }" class="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Annuler
        </router-link>
        <button type="submit" :disabled="saving" class="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md">
          {{ saving ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Enregistrer le Bon') }}
        </button>
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

const isEditing = computed(() => !!route.params.id);
const saving = ref(false);
const suppliers = ref([]);
const warehouses = ref([]);
const articles = ref([]);

const form = reactive({
    supplier_id: '',
    warehouse_id: null,
    expected_arrival_date: '',
    notes: '',
    items: [
        { article_id: '', quantity: 1, unit_price: 0 }
    ]
});

const totalAmount = computed(() => {
    return form.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
});

const fetchDependencies = async () => {
    try {
        const [supRes, whRes, artRes] = await Promise.all([
            api.get('/suppliers'),
            api.get('/warehouses'),
            api.get('/articles', { params: { per_page: 500 } })
        ]);
        suppliers.value = supRes.data.data;
        warehouses.value = whRes.data.data;
        articles.value = artRes.data.data;
    } catch (e) {
        console.error('Fetch dependencies failed', e);
    }
};

const fetchOrder = async () => {
    try {
        const response = await api.get(`/purchase-orders/${route.params.id}`);
        const order = response.data;
        form.supplier_id = order.supplier_id;
        form.warehouse_id = order.warehouse_id;
        form.expected_arrival_date = order.expected_arrival_date ? order.expected_arrival_date.substring(0, 10) : '';
        form.notes = order.notes || '';
        form.items = order.items.map(item => ({
            article_id: item.article_id,
            quantity: item.quantity,
            unit_price: item.unit_price
        }));
    } catch (e) {
        console.error('Fetch order failed', e);
    }
};

const addItem = () => {
    form.items.push({ article_id: '', quantity: 1, unit_price: 0 });
};

const removeItem = (index) => {
    if (form.items.length > 1) {
        form.items.splice(index, 1);
    }
};

const articleSelected = (index) => {
    const artId = form.items[index].article_id;
    const art = articles.value.find(a => a.id === artId);
    if(art && art.prix_achat) {
        form.items[index].unit_price = art.prix_achat;
    }
};

const saveOrder = async () => {
    if (form.items.some(i => !i.article_id || i.quantity <= 0)) {
        alert("Veuillez remplir correctement toutes les lignes.");
        return;
    }
    
    saving.value = true;
    try {
        if (isEditing.value) {
            await api.put(`/purchase-orders/${route.params.id}`, form);
        } else {
            await api.post('/purchase-orders', form);
        }
        router.push({ name: 'PurchaseOrderList' });
    } catch (e) {
        console.error('Save failed', e);
        alert('Erreur lors de l\'enregistrement : ' + (e.response?.data?.message || e.message));
    } finally {
        saving.value = false;
    }
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(value);
};

onMounted(() => {
    fetchDependencies();
    if (isEditing.value) fetchOrder();
});
</script>
