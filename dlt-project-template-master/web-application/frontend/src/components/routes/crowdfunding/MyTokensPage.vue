<template>
    <div class="page-content" tabindex="-1">
        <ComponentLoader v-if="loading"></ComponentLoader>
        
        <div class="tokens-container" v-if="!loading">
            <div class="header-section">
                <h1><i class="fas fa-coins"></i> My Crowdfunding Tokens</h1>
                <p class="subtitle">View and claim your PushDrop tokens</p>
            </div>

            <div v-if="error" class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i>
                {{ error }}
            </div>

            <div v-if="isConnected && tokens.length === 0" class="empty-state">
                <i class="fas fa-wallet" style="font-size: 4rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                <h3>No tokens found</h3>
                <p>Participate in a crowdfunding campaign to earn tokens!</p>
                <router-link to="/crowdfunding" class="btn btn-primary" style="margin-top: 1rem;">
                    <i class="fas fa-hand-holding-usd"></i> Go to Crowdfunding
                </router-link>
            </div>

            <div v-else-if="tokens.length > 0" class="tokens-grid">
                <div class="stats-banner">
                    <div class="stat-item">
                        <div class="stat-value">{{ tokens.length }}</div>
                        <div class="stat-label">Total Tokens</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">{{ totalSatoshis }}</div>
                        <div class="stat-label">Total Value (sats)</div>
                    </div>
                </div>

                <div class="tokens-list">
                    <div v-for="(token, index) in tokens" :key="index" class="token-card">
                        <div class="token-header">
                            <span class="token-number">#{{ index + 1 }}</span>
                            <span class="token-basket">{{ token.basket }}</span>
                        </div>
                        <div class="token-body">
                            <div class="token-info">
                                <div class="token-detail">
                                    <i class="fas fa-database"></i>
                                    <span class="label">Value:</span>
                                    <span class="value">{{ token.satoshis }} sats</span>
                                </div>
                                <div class="token-detail">
                                    <i class="fas fa-tag"></i>
                                    <span class="label">Description:</span>
                                    <span class="value">{{ token.description || 'Crowdfunding token' }}</span>
                                </div>
                                <div class="token-detail">
                                    <i class="fas fa-link"></i>
                                    <span class="label">Transaction:</span>
                                    <a :href="'https://whatsonchain.com/tx/' + token.txid" target="_blank" class="txid-link">
                                        {{ token.txid.substring(0, 8) }}...{{ token.txid.substring(token.txid.length - 8) }}
                                        <i class="fas fa-external-link-alt"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="actions-section">
                <button @click="loadTokens" class="btn btn-secondary" :disabled="loading">
                    <i class="fas fa-sync-alt"></i>
                    {{ loading ? 'Loading...' : 'Refresh Tokens' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from "vue";
import ComponentLoader from "@/components/utils/ComponentLoader.vue";
import { useWallet } from "@/composables/useWallet";
import { PushDrop, LockingScript } from '@bsv/sdk';

export default defineComponent({
    name: "MyTokensPage",
    components: {
        ComponentLoader,
    },
    setup() {
        const loading = ref(true);
        const error = ref("");
        const tokens = ref<any[]>([]);
        const { wallet, isConnected } = useWallet();

        const totalSatoshis = computed(() => {
            return tokens.value.reduce((sum, token) => sum + token.satoshis, 0);
        });

        const loadTokens = async () => {
            if (!isConnected.value || !wallet.value) {
                return;
            }

            loading.value = true;
            error.value = "";
            tokens.value = [];

            try {
                // Try listing from crowdfunding basket first
                const baskets = ['crowdfunding', 'main', 'inbox'];
                
                for (const basket of baskets) {
                    try {
                        const outputs = await wallet.value.listOutputs({
                            basket: basket,
                            include: 'locking scripts'
                        });

                        for (const output of outputs.outputs) {
                            try {
                                if (!output.lockingScript) continue;

                                const script = LockingScript.fromHex(output.lockingScript);
                                const decodedToken = PushDrop.decode(script);

                                let description = "";
                                if (decodedToken.fields && decodedToken.fields.length > 0) {
                                     description = `Token data (${decodedToken.fields[0].length} bytes)`;
                                     try {
                                         const str = new TextDecoder().decode(decodedToken.fields[0]);
                                         if (/^[\x20-\x7E\s]*$/.test(str)) {
                                             description = str;
                                         }
                                     } catch (e) {}
                                }

                                tokens.value.push({
                                    txid: output.outpoint.split('.')[0],
                                    vout: parseInt(output.outpoint.split('.')[1]),
                                    satoshis: output.satoshis,
                                    description: description,
                                    basket: basket,
                                    lockingScript: output.lockingScript
                                });
                            } catch (e) {
                                // Not a valid pushdrop token
                            }
                        }
                    } catch (e) {
                        console.warn(`Failed to list outputs for basket ${basket}:`, e);
                    }
                }

            } catch (e: any) {
                console.error("Error loading tokens:", e);
                error.value = "Failed to load tokens: " + e.message;
            } finally {
                loading.value = false;
            }
        };

        onMounted(() => {
            if (isConnected.value) {
                loadTokens();
            } else {
                loading.value = false;
            }
        });

        return{
            loading,
            error,
            tokens,
            isConnected,
            loadTokens,
            totalSatoshis
        };
    }
});
</script>

<style scoped>
.tokens-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
}

.header-section {
    text-align: center;
    margin-bottom: 3rem;
}

.header-section h1 {
    color: var(--text-color);
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
}

.header-section .subtitle {
    color: #666;
    font-size: 1.1rem;
}

.alert {
    padding: 1rem 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.alert-error {
    background: var(--bg-color-hard);
    color: #dc2626;
    border: 2px solid #dc2626;
}

.empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: var(--bg-color-hard);
    border-radius: 12px;
    border: 2px dashed var(--theme-border-color);
}

.empty-state h3 {
    color: var(--text-color);
    margin-bottom: 0.5rem;
}

.empty-state p {
    color: #666;
    margin-bottom: 1.5rem;
}

.stats-banner {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-item {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 1.5rem;
    border-radius: 12px;
    text-align: center;
    color: white;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-value {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.stat-label {
    font-size: 0.9rem;
    opacity: 0.9;
}

.tokens-list {
    display: grid;
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.token-card {
    background: var(--bg-color-hard);
    border: 2px solid var(--theme-border-color);
    border-radius: 12px;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
}

.token-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.token-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
}

.token-number {
    font-weight: bold;
    font-size: 1.1rem;
}

.token-basket {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.token-body {
    padding: 1.5rem;
}

.token-info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.token-detail {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--text-color);
}

.token-detail i {
    color: #667eea;
    width: 20px;
    text-align: center;
}

.token-detail .label {
    font-weight: 600;
    min-width: 100px;
}

.token-detail .value {
    color: #666;
}

.txid-link {
    color: #667eea;
    text-decoration: none;
    font-family: monospace;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: color 0.2s;
}

.txid-link:hover {
    color: #764ba2;
    text-decoration: underline;
}

.actions-section {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 2rem;
}

.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
    text-decoration: none;
    font-size: 1rem;
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
    background: var(--bg-color-hard);
    color: var(--text-color);
    border: 2px solid var(--theme-border-color);
}

.btn-secondary:hover:not(:disabled) {
    background: var(--theme-border-color);
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
