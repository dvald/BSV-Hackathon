<template>
    <div class="wallet-link-section">
        <h3>{{ $t('BSV Wallet Identity') }}</h3>
        
        <div v-if="!authStatus.walletLinked" class="wallet-not-linked">
            <p class="info-text">
                {{ $t('Link your BSV Wallet to enable wallet-based authentication') }}
            </p>
            
            <button
                v-if="!isConnected"
                class="btn btn-wallet"
                :disabled="isConnecting"
                @click="connect"
            >
                <span v-if="!isConnecting" class="icon">🔗</span>
                <span v-if="isConnecting" class="spinner"></span>
                <span>{{ isConnecting ? $t('Connecting...') : $t('Connect BSV Wallet') }}</span>
            </button>

            <button
                v-else
                class="btn btn-wallet"
                :class="{ loading: busy }"
                :disabled="busy"
                @click="handleLinkWallet"
            >
                <span v-if="!busy" class="icon">🔗</span>
                <span v-if="busy" class="spinner"></span>
                <span>{{ busy ? $t('Linking...') : $t('Link BSV Wallet') }}</span>
            </button>

            <div v-if="error" class="wallet-error">
                {{ error }}
            </div>
            
            <div v-if="success" class="wallet-success">
                {{ $t('Wallet linked successfully!') }}
            </div>
        </div>

        <div v-else class="wallet-linked">
            <div class="linked-info">
                <span class="icon-check">✓</span>
                <div>
                    <p class="linked-title">{{ $t('Wallet Linked') }}</p>
                    <p class="linked-key" :title="authStatus.walletIdentityKey">
                        {{ truncatedKey }}
                    </p>
                </div>
            </div>
            <p class="info-text">
                {{ $t('You can now login using your BSV Wallet') }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWallet } from '@/composables/useWallet';
import { Request } from '@asanrom/request-browser';
import { getUniqueStringId } from '@/utils/unique-id';
import { getApiUrl } from '@/api/utils';

interface Props {
    authStatus: {
        walletLinked: boolean;
        walletProvider: string | null;
        walletIdentityKey: string | null;
    };
}

const props = defineProps<Props>();
const emit = defineEmits<{
    (e: 'linked'): void;
}>();

const { wallet, identityKey, isConnected, isConnecting, connect } = useWallet();

const busy = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

const truncatedKey = computed(() => {
    if (!props.authStatus.walletIdentityKey) return '';
    const key = props.authStatus.walletIdentityKey;
    if (key.length <= 20) return key;
    return `${key.substring(0, 10)}...${key.substring(key.length - 10)}`;
});

async function handleLinkWallet() {
    if (busy.value || isConnecting.value) return;
    
    // First connect wallet if not connected
    if (!isConnected.value) {
        await connect();
        if (!isConnected.value) {
            error.value = 'Failed to connect to BSV Desktop wallet';
            return;
        }
    }
    
    busy.value = true;
    error.value = null;
    success.value = false;

    try {
        // Get identity key from wallet
        const { publicKey: userIdentityKey } = await wallet.value!.getPublicKey({ identityKey: true });
        console.log('Linking wallet with identity key:', userIdentityKey);
        
        // Use Request library like the rest of the app (handles sessions properly)
        const requestId = getUniqueStringId();
        Request.Do({
            method: 'POST',
            url: getApiUrl('/auth/link-wallet'),
            json: {
                identityKey: userIdentityKey
            },
            headers: {
                'X-Identity-Key': userIdentityKey
            }
        }, requestId)
            .onSuccess(() => {
                busy.value = false;
                success.value = true;
                emit('linked');
                
                // Reload page after short delay to refresh auth status
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            })
            .onRequestError((err, handleErr) => {
                busy.value = false;
                handleErr(err, {
                    unauthorized: () => {
                        error.value = 'You must be logged in to link a wallet';
                    },
                    badRequest: () => {
                        error.value = 'Invalid wallet identity key';
                    },
                    forbidden: () => {
                        error.value = 'This wallet is already linked to another account';
                    },
                    default: () => {
                        error.value = 'Failed to link wallet';
                    }
                });
            })
            .onUnexpectedError((err: any) => {
                busy.value = false;
                error.value = err.message || 'Failed to link wallet';
            });
    } catch (err: any) {
        error.value = err.message || 'Failed to link wallet';
        busy.value = false;
    }
}
</script>

<style scoped>
.wallet-link-section {
    padding: 1.5rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 8px;
    background: var(--background-color, #fff);
    margin: 1rem 0;
}

h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: var(--text-color, #333);
}

.info-text {
    color: var(--text-secondary, #666);
    margin-bottom: 1rem;
    font-size: 0.95rem;
}

.btn-wallet {
    width: 100%;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    border: 2px solid #0db7ed;
    background: linear-gradient(135deg, #0db7ed 0%, #0891c1 100%);
    color: white;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
}

.btn-wallet:hover:not(:disabled) {
    background: linear-gradient(135deg, #0891c1 0%, #0db7ed 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(13, 183, 237, 0.3);
}

.btn-wallet:disabled,
.btn-wallet.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

.btn-wallet.loading {
    background: #0891c1;
    cursor: wait;
}

.icon {
    font-size: 1.2rem;
}

.spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.wallet-error {
    margin-top: 1rem;
    padding: 0.75rem;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    color: #c33;
    font-size: 0.875rem;
}

.wallet-success {
    margin-top: 1rem;
    padding: 0.75rem;
    background: #efe;
    border: 1px solid #cfc;
    border-radius: 4px;
    color: #3c3;
    font-size: 0.875rem;
}

.wallet-linked {
    padding: 1rem 0;
}

.linked-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #f0f9ff;
    border-radius: 8px;
    border: 1px solid #bae6fd;
    margin-bottom: 1rem;
}

.icon-check {
    font-size: 2rem;
    color: #0891c1;
}

.linked-title {
    font-weight: 600;
    color: var(--text-color, #333);
    margin: 0 0 0.25rem 0;
}

.linked-key {
    font-family: monospace;
    font-size: 0.875rem;
    color: var(--text-secondary, #666);
    margin: 0;
    word-break: break-all;
}
</style>
