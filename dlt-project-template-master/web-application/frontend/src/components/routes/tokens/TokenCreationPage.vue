<template>
  <div class="page-content">
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-lg-10">
          <div class="page-header mb-5 text-center">
            <h2 class="page-title display-5 fw-bold"><i class="fas fa-plus-circle me-3 text-primary"></i>Create New Token</h2>
            <p class="text-muted lead">Launch your own BRC-92 compliant token on the BSV blockchain.</p>
          </div>

          <div class="row g-5">
            <!-- Form Section -->
            <div class="col-md-7">
              <div class="card shadow-lg border-0 h-100 rounded-3 overflow-hidden">
                <div class="card-header bg-white border-bottom p-4">
                  <h5 class="mb-0 fw-bold">Token Details</h5>
                </div>
                <div class="card-body p-4 p-lg-5">
                  <form @submit.prevent="createToken">
                    <div class="form-floating mb-4">
                      <input 
                        v-model="form.name" 
                        type="text" 
                        class="form-control form-control-lg" 
                        id="tokenName" 
                        placeholder="e.g. My Awesome Token" 
                        required
                      >
                      <label for="tokenName">Token Name</label>
                    </div>

                    <div class="row g-3 mb-4">
                      <div class="col-md-6">
                        <div class="form-floating">
                          <input 
                            v-model="form.symbol" 
                            type="text" 
                            class="form-control" 
                            id="tokenSymbol" 
                            placeholder="e.g. MAT" 
                            maxlength="10" 
                            required
                          >
                          <label for="tokenSymbol">Symbol</label>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="form-floating">
                          <input 
                            v-model.number="form.decimals" 
                            type="number" 
                            class="form-control" 
                            id="tokenDecimals" 
                            placeholder="8" 
                            min="0" 
                            max="18" 
                            required
                          >
                          <label for="tokenDecimals">Decimals</label>
                        </div>
                      </div>
                    </div>

                    <div class="form-floating mb-4">
                      <input 
                        v-model.number="form.maxSupply" 
                        type="number" 
                        class="form-control" 
                        id="maxSupply" 
                        placeholder="1000000" 
                        min="1" 
                        required
                      >
                      <label for="maxSupply">Max Supply</label>
                      <div class="form-text mt-2"><i class="fas fa-info-circle me-1"></i>Maximum number of tokens that can ever exist.</div>
                    </div>

                    <div class="form-floating mb-4">
                      <textarea 
                        v-model="form.description" 
                        class="form-control" 
                        id="description" 
                        placeholder="Describe your token..." 
                        style="height: 120px"
                      ></textarea>
                      <label for="description">Description</label>
                    </div>

                    <div v-if="error" class="alert alert-danger mb-4 d-flex align-items-center">
                      <i class="fas fa-exclamation-circle me-3 fa-lg"></i>
                      <div>{{ error }}</div>
                    </div>
                    
                    <div v-if="success" class="alert alert-success mb-4 border-0 shadow-sm">
                      <div class="d-flex align-items-center mb-2">
                        <i class="fas fa-check-circle me-2 fa-lg text-success"></i>
                        <h6 class="mb-0 fw-bold text-success">Token Created Successfully!</h6>
                      </div>
                      <div class="bg-white p-2 rounded border text-muted small mono text-break">
                        ID: {{ createdTokenId }}
                      </div>
                    </div>

                    <button type="submit" class="btn btn-primary w-100 py-3 fw-bold shadow-sm btn-lg" :disabled="loading">
                      <span v-if="loading">
                        <i class="fas fa-spinner fa-spin me-2"></i> Creating Token...
                      </span>
                      <span v-else>
                        Create Token <i class="fas fa-arrow-right ms-2"></i>
                      </span>
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <!-- Preview Section -->
            <div class="col-md-5">
              <div class="sticky-top" style="top: 2rem; z-index: 1;">
                <h5 class="mb-3 text-muted fw-bold text-uppercase small ls-1">Live Preview</h5>
                <TokenCard :token="previewToken" class="mb-4 shadow-sm" />
                
                <div class="info-card bg-light border-0 rounded-3 p-4">
                  <h6 class="fw-bold mb-3 text-primary"><i class="fas fa-shield-alt me-2"></i>BRC-92 Standard</h6>
                  <ul class="info-list ps-0 mb-0">
                    <li class="mb-3 d-flex">
                      <i class="fas fa-check text-success me-3 mt-1"></i>
                      <span>Tokens are secured directly by the BSV blockchain.</span>
                    </li>
                    <li class="mb-3 d-flex">
                      <i class="fas fa-check text-success me-3 mt-1"></i>
                      <span>You will be the initial owner and issuer.</span>
                    </li>
                    <li class="mb-3 d-flex">
                      <i class="fas fa-check text-success me-3 mt-1"></i>
                      <span>1 satoshi will be used for each token output.</span>
                    </li>
                    <li class="d-flex">
                      <i class="fas fa-check text-success me-3 mt-1"></i>
                      <span>Standard transaction fees apply.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed } from 'vue';
import { useWallet } from '@/composables/useWallet';
import TokenCard from '@/components/tokens/TokenCard.vue';
import { signedFetch } from '@/api/signed-fetch';

export default defineComponent({
  name: 'TokenCreationPage',
  components: { TokenCard },
  setup() {
    const { wallet, isConnected, connect } = useWallet();
    const loading = ref(false);
    const error = ref('');
    const success = ref(false);
    const createdTokenId = ref('');

    const form = reactive({
      name: '',
      symbol: '',
      decimals: 8,
      maxSupply: 1000000,
      description: ''
    });

    const previewToken = computed(() => ({
      id: '0000000000000000000000000000000000000000000000000000000000000000',
      name: form.name || 'Token Name',
      symbol: form.symbol || 'SYM',
      decimals: form.decimals,
      totalSupply: 0,
      balance: 0
    }));

    const createToken = async () => {
      if (!isConnected.value) {
        await connect();
        if (!isConnected.value) {
          error.value = 'Please connect your wallet first';
          return;
        }
      }

      loading.value = true;
      error.value = '';
      success.value = false;

      try {
        // 1. Prepare Genesis Action
        const response = await signedFetch('/api/v1/tokens/create', {
          method: 'POST',
          body: form
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to prepare token creation');
        }


        const { action, name: _, symbol: __, decimals: ___, maxSupply: ____ } = await response.json();
        console.log('Got action from backend:', action);

        // 2. Sign and Broadcast with Wallet
        const result = await wallet.value.createAction(action);
        console.log('Wallet createAction result:', result);

        if (!result.txid) {
          throw new Error('Transaction was not broadcast');
        }

        // Find the genesis output (should be the first output created)
        const vout = 0; // Genesis output is the first one

        const confirmPayload = {
          txid: result.txid,
          vout,
          name: form.name,
          symbol: form.symbol,
          decimals: form.decimals,
          maxSupply: form.maxSupply,
          metadata: form.description ? { description: form.description } : {}
        };
        console.log('Confirming genesis with payload:', confirmPayload);

        // 3. Confirm Genesis with actual txid.vout
        const confirmResponse = await signedFetch('/api/v1/tokens/confirm-genesis', {
          method: 'POST',
          body: confirmPayload
        });

        console.log('Confirm response status:', confirmResponse.status);

        if (!confirmResponse.ok) {
          const errorText = await confirmResponse.text();
          console.error('Confirm genesis failed:', errorText);
          throw new Error('Failed to confirm genesis: ' + errorText);
        }

        const { tokenId } = await confirmResponse.json();
        console.log('Token confirmed! TokenId:', tokenId);

        success.value = true;
        createdTokenId.value = tokenId;
        
        // Reset form partially
        form.name = '';
        form.symbol = '';
        form.description = '';



      } catch (e: any) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    };

    return {
      form,
      loading,
      error,
      success,
      createdTokenId,
      createToken,
      previewToken
    };
  }
});
</script>

<style scoped>
.page-title {
  color: var(--text-color);
}

.ls-1 {
  letter-spacing: 1px;
}

.form-floating > .form-control:focus ~ label,
.form-floating > .form-control:not(:placeholder-shown) ~ label {
  color: var(--primary-color);
  transform: scale(0.85) translateY(-0.5rem) translateX(0.15rem);
}

.form-floating > .form-control {
  border: 1px solid var(--theme-border-color);
  background: var(--input-bg-color);
  color: var(--text-color);
}

.form-floating > .form-control:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.25rem rgba(var(--primary-color-rgb), 0.1);
}

.info-list {
  list-style: none;
}

.mono {
  font-family: 'Roboto Mono', monospace;
}

.btn-lg {
  font-size: 1.1rem;
}
</style>
