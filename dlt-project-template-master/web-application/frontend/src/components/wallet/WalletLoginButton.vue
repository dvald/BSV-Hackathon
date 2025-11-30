<template>
    <div class="wallet-auth-button">
        <button
            v-if="!isConnected"
            type="button"
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
            type="button"
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
import { ApiAuth } from '@/api/api-group-auth';
import { ApiDid } from '@/api/api-group-did';
import { Request } from '@asanrom/request-browser';
import { AuthController } from '@/control/auth';

const { wallet, isConnected, isConnecting, connect } = useWallet();
const error = ref<string | null>(null);

function createUserDID(identityKey: string) {
    Request.Do(ApiDid.CreateDID({
        privateKey: identityKey,
        services: []
    })).onSuccess((didResponse) => {
        console.log('DID created successfully:', didResponse.did);
    }).onRequestError((didErr, handleDIDErr) => {
        handleDIDErr(didErr, {
            badRequest: () => {
                console.error('Error creating DID: Bad request');
            },
            serverError: () => {
                console.error('Error creating DID: Server error');
            },
            networkError: () => {
                console.error('Error creating DID: Network error');
            },
        });
    }).onUnexpectedError((didErr) => {
        console.error('Unexpected error creating DID:', didErr);
    });
}

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
        Request.Do(ApiAuth.LoginWithWallet({
            identityKey: userIdentityKey
        })).onSuccess((response) => {
            if (response.session_id) {
                AuthController.SetSession(response.session_id);
                createUserDID(userIdentityKey);
            } else {
                error.value = 'Login succeeded but no session received';
            }
        }).onRequestError((err, handleErr) => {
            handleErr(err, {
                badRequest: () => {
                    error.value = 'Invalid request';
                },
                badRequestNoIdentityKey: () => {
                    error.value = 'No identity key provided';
                },
                forbidden: () => {
                    error.value = 'Access denied';
                },
                forbiddenUserBanned: () => {
                    error.value = 'User is banned';
                },
                serverErrorInternalError: () => {
                    error.value = 'Internal server error';
                },
                serverError: () => {
                    error.value = 'Server error';
                },
                networkError: () => {
                    error.value = 'Could not connect to server';
                },
            });
        }).onUnexpectedError((err) => {
            console.error('Unexpected error:', err);
            error.value = 'Unexpected error: ' + err.message;
        });
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
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: wallet-spin 0.8s linear infinite;
}

@keyframes wallet-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
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
