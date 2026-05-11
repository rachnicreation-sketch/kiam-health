<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Mobile Overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/50 z-30 md:hidden"
      @click="sidebarOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      class="fixed md:static inset-y-0 left-0 z-40 w-64 bg-matiaba text-white flex flex-col shadow-xl transition-transform duration-300 md:translate-x-0"
    >
      <div class="h-20 flex items-center justify-center border-b border-blue-800 bg-kiam-900 p-4">
        <img src="/kiam/public/images/logo-kiam.png" alt="KIAM Logo" class="h-12 w-auto">
        <h1 class="text-xl font-bold tracking-wider ml-3">KIAM <span class="text-blue-300 font-normal">WMS</span></h1>
      </div>
      
      <nav class="flex-1 px-4 py-6 space-y-2">
        <router-link :to="{ name: 'Dashboard' }" class="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-blue-800 transition-colors" active-class="bg-blue-800 border-l-4 border-blue-400">
          <svg class="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          <span class="font-medium">Tableau de Bord</span>
        </router-link>
        
        <router-link :to="{ name: 'Articles' }" class="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-blue-800 transition-colors" active-class="bg-blue-800 border-l-4 border-blue-400">
          <svg class="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span class="font-medium">Patrimoine / Articles</span>
        </router-link>

        <router-link :to="{ name: 'Categories' }" class="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-blue-800 transition-colors" active-class="bg-blue-800 border-l-4 border-blue-400">
          <svg class="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span class="font-medium">Catégories</span>
        </router-link>

        <router-link :to="{ name: 'StockOverview' }" class="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-blue-800 transition-colors" active-class="bg-blue-800 border-l-4 border-blue-400">
          <svg class="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span class="font-medium">Vue d'Ensemble Stock</span>
        </router-link>

        <router-link :to="{ name: 'StockMovements' }" class="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-blue-800 transition-colors" active-class="bg-blue-800 border-l-4 border-blue-400">
          <svg class="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span class="font-medium">Mouvements Stock</span>
        </router-link>

        <router-link :to="{ name: 'PurchaseOrders' }" class="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-blue-800 transition-colors" active-class="bg-blue-800 border-l-4 border-blue-400">
          <svg class="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span class="font-medium">Achats / Commandes</span>
        </router-link>

        <router-link :to="{ name: 'Suppliers' }" class="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-blue-800 transition-colors" active-class="bg-blue-800 border-l-4 border-blue-400">
          <svg class="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span class="font-medium">Partenaires / CRM</span>
        </router-link>

        <router-link :to="{ name: 'Reports' }" class="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-blue-800 transition-colors" active-class="bg-blue-800 border-l-4 border-blue-400">
          <svg class="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span class="font-medium">Rapports & Inventaire</span>
        </router-link>

        <router-link :to="{ name: 'Warehouses' }" class="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-blue-800 transition-colors" active-class="bg-blue-800 border-l-4 border-blue-400">
          <svg class="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span class="font-medium">Gestion Entrepôts</span>
        </router-link>

      </nav>

      <!-- User minimal profile at bottom -->
      <div class="h-16 flex items-center justify-between px-4 border-t border-blue-800 bg-kiam-900">
        <div class="flex items-center gap-3 overflow-hidden">
          <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-inner">
            {{ userInitials }}
          </div>
          <div class="flex flex-col truncate">
            <span class="text-sm font-bold truncate">{{ authStore.user?.name || 'User' }}</span>
            <span class="text-xs text-blue-300 truncate">{{ authStore.user?.roles?.[0] || 'Agent' }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content wrapper -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top navbar -->
      <header class="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-6 z-10 relative">
        <div class="flex items-center">
          <button @click="sidebarOpen = !sidebarOpen" class="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none">
            <svg v-if="!sidebarOpen" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
            <svg v-else class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <!-- Current Route Title could go here dynamically -->
        </div>
        
        <div class="flex items-center gap-4">
          <!-- Notification Bell (Intelligence) -->
          <div class="relative group">
            <button class="text-gray-400 hover:text-blue-600 transition-colors relative p-2 rounded-full hover:bg-gray-50 flex items-center justify-center">
              <span v-if="unreadCount > 0" class="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {{ unreadCount > 9 ? '9+' : unreadCount }}
              </span>
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            
            <!-- Notification Dropdown -->
            <div class="absolute right-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div class="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <span class="text-xs font-bold text-gray-800 uppercase tracking-widest">Alertes Récentes</span>
                <button @click="markAllAsRead" class="text-[10px] text-blue-600 hover:text-blue-800 font-bold uppercase">Tout marquer lu</button>
              </div>
              <div class="max-h-96 overflow-y-auto">
                <div v-for="alert in recentAlerts" :key="alert.id" class="p-4 hover:bg-gray-50 border-b border-gray-50 group/item transition-colors">
                   <div class="flex gap-3">
                      <div class="mt-1 h-2 w-2 rounded-full flex-shrink-0" :class="alert.type === 'stock_rupture' ? 'bg-red-500' : 'bg-orange-500'"></div>
                      <div class="flex-1">
                         <p class="text-xs text-gray-800 leading-tight font-medium">{{ alert.message }}</p>
                         <span class="text-[10px] text-gray-400 mt-1 block">{{ formatDate(alert.created_at) }}</span>
                      </div>
                   </div>
                </div>
                <div v-if="recentAlerts.length === 0" class="p-8 text-center text-gray-400 italic text-xs">
                  Aucune alerte non lue
                </div>
              </div>
              <router-link :to="{ name: 'Alerts' }" class="block p-3 text-center text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-kiam-600 transition-colors uppercase border-t border-gray-100">
                Voir toutes les alertes
              </router-link>
            </div>
          </div>
          
          <button @click="logout" class="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-800 bg-red-50 px-3 py-1.5 rounded-md transition-colors">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </div>
      </header>

      <!-- Main Page Content -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../store/auth';
import api from '../../plugins/axios';

const router = useRouter();
const authStore = useAuthStore();

const sidebarOpen = ref(false);
const unreadCount = ref(0);
const recentAlerts = ref([]);
let pollInterval = null;

// Auto-close sidebar on navigation (mobile)
router.afterEach(() => {
    sidebarOpen.value = false;
});

const userInitials = computed(() => {
    const name = authStore.user?.name || 'U';
    return name.substring(0, 2).toUpperCase();
});

const fetchAlerts = async () => {
    try {
        const [countRes, alertsRes] = await Promise.all([
            api.get('/alerts/unread-count'),
            api.get('/alerts', { params: { statut: 'non_lu', limit: 5 } })
        ]);
        unreadCount.value = countRes.data.count;
        recentAlerts.value = alertsRes.data.data;
    } catch (e) {
        console.error('Failed to fetch alerts', e);
    }
};

const markAllAsRead = async () => {
    try {
        await api.post('/alerts/mark-all-read');
        unreadCount.value = 0;
        recentAlerts.value = [];
    } catch (e) {
        console.error('Failed to mark alerts as read', e);
    }
};

const formatDate = (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const logout = async () => {
    await authStore.logout();
    window.location.href = 'http://localhost/kiam-website/';
};

onMounted(() => {
    fetchAlerts();
    pollInterval = setInterval(fetchAlerts, 60000); // Poll every minute
});

onUnmounted(() => {
    if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
