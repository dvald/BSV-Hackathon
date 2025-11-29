import { ref, onMounted, getCurrentInstance } from 'vue';
import { WalletClient } from '@bsv/sdk';

// Shared state to persist connection across components
const wallet = ref<WalletClient | null>(null);
const identityKey = ref<string | null>(null);
const isConnected = ref(false);
const isConnecting = ref(false);

export function useWallet() {
    const connect = async () => {
        if (isConnecting.value || isConnected.value) return;

        isConnecting.value = true;
        console.log("Attempting to connect to wallet...");

        try {
            // Give a small delay for injection if called immediately on load
            await new Promise(r => setTimeout(r, 500));

            const w = new WalletClient();
            console.log("WalletClient instantiated", w);

            // Request identity key to verify connection and get user ID
            const key = await w.getPublicKey({ identityKey: true });
            console.log("PublicKey received", key);

            wallet.value = w;
            identityKey.value = key.publicKey;
            isConnected.value = true;
            console.log('Wallet connected successfully', key.publicKey);
        } catch (error) {
            console.error('Wallet connection error:', error);
            isConnected.value = false;
            wallet.value = null;
            identityKey.value = null;
        } finally {
            isConnecting.value = false;
        }
    };

    if (getCurrentInstance()) {
        onMounted(() => {
            // Auto-connect if not connected
            if (!isConnected.value) {
                connect();
            }
        });
    }

    return {
        wallet,
        identityKey,
        isConnected,
        isConnecting,
        connect
    };
}
