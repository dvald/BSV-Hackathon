<template>
  <div class="page-content">
    <div class="container py-5">
      <div class="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 class="page-title fw-bold"><i class="fas fa-tasks me-3 text-primary"></i>Manage Tokens</h2>
          <p class="text-muted mb-0">View and manage the tokens you have created.</p>
        </div>
        <router-link :to="{ name: 'tokens-create' }" class="btn btn-primary btn-lg shadow-sm">
          <i class="fas fa-plus me-2"></i>Create New Token
        </router-link>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
        <p class="mt-3 text-muted">Loading your tokens...</p>
      </div>

      <div v-else-if="error" class="alert alert-danger d-flex align-items-center shadow-sm">
        <i class="fas fa-exclamation-triangle me-3 fa-lg"></i>
        <div>{{ error }}</div>
      </div>

      <div v-else-if="tokens.length === 0" class="text-center py-5 empty-state rounded-3 border-dashed">
        <div class="mb-4 icon-circle bg-light mx-auto">
          <i class="fas fa-coins fa-3x text-muted opacity-50"></i>
        </div>
        <h4 class="fw-bold text-muted">No Tokens Found</h4>
        <p class="text-muted mb-4">You haven't created any tokens yet. Start by creating your first token!</p>
        <router-link :to="{ name: 'tokens-create' }" class="btn btn-outline-primary px-4">
          Get Started
        </router-link>
      </div>

      <div v-else class="row g-4">
        <div v-for="token in tokens" :key="token.id" class="col-md-6 col-lg-4">
          <TokenCard :token="token" class="h-100 shadow-sm hover-lift">
            <template #actions>
              <div class="d-flex gap-2 w-100 mt-3 pt-3 border-top">
                <button class="btn btn-primary flex-grow-1" @click="openMintModal(token)">
                  <i class="fas fa-print me-2"></i> Mint
                </button>
                <router-link :to="{ name: 'tokens-transfer', query: { tokenId: token.id }}" class="btn btn-light flex-grow-1 border">
                  <i class="fas fa-paper-plane me-2"></i> Transfer
                </router-link>
              </div>
            </template>
          </TokenCard>
        </div>
      </div>
    </div>

    <!-- Mint Modal -->
    <div v-if="showMintModal" class="modal-backdrop fade show"></div>
    <div v-if="showMintModal" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-3">
          <div class="modal-header border-bottom-0 pb-0">
            <h5 class="modal-title fw-bold">Mint {{ selectedToken?.name }}</h5>
            <button type="button" class="btn-close" @click="closeMintModal"></button>
          </div>
          <div class="modal-body p-4">
            <p class="text-muted small mb-4">Mint new tokens to a recipient. This will increase the total supply.</p>
            
            <form @submit.prevent="mintToken">
              <div class="form-floating mb-3">
                <input 
                  v-model="mintForm.recipient" 
                  type="text" 
                  class="form-control" 
                  id="recipient" 
                  placeholder="03..." 
                  required
                >
                <label for="recipient">Recipient Identity Key</label>
              </div>
              <div class="text-end mb-3">
                <a href="#" @click.prevent="useMyIdentity" class="text-decoration-none small"><i class="fas fa-user me-1"></i>Use my identity</a>
              </div>
              
              <div class="form-floating mb-4">
                <input 
                  v-model.number="mintForm.amount" 
                  type="number" 
                  class="form-control" 
                  id="amount" 
                  placeholder="0" 
                  min="1" 
                  required
                >
                <label for="amount">Amount</label>
                <div class="position-absolute top-50 end-0 translate-middle-y me-3 text-muted fw-bold">
                  {{ selectedToken?.symbol }}
                </div>
              </div>

              <div v-if="mintError" class="alert alert-danger small">{{ mintError }}</div>
              <div v-if="mintSuccess" class="alert alert-success small">
                <i class="fas fa-check-circle me-1"></i> Minting successful!
              </div>

              <div class="d-grid gap-2">
                <button type="submit" class="btn btn-primary py-3 fw-bold" :disabled="mintLoading">
                  <i v-if="mintLoading" class="fas fa-spinner fa-spin me-2"></i>
                  {{ mintLoading ? 'Minting Tokens...' : 'Confirm Mint' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, reactive, watch } from 'vue';
import { useWallet } from '@/composables/useWallet';
import TokenCard from '@/components/tokens/TokenCard.vue';
import { signedFetch } from '@/api/signed-fetch';
import { PushDrop, Utils } from '@bsv/sdk';

export default defineComponent({
  name: 'TokenManagementPage',
  components: { TokenCard },
  setup() {
    const { wallet, isConnected } = useWallet();
    const tokens = ref<any[]>([]);
    const loading = ref(true);
    const error = ref('');
    
    // Modal state
    const showMintModal = ref(false);
    const selectedToken = ref<any>(null);
    const mintLoading = ref(false);
    const mintError = ref('');
    const mintSuccess = ref(false);
    
    const mintForm = reactive({
      recipient: '',
      amount: 0
    });

    const loadTokens = async () => {
      loading.value = true;
      try {
        console.log('Loading my tokens...');
        const response = await signedFetch('/api/v1/tokens/my-tokens');
        console.log('My tokens response:', response);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to load my tokens:', errorText);
          throw new Error('Failed to load tokens: ' + errorText);
        }
        const jsonData = await response.json();
        console.log('My tokens data:', jsonData);
        tokens.value = jsonData;
      } catch (e: any) {
        console.error('Error loading tokens:', e);
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    };

    const openMintModal = (token: any) => {
      selectedToken.value = token;
      mintForm.recipient = '';
      mintForm.amount = 0;
      mintError.value = '';
      mintSuccess.value = false;
      showMintModal.value = true;
    };

    const closeMintModal = () => {
      showMintModal.value = false;
      selectedToken.value = null;
    };

    const useMyIdentity = async () => {
        if (wallet.value) {
            const { publicKey } = await wallet.value.getPublicKey({ identityKey: true });
            mintForm.recipient = publicKey;
        }
    };

    const mintToken = async () => {
      if (!wallet.value || !selectedToken.value) return;
      
      mintLoading.value = true;
      mintError.value = '';
      mintSuccess.value = false;
      
      try {
        // Step 1: Get mint data from backend (validation + token info)
        const response = await signedFetch(`/api/v1/tokens/${selectedToken.value.id}/mint`, {
          method: 'POST',
          body: {
            recipientIdentityKey: mintForm.recipient,
            amount: mintForm.amount
          }
        });
        
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to prepare mint');
        }
        
        const { mintData } = await response.json();
        console.log('[mintToken] Mint data:', mintData);
        
        // Step 2: Build the mint transaction using the frontend wallet
        const pushdrop = new PushDrop(wallet.value);
        
        // Helper functions
        const encodeUInt32LE = (value: number): number[] => {
          const bytes = [];
          bytes.push(value & 0xff);
          bytes.push((value >> 8) & 0xff);
          bytes.push((value >> 16) & 0xff);
          bytes.push((value >> 24) & 0xff);
          return bytes;
        };
        
        const encodeScriptNum = (value: number): number[] => {
          if (value === 0) return [];
          const bytes = [];
          const negative = value < 0;
          let abs = Math.abs(value);
          while (abs > 0) {
            bytes.push(abs & 0xff);
            abs >>= 8;
          }
          if (bytes[bytes.length - 1] & 0x80) {
            bytes.push(negative ? 0x80 : 0x00);
          } else if (negative) {
            bytes[bytes.length - 1] |= 0x80;
          }
          return bytes;
        };
        
        // Build PushDrop fields
        const prefixBytes = Utils.toArray('!', 'utf8');
        const txidBytes = Utils.toArray(mintData.token.genesisTxid, 'hex').reverse();
        const voutBytes = encodeUInt32LE(mintData.token.genesisVout);
        const assetIdBytes = [...txidBytes, ...voutBytes];
        const amountBytes = encodeScriptNum(mintData.amount);
        
        // Debug logging for mint
        const assetIdHex = assetIdBytes.map((b: number) => b.toString(16).padStart(2, '0')).join('');
        console.log('[mintToken] Building PushDrop:');
        console.log('  - genesisTxid:', mintData.token.genesisTxid);
        console.log('  - genesisVout:', mintData.token.genesisVout);
        console.log('  - assetIdHex:', assetIdHex);
        console.log('  - amount:', mintData.amount);
        
        // Encrypt metadata
        const metadataStr = JSON.stringify({ name: mintData.token.name, symbol: mintData.token.symbol });
        const { ciphertext } = await wallet.value.encrypt({
          plaintext: Utils.toArray(metadataStr, 'utf8'),
          protocolID: [0, 'token metadata'],
          keyID: mintData.tokenId,
          counterparty: mintData.recipientIdentityKey
        });
        
        // Create locking script
        const lockingScript = await pushdrop.lock(
          [prefixBytes, assetIdBytes, amountBytes, ciphertext],
          [0, 'mandala tokens'],
          mintData.tokenId,
          mintData.recipientIdentityKey
        );
        
        console.log('[mintToken] LockingScript hex:', lockingScript.toHex().substring(0, 100) + '...');
        
        // Step 3: Create the action (no inputs, just outputs)
        const result = await wallet.value.createAction({
          description: `Mint ${mintData.amount} ${mintData.token.symbol}`,
          outputs: [{
            lockingScript: lockingScript.toHex(),
            satoshis: 1,
            basket: 'mandala-tokens',
            outputDescription: `Mint ${mintData.amount} ${mintData.token.symbol}`
          }],
          options: {
            randomizeOutputs: false
          }
        });
        
        console.log('[mintToken] Mint action result:', result);
        console.log('[mintToken] Result txid:', result.txid);
        console.log('[mintToken] Result outputBaskets:', result);
        
        // Verify the output was stored
        const verifyOutputs = await wallet.value.listOutputs({
          basket: 'mandala-tokens',
          include: 'locking scripts',
          limit: 100
        });
        console.log('[mintToken] After mint - outputs in basket:', verifyOutputs.totalOutputs);
        
        // Step 4: Confirm with backend
        const vout = 0; // The minted token output is at index 0
        
        await signedFetch('/api/v1/tokens/confirm-mint', {
          method: 'POST',
          body: {
            tokenId: selectedToken.value.id,
            txid: result.txid,
            vout,
            recipientIdentityKey: mintForm.recipient,
            amount: mintForm.amount
          }
        });
        
        mintSuccess.value = true;
        setTimeout(() => {
            closeMintModal();
            loadTokens();
        }, 1500);
        
      } catch (e: any) {
        console.error('[mintToken] Error:', e);
        mintError.value = e.message;
      } finally {
        mintLoading.value = false;
      }
    };

    onMounted(() => {
      // Don't load immediately, wait for wallet connection
      if (isConnected.value) {
        loadTokens();
      } else {
        loading.value = false;
      }
    });

    // Watch for wallet connection
    watch(isConnected, (connected) => {
      if (connected) {
        loadTokens();
      }
    });


    return {
      tokens,
      loading,
      error,
      showMintModal,
      selectedToken,
      mintForm,
      mintLoading,
      mintError,
      mintSuccess,
      openMintModal,
      closeMintModal,
      mintToken,
      useMyIdentity
    };
  }
});
</script>

<style scoped>
.page-title {
  color: var(--text-color);
}

.border-dashed {
  border: 2px dashed var(--theme-border-color);
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

.modal-content {
  background: var(--modal-bg-color);
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
</style>
