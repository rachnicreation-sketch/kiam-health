<template>
  <div class="p-20 text-center">
    <h1 class="text-4xl font-bold mb-8 text-kiam-600">Bienvenue sur KIAM</h1>
    <p class="mb-8">Si vous voyez ce message, la page d'accueil fonctionne.</p>
    <router-link :to="{ name: 'Login' }" class="p-3 bg-kiam-600 text-white rounded">
      Aller à la page de connexion
    </router-link>
  </div>
</template>

<script setup>
</script>
