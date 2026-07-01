<template>
  <div class="min-h-screen bg-kiam-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop');">
    <div class="absolute inset-0 bg-matiaba bg-opacity-80 backdrop-blur-sm"></div>
    
    <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-2xl relative z-10 transform transition-all hover:scale-[1.01]">
      <div class="flex flex-col items-center">
        <!-- Redirects to Website instead of Vue Home router -->
        <a href="http://localhost/kiam-website/">
          <img src="/kiam/public/images/logo-kiam.png" alt="KIAM Logo" class="h-24 w-auto drop-shadow-lg mb-4 hover:scale-110 transition-transform">
        </a>
        <p class="mt-2 text-center text-sm text-gray-500 font-medium tracking-wide uppercase">
          by MATIABA Firm
        </p>
        <p class="mt-6 text-center text-md text-gray-700">
          Connectez-vous pour accéder à votre espace de gestion d'inventaire et de patrimoine.
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div v-if="errorMessage" class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm animate-pulse" role="alert">
          <p class="text-sm font-medium">{{ errorMessage }}</p>
        </div>
        
        <div class="space-y-4">
          <div class="relative">
            <label for="email-address" class="block text-sm font-semibold text-gray-700 mb-1">Adresse Email</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                </svg>
              </span>
              <input id="email-address" name="email" type="email" autocomplete="email" required v-model="form.email" class="block w-full pl-10 pr-3 py-3 border border-gray-400 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm transition-all shadow-inner hover:border-gray-500" placeholder="Adresse email">
            </div>
          </div>
 
          <div class="relative">
            <label for="password" class="block text-sm font-semibold text-gray-700 mb-1">Mot de passe</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input id="password" name="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" required v-model="form.password" class="block w-full pl-10 pr-12 py-3 border border-gray-400 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-kiam-500 focus:border-kiam-500 sm:text-sm transition-all shadow-inner hover:border-gray-500" placeholder="Mot de passe">
              <button type="button" @click="showPassword = !showPassword" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-kiam-600 transition-colors focus:outline-none">
                <svg v-if="showPassword" class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
                <svg v-else class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input id="remember-me" name="remember-me" type="checkbox" v-model="form.remember" class="h-4 w-4 text-kiam-600 focus:ring-kiam-500 border-gray-300 rounded cursor-pointer transition-all">
            <label for="remember-me" class="ml-2 block text-sm text-gray-700 cursor-pointer hover:text-gray-900 transition-colors">
              Se souvenir de moi
            </label>
          </div>
        </div>

        <div>
          <button type="submit" :disabled="isLoading" class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-kiam-600 hover:bg-kiam-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kiam-500 transition-all duration-200 overflow-hidden shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed">
            <span v-if="isLoading" class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            <span v-else class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg class="h-5 w-5 text-kiam-400 group-hover:text-white transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
              </svg>
            </span>
            {{ isLoading ? 'Connexion en cours...' : 'Se connecter' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../store/auth';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
    email: '',
    password: '',
    remember: false
});

const showPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

onMounted(() => {
    const rememberedEmail = localStorage.getItem('kiam_remembered_email');
    if (rememberedEmail) {
        form.email = rememberedEmail;
        form.remember = true;
    }
});

const handleLogin = async () => {
    isLoading.value = true;
    errorMessage.value = '';
    
    try {
        const result = await authStore.login(form);
        
        if (result.success) {
            router.push({ name: 'Dashboard' });
        } else {
            errorMessage.value = result.message;
        }
    } catch (e) {
        errorMessage.value = 'Une erreur inattendue est survenue.';
    } finally {
        isLoading.value = false;
    }
};
</script>
