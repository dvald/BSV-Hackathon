<template>
  <div class="page-content">
    <div class="container py-5">
      <div class="text-center mb-5">
        <h2 class="page-title display-5 fw-bold mb-3"><i class="fas fa-search me-3 text-primary"></i>Token Explorer</h2>
        <p class="text-muted lead max-w-600 mx-auto">
          Discover and track tokens created on this platform.
        </p>
        <div class="d-inline-block bg-light px-3 py-2 rounded-pill mt-2 border">
          <small class="text-muted"><i class="fas fa-info-circle me-2 text-primary"></i>Listing only tokens managed by this application overlay.</small>
        </div>
      </div>
      
      <!-- Search & Filter -->
      <div class="row justify-content-center mb-5">
        <div class="col-md-8 col-lg-6">
          <div class="search-box position-relative">
            <i class="fas fa-search search-icon position-absolute text-muted fa-lg"></i>
            <input 
              v-model="searchQuery" 
              type="text" 
              class="form-control form-control-lg ps-5 shadow-sm border-0 py-3" 
              placeholder="Search by name, symbol, or ID..."
            >
          </div>
        </div>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
        <p class="mt-3 text-muted">Loading tokens...</p>
      </div>
      
      <div v-else-if="error" class="alert alert-danger text-center shadow-sm d-inline-block mx-auto">
        <i class="fas fa-exclamation-triangle me-2"></i>{{ error }}
      </div>
      
      <div v-else-if="filteredTokens.length === 0" class="text-center py-5">
        <div class="mb-4 icon-circle bg-light mx-auto">
          <i class="fas fa-search fa-3x text-muted opacity-50"></i>
        </div>
        <h4 class="fw-bold text-muted">No Tokens Found</h4>
        <p class="text-muted">We couldn't find any tokens matching your search.</p>
      </div>
      
      <div v-else class="row g-4">
        <div v-for="token in filteredTokens" :key="token.id" class="col-md-6 col-lg-4">
          <TokenCard :token="token" class="h-100 shadow-sm hover-lift">
            <template #actions>
               <div class="w-100 pt-3 border-top mt-3 bg-light rounded-bottom px-3 pb-2 mx-n3 mb-n3">
                 <div class="d-flex justify-content-between align-items-center">
                   <span class="text-muted small fw-bold text-uppercase ls-1">Issuer</span>
                   <span class="mono bg-white px-2 py-1 rounded border small text-muted" :title="token.creatorIdentityKey">
                     <i class="fas fa-user-circle me-1"></i>{{ formatId(token.creatorIdentityKey) }}
                   </span>
                 </div>
               </div>
            </template>
          </TokenCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import TokenCard from '@/components/tokens/TokenCard.vue';
import { getApiUrl } from '@/api/utils';

export default defineComponent({
  name: 'TokenExplorerPage',
  components: { TokenCard },
  setup() {
    const tokens = ref<any[]>([]);
    const loading = ref(true);
    const error = ref('');
    const searchQuery = ref('');

    const loadTokens = async () => {
      loading.value = true;
      try {
        const response = await fetch(getApiUrl('/api/v1/tokens/all'));
        if (!response.ok) throw new Error('Failed to load tokens');
        const data = await response.json();
        tokens.value = data.tokens;
      } catch (e: any) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    };

    const filteredTokens = computed(() => {
      if (!searchQuery.value) return tokens.value;
      const query = searchQuery.value.toLowerCase();
      return tokens.value.filter(t => 
        t.name.toLowerCase().includes(query) || 
        t.symbol.toLowerCase().includes(query) || 
        t.id.toLowerCase().includes(query)
      );
    });

    const formatId = (id: string) => {
        if (!id) return '';
        return id.substring(0, 6) + '...' + id.substring(id.length - 6);
    };

    onMounted(loadTokens);

    return {
      tokens,
      loading,
      error,
      searchQuery,
      filteredTokens,
      formatId
    };
  }
});
</script>

<style scoped>
.page-title {
  color: var(--text-color);
}

.max-w-600 {
  max-width: 600px;
}

.search-icon {
  left: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 5;
}

.form-control-lg {
  border-radius: 50px;
  padding-left: 3.5rem !important;
  background: var(--input-bg-color);
  color: var(--text-color);
  border: 1px solid var(--theme-border-color);
}

.form-control-lg:focus {
  box-shadow: 0 0.5rem 1rem rgba(var(--primary-color-rgb), 0.15) !important;
  border-color: var(--primary-color);
}

.icon-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
}

.ls-1 {
  letter-spacing: 1px;
}

.mono {
  font-family: 'Roboto Mono', monospace;
}

.mx-n3 {
  margin-left: -1rem;
  margin-right: -1rem;
}

.mb-n3 {
  margin-bottom: -1rem;
}
</style>
