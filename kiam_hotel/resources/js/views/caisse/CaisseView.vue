<template>
  <div class="h-full w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
    <div class="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
      <h2 class="text-lg font-bold text-gray-800">Point de Vente (Caisse)</h2>
      <a href="/kiam/public/caisse/" target="_blank" class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
        <span>Ouvrir dans un nouvel onglet</span>
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
      </a>
    </div>
    <div class="flex-1 w-full h-[calc(100vh-12rem)]">
      <iframe 
        src="/kiam/public/caisse/" 
        class="w-full h-full border-0" 
        title="Kiam Caisse"
      ></iframe>
    </div>
  </div>
</template>

<script setup>
// Composant simple pour charger l'application Caisse dans une iframe
</script>
