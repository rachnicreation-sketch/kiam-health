<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Articles / Patrimoine</h1>
        <p class="text-sm text-gray-500 mt-1">Gérez votre catalogue d'articles, équipements et biens.</p>
      </div>
      <div class="mt-4 sm:mt-0 flex gap-3">
        <button @click="windowPrint" class="px-4 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors flex items-center gap-2">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2m8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimer
        </button>
        <button @click="downloadPDF" class="px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors flex items-center gap-2">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          PDF
        </button>
        <button @click="exportArticles" class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          CSV
        </button>
        <button @click="openCreateModal" class="px-4 py-2 bg-kiam-600 text-white rounded-lg text-sm font-medium hover:bg-kiam-700 transition-colors shadow-sm flex items-center gap-2">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nouvel Article
        </button>
      </div>
    </div>

    <!-- Filters & Search -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
      <div class="w-full md:w-96 relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input v-model="search" @keyup.enter="fetchArticles" type="text" class="block w-full pl-10 pr-3 py-2.5 border border-gray-400 rounded-lg leading-5 bg-white shadow-inner placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm transition-all" placeholder="Rechercher par article, référence, code barre...">
      </div>
      
      <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <!-- Type Filter (Stock vs Assets) -->
        <div class="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
          <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <select v-model="filters.type" @change="fetchArticles" class="text-xs font-bold uppercase tracking-tight text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer">
            <option value="all">Tout Afficher</option>
            <option value="stocks">Articles du Stock</option>
            <option value="assets">Le Patrimoine (Biens)</option>
          </select>
        </div>

        <select v-model="filters.category_id" @change="fetchArticles" class="block w-full md:w-48 pl-3 pr-10 py-2.5 text-base border-gray-400 focus:outline-none focus:ring-2 focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm rounded-lg bg-white shadow-inner transition-all">
          <option value="">Toutes les catégories</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        
        <button @click="fetchArticles" class="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-kiam-600 transition-colors" title="Actualiser">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden relative">
      <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 backdrop-blur-[1px]">
        <svg class="animate-spin h-8 w-8 text-kiam-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Article</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Domaine</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Marque</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fournisseur</th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Qté Stock</th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Valeur Unitaire</th>
              <th scope="col" class="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th scope="col" class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="articles.data.length === 0 && !loading">
              <td colspan="6" class="px-6 py-10 text-center text-gray-500">Aucun article trouvé.</td>
            </tr>
            <tr v-for="item in articles.data" :key="item.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-bold text-gray-900">{{ item.article }}</div>
                    <div class="flex items-center gap-2">
                        <div class="text-[10px] text-gray-400 font-mono">{{ item.category?.name || item.categorie }}</div>
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                        <div class="text-xs text-blue-500 font-mono">{{ item.reference || item.code_barre }}</div>
                        <img :src="`https://bwipjs-api.metafloor.com/?bcid=qrcode&text=${encodeURIComponent(item.article + ' | REF: ' + item.reference)}&scale=1`" class="h-4 w-4 opacity-50 hover:opacity-100 transition-opacity" title="QR Code">
                        <img :src="`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(item.article + ' | REF: ' + item.reference)}&scale=1&height=4`" class="h-3 max-w-[40px] opacity-50 hover:opacity-100 transition-opacity" title="Barcode">
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-xs font-medium text-gray-900">{{ item.domaine_utilisation || '—' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="item.marque" class="text-[10px] px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold uppercase inline-block">{{ item.marque }}</div>
                <div v-else class="text-xs text-gray-400 font-medium"> — </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-xs text-gray-700">{{ item.supplier?.nom || '—' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <div class="text-sm font-bold" :class="getStockColorClass(item)">
                  {{ item.quantite_stock }}
                </div>
                <div v-if="item.stock_minimum > 0" class="text-xs text-gray-400">Min: {{ item.stock_minimum }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                {{ formatCurrency(item.prix_achat) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span :class="getStatusBadgeClass(item.statut)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                  {{ formatStatut(item.statut) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <router-link :to="{ name: 'ArticleDetail', params: { id: item.id } }" class="text-kiam-600 hover:text-kiam-900 mr-3 transition-colors">Détails</router-link>
                <button @click="openEditModal(item)" class="text-blue-600 hover:text-blue-900 mr-3 transition-colors">
                  <svg class="w-5 h-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button @click="deleteArticle(item.id)" class="text-gray-400 hover:text-red-600 transition-colors">
                  <svg class="w-5 h-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination Component -->
      <div v-if="articles.total > 0" class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 flex items-center justify-between">
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Affichage de <span class="font-medium">{{ articles.from }}</span> à <span class="font-medium">{{ articles.to }}</span> sur <span class="font-medium">{{ articles.total }}</span> résultats
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button @click="changePage(articles.current_page - 1)" :disabled="articles.current_page === 1" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-kiam-500 focus:border-kiam-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="sr-only">Précédent</span>
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
              
              <button @click="changePage(articles.current_page + 1)" :disabled="articles.current_page === articles.last_page" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-kiam-500 focus:border-kiam-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="sr-only">Suivant</span>
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Slide-over Modal for New Article -->
    <transition name="slide-over">
      <div v-if="showCreateModal" class="fixed inset-0 overflow-hidden z-50">
        <div class="absolute inset-0 overflow-hidden">
          <div class="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showCreateModal = false"></div>
          <div class="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div class="w-screen max-w-md">
              <div class="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
                <div class="py-6 px-4 bg-kiam-700 sm:px-6">
                  <div class="flex items-center justify-between">
                    <h2 class="text-lg font-bold text-white uppercase tracking-tight">{{ isEdit ? 'Modifier l\'Article' : 'Nouvel Article' }}</h2>
                    <div class="ml-3 h-7 flex items-center">
                      <button @click="showCreateModal = false" class="bg-kiam-700 rounded-md text-kiam-200 hover:text-white focus:outline-none">
                        <span class="sr-only">Fermer</span>
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div class="relative flex-1 py-6 px-4 sm:px-6">
                  <form @submit.prevent="submitForm" class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Dénomination de l'article *</label>
                      <input v-model="form.article" type="text" required class="mt-1 block w-full border-gray-400 rounded-md shadow-inner bg-white focus:ring-2 focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm h-10 px-3 transition-all">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Référence *</label>
                        <input v-model="form.reference" type="text" required class="mt-1 block w-full border-gray-400 rounded-md shadow-inner bg-white focus:ring-2 focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm h-10 px-3 transition-all">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Catégorie *</label>
                        <select v-model="form.category_id" required class="mt-1 block w-full border-gray-400 rounded-md shadow-inner bg-white focus:ring-2 focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm h-10 px-3 transition-all">
                          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                        </select>
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Marque</label>
                        <input v-model="form.marque" type="text" class="mt-1 block w-full border-gray-400 rounded-md shadow-inner bg-white focus:ring-2 focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm h-10 px-3 transition-all">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Fabricant</label>
                        <input v-model="form.fabricant" type="text" class="mt-1 block w-full border-gray-400 rounded-md shadow-inner bg-white focus:ring-2 focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm h-10 px-3 transition-all">
                      </div>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Domaine d'utilisation</label>
                      <input v-model="form.domaine_utilisation" type="text" class="mt-1 block w-full border-gray-400 rounded-md shadow-inner bg-white focus:ring-2 focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm h-10 px-3 transition-all" placeholder="Ex: Maintenance, Administration, Production...">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Prix Achat</label>
                        <input v-model.number="form.prix_achat" type="number" step="0.01" class="mt-1 block w-full border-gray-400 rounded-md shadow-inner bg-white focus:ring-2 focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm h-10 px-3 transition-all">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Quantité Initiale *</label>
                        <input v-model.number="form.quantite_acquise" type="number" required class="mt-1 block w-full border-gray-400 rounded-md shadow-inner bg-white focus:ring-2 focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm h-10 px-3 transition-all">
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Entrepôt</label>
                        <select v-model="form.warehouse_id" @change="fetchEmplacements" class="mt-1 block w-full border-gray-400 rounded-md shadow-inner bg-white focus:ring-2 focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm h-10 px-3 transition-all">
                          <option value="">Sélectionner</option>
                          <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.nom }}</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Emplacement (Slot)</label>
                        <select v-model="form.emplacement_id" class="mt-1 block w-full border-gray-400 rounded-md shadow-inner bg-white focus:ring-2 focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm h-10 px-3 transition-all">
                          <option value="">Sélectionner</option>
                          <option v-for="e in emplacements" :key="e.id" :value="e.id">{{ e.code }}</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Fournisseur</label>
                      <select v-model="form.supplier_id" class="mt-1 block w-full border-gray-400 rounded-md shadow-inner bg-white focus:ring-2 focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm h-10 px-3 transition-all">
                        <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.nom }}</option>
                      </select>
                    </div>

                    <!-- Amortissement Section (PRO) -->
                    <div class="pt-4 border-t border-gray-100">
                      <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Finance & Amortissement</h3>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700">Type Amort.</label>
                          <select v-model="form.type_amortissement" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
                            <option value="">Aucun</option>
                            <option value="lineaire">Linéaire</option>
                            <option value="degressif">Dégressif</option>
                          </select>
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700">Durée (Ans)</label>
                          <input v-model.number="form.duree_amortissement" type="number" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
                        </div>
                      </div>
                    </div>

                    <div class="pt-5 flex justify-end gap-3">
                      <button type="button" @click="showCreateModal = false" class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
                      <button type="submit" class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-kiam-600 hover:bg-kiam-700">Enregistrer</button>
                    </div>
                  </form>
                </div>
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

const articles = ref({ data: [], total: 0, from: 0, to: 0, current_page: 1, last_page: 1 });
const warehouses = ref([]);
const categories = ref([]);
const suppliers = ref([]);
const emplacements = ref([]);
const loading = ref(false);
const showCreateModal = ref(false);
const isEdit = ref(false);
const currentArticleId = ref(null);
const search = ref('');
const filters = reactive({
    category_id: '',
    type: 'all'
});

const form = reactive({
    article: '',
    reference: '',
    code_barre: '',
    marque: '',
    fabricant: '',
    categorie: '',
    category_id: '',
    domaine_utilisation: '',
    date_acquisition: '',
    supplier_id: '',
    prix_achat: '',
    quantite_acquise: 0,
    stock_minimum: 0,
    warehouse_id: '',
    emplacement_id: '',
    type_amortissement: '',
    duree_amortissement: 0,
    valeur_residuelle: 0
});
const formatCurrency = (value) => {
    return value ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(value) : '—';
};

const formatStatut = (statut) => {
    const map = {
        'actif': 'Actif',
        'inactif': 'Inactif',
        'obsolete': 'Obsolète',
        'rebut': 'Au rebus'
    };
    return map[statut] || (statut ? statut.charAt(0).toUpperCase() + statut.slice(1) : 'Actif');
};

const getStatusBadgeClass = (statut) => {
    const defaultColor = 'bg-gray-100 text-gray-800';
    if (!statut || statut === 'actif') return 'bg-green-100 text-green-800';
    if (statut === 'inactif') return 'bg-yellow-100 text-yellow-800';
    return defaultColor;
};

const getStockColorClass = (item) => {
    if (item.quantite_stock <= 0) return 'text-red-500';
    if (item.stock_minimum && item.quantite_stock <= item.stock_minimum) return 'text-orange-500';
    return 'text-green-600';
};

const fetchArticles = async (page = 1) => {
    loading.value = true;
    try {
        const response = await api.get('/articles', {
            params: {
                page,
                search: search.value,
                category_id: filters.category_id,
                type: filters.type
            }
        });
        articles.value = response.data;
    } catch (e) {
        console.error('Error fetching articles', e);
    } finally {
        loading.value = false;
    }
};

const fetchMetadata = async () => {
    try {
        const [wRes, sRes, cRes] = await Promise.all([
            api.get('/warehouses'),
            api.get('/suppliers'),
            api.get('/categories')
        ]);
        warehouses.value = wRes.data.data || wRes.data;
        suppliers.value = sRes.data.data || sRes.data;
        categories.value = cRes.data;
    } catch (e) {
        console.error('Error fetching metadata', e);
    }
};

const openCreateModal = () => {
    isEdit.value = false;
    currentArticleId.value = null;
    // Reset form
    Object.keys(form).forEach(key => form[key] = key === 'statut' ? 'actif' : (typeof form[key] === 'number' ? 0 : ''));
    showCreateModal.value = true;
};

const openEditModal = (item) => {
    isEdit.value = true;
    currentArticleId.value = item.id;
    // Fill form
    form.article = item.article;
    form.reference = item.reference;
    form.code_barre = item.code_barre;
    form.marque = item.marque;
    form.fabricant = item.fabricant;
    form.categorie = item.categorie;
    form.category_id = item.category_id;
    form.domaine_utilisation = item.domaine_utilisation;
    form.date_acquisition = item.date_acquisition;
    form.supplier_id = item.supplier_id;
    form.prix_achat = item.prix_achat;
    form.quantite_acquise = item.quantite_acquise;
    form.stock_minimum = item.stock_minimum;
    form.emplacement_id = item.emplacement_id;
    form.statut = item.statut;
    if (item.warehouse_id) {
        fetchEmplacements();
    }
    showCreateModal.value = true;
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

const submitForm = async () => {
    try {
        if (isEdit.value) {
            await api.put(`/articles/${currentArticleId.value}`, form);
        } else {
            await api.post('/articles', form);
        }
        showCreateModal.value = false;
        fetchArticles();
    } catch (e) {
        alert(isEdit.value ? 'Erreur lors de la modification.' : 'Erreur lors de la création.');
    }
};

const windowPrint = () => {
    window.print();
};

const downloadPDF = () => {
    const token = localStorage.getItem('kiam_token');
    window.open(`/kiam/public/api/reports/patrimoine-pdf?token=${token}`, '_blank');
};

const exportArticles = () => {
    const token = localStorage.getItem('kiam_token');
    window.open(`/kiam/public/api/articles/export?token=${token}`, '_blank');
};

const changePage = (page) => {
    if (page >= 1 && page <= articles.value.last_page) {
        fetchArticles(page);
    }
};

onMounted(() => {
    fetchArticles();
    fetchMetadata();
});
</script>

<style scoped>
.slide-over-enter-active, .slide-over-leave-active {
  transition: all 0.3s ease-out;
}
.slide-over-enter-from, .slide-over-leave-to {
  transform: translateX(100%);
}
</style>
