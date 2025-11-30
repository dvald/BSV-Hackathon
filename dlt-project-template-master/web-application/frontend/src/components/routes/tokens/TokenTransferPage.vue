<template>
  <div class="page-content">
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="text-center mb-5">
            <h2 class="page-title fw-bold"><i class="fas fa-paper-plane me-3 text-primary"></i>Transfer Tokens</h2>
            <p class="text-muted lead">Send tokens securely to another user.</p>
          </div>

          <div class="card shadow-lg border-0 rounded-3 overflow-hidden">
            <div class="card-header bg-white border-bottom p-4">
              <h5 class="mb-0 fw-bold">Transfer Details</h5>
            </div>
            <div class="card-body p-4 p-lg-5">
              <div v-if="loadingTokens" class="text-center py-5">
                <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
                <p class="mt-3 text-muted">Loading your tokens...</p>
              </div>
              
              <form v-else @submit.prevent="transferToken">
                <!-- Step 1: Select Token -->
                <div class="form-floating mb-4">
                  <select v-model="selectedTokenId" class="form-select form-select-lg" id="tokenSelect" required>
                    <option value="" disabled>Choose a token...</option>
                    <option v-for="token in tokens" :key="token.id" :value="token.id">
                      {{ token.name }} ({{ token.symbol }})
                    </option>
                  </select>
                  <label for="tokenSelect">Select Token</label>
                </div>

                <div v-if="selectedToken" class="alert alert-info d-flex justify-content-between align-items-center mb-4 shadow-sm border-0 bg-light-primary">
                  <span class="small text-primary fw-bold"><i class="fas fa-wallet me-2"></i>Available Balance</span>
                  <span class="fs-5 fw-bold text-primary">{{ formatAmount(selectedToken.balance, selectedToken.decimals) }} {{ selectedToken.symbol }}</span>
                </div>
                
                <!-- Step 2: Recipient -->
                <div class="form-floating mb-4">
                  <input 
                    v-model="form.recipient" 
                    type="text" 
                    class="form-control form-control-lg" 
                    id="recipient" 
                    placeholder="03..." 
                    required
                  >
                  <label for="recipient">Recipient Identity Key</label>
                  <div class="form-text mt-2"><i class="fas fa-info-circle me-1"></i>Enter the recipient's public identity key.</div>
                </div>
                
                <!-- Step 3: Amount -->
                <div class="form-floating mb-4">
                  <input 
                    v-model.number="form.amount" 
                    type="number" 
                    class="form-control form-control-lg" 
                    id="amount" 
                    placeholder="0" 
                    min="1" 
                    :max="selectedToken ? selectedToken.balance : undefined"
                    required
                  >
                  <label for="amount">Amount</label>
                  <div class="position-absolute top-50 end-0 translate-middle-y me-3 text-muted fw-bold" v-if="selectedToken">
                    {{ selectedToken.symbol }}
                  </div>
                </div>

                <div v-if="error" class="alert alert-danger mb-4 d-flex align-items-center shadow-sm">
                  <i class="fas fa-exclamation-circle me-3 fa-lg"></i>
                  <div>{{ error }}</div>
                </div>
                
                <div v-if="success" class="alert alert-success mb-4 shadow-sm border-0">
                  <div class="d-flex align-items-center">
                    <i class="fas fa-check-circle me-2 fa-lg text-success"></i>
                    <h6 class="mb-0 fw-bold text-success">Transfer Successful!</h6>
                  </div>
                </div>
                
                <button type="submit" class="btn btn-primary w-100 py-3 fw-bold btn-lg shadow-sm" :disabled="loading || !selectedTokenId">
                  <span v-if="loading">
                    <i class="fas fa-spinner fa-spin me-2"></i> Processing Transfer...
                  </span>
                  <span v-else>
                    Confirm Transfer <i class="fas fa-arrow-right ms-2"></i>
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, reactive, computed, watch } from 'vue';
import { useWallet } from '@/composables/useWallet';
import { useRoute } from 'vue-router';
import { signedFetch } from '@/api/signed-fetch';

export default defineComponent({
  name: 'TokenTransferPage',
  setup() {
    const { wallet, isConnected } = useWallet();
    const route = useRoute();
    const tokens = ref<any[]>([]);
    const loadingTokens = ref(true);
    const selectedTokenId = ref('');
    const loading = ref(false);
    const error = ref('');
    const success = ref(false);
    
    const form = reactive({
      recipient: '',
      amount: 0
    });

    const selectedToken = computed(() => {
        return tokens.value.find(t => t.id === selectedTokenId.value);
    });

    const loadTokens = async () => {
      if (!isConnected.value) return;
      loadingTokens.value = true;
      try {
        const response = await signedFetch('/api/v1/tokens/my-balances');
        if (!response.ok) throw new Error('Failed to load tokens');
        tokens.value = await response.json();
        
        // Pre-select token if passed in query
        if (route.query.tokenId) {
            const exists = tokens.value.find(t => t.id === route.query.tokenId);
            if (exists) {
                selectedTokenId.value = exists.id;
            }
        }
      } catch (e: any) {
        console.error(e);
      } finally {
        loadingTokens.value = false;
      }
    };

    const formatAmount = (amount: number, decimals: number) => {
      if (!amount) return '0';
      return (amount / Math.pow(10, decimals)).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
      });
    };

    const transferToken = async () => {
      if (!wallet.value || !selectedTokenId.value || !selectedToken.value) return;
      
      loading.value = true;
      error.value = '';
      success.value = false;
      
      try {
        const tokenId = selectedTokenId.value;
        const token = selectedToken.value;
        const amount = form.amount;
        const recipientIdentityKey = form.recipient;
        
        console.log('[transferToken] Starting transfer:', { tokenId, amount, recipientIdentityKey });
        
        // Simple approach: Let the backend handle the transfer
        const response = await signedFetch(`/api/v1/tokens/${tokenId}/execute-transfer`, {
          method: 'POST',
          body: {
            recipientIdentityKey,
            amount
          }
        });
        
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Transfer failed');
        }
        
        const result = await response.json();
        console.log('[transferToken] Transfer result:', result);
        
        success.value = true;
        form.recipient = '';
        form.amount = 0;
        loadTokens();
        
      } catch (e: any) {
        console.error('[transferToken] Error:', e);
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    };

    onMounted(loadTokens);

    return {
      tokens,
      loadingTokens,
      selectedTokenId,
      selectedToken,
      form,
      loading,
      error,
      success,
      transferToken,
      formatAmount
    };
  }
});
</script>

<style scoped>
.page-title {
  color: var(--text-color);
}

.bg-light-primary {
  background-color: rgba(var(--primary-color-rgb), 0.05) !important;
}

.form-floating > .form-control,
.form-floating > .form-select {
  border: 1px solid var(--theme-border-color);
  background: var(--input-bg-color);
  color: var(--text-color);
}

.form-floating > .form-control:focus,
.form-floating > .form-select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.25rem rgba(var(--primary-color-rgb), 0.1);
}
</style>
