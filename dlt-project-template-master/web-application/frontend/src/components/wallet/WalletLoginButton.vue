<template>
    <div class="wallet-auth-button">
        <button
            v-if="!isConnected"
            class="btn btn-wallet"
            :class="{ loading: isConnecting }"
            :disabled="isConnecting"
            @click="connect"
        >
            <span v-if="!isConnecting" class="icon">🔐</span>
            <span v-if="isConnecting" class="spinner"></span>
            <span>{{ isConnecting ? $t('Connecting...') : $t('Connect BSV Wallet') }}</span>
        </button>

        <button
            v-else
            class="btn btn-wallet"
            @click="handleWalletLogin"
        >
            <span class="icon">🔐</span>
            <span>{{ $t('Login with BSV Wallet') }}</span>
        </button>

        <div v-if="error" class="wallet-error">
            {{ error }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useWallet } from '@/composables/useWallet';
import { useRouter } from 'vue-router';
import { getApiUrl } from '@/api/utils';

const router = useRouter();
const { wallet, identityKey, isConnected, isConnecting, connect } = useWallet();
const error = ref<string | null>(null);

async function handleWalletLogin() {
    try {
        // First connect to wallet
        if (!isConnected.value) {
            await connect();
            if (!isConnected.value) {
                error.value = 'Failed to connect to BSV Desktop wallet';
                return;
            }
        }
        
        // Get identity key from wallet
        const { publicKey: userIdentityKey } = await wallet.value!.getPublicKey({ identityKey: true });
        console.log('User Identity Key:', userIdentityKey);
        
        // Create a signed request to the backend
        // The backend will use @bsv/auth-express-middleware to verify this
        try {
            const response = await fetch(getApiUrl('/auth/login-wallet'), {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    // For now, send the identity key directly
                    // TODO: Implement proper BRC-103/104 signature
                    'X-Identity-Key': userIdentityKey
                },
                body: JSON.stringify({
                    identityKey: userIdentityKey
                })
            });
            
            if (response.ok) {
                // Try to parse JSON response, fallback if empty
                let result: any = {};
                try {
                    result = await response.json();
                } catch (e) {
                    // Empty response is OK for success
                }
                
                // Set session using AuthController
                if (result.session_id) {
                    // Import AuthController at runtime to set session
                    const { AuthController } = await import('@/control/auth');
                    AuthController.SetSession(result.session_id);
                    // Redirect will happen automatically by AuthController
                } else {
                    // If no session_id in response, there might be an issue
                    error.value = 'Login succeeded but no session received';
                }
            } else {
                let errorMessage = 'Login failed';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Response might not be JSON
                }
                throw new Error(errorMessage);
            }
        } catch (fetchError: any) {
            throw new Error('Login request failed: ' + fetchError.message);
        }
    } catch (err: any) {
        console.error('Wallet login failed:', err);
        error.value = err.message || 'Wallet login failed';
    }
}
</script>

<style scoped>
.wallet-auth-button {
    margin: 1rem 0;
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
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    color: #c33;
    font-size: 0.875rem;
}
</style>
