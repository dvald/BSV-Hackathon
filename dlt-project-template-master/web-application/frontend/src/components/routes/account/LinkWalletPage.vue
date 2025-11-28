<template>
    <div class="page-container">
        <h2>{{ $t('BSV Wallet Identity') }}</h2>
        
        <WalletLinkSection 
            :authStatus="walletStatus"
            @linked="onWalletLinked"
        />
        
        <div class="info-section">
            <h3>{{ $t('About BSV Wallet Authentication') }}</h3>
            <p>{{ $t('Link your BSV Desktop or Metanet Desktop wallet to enable password-less login using your wallet identity.') }}</p>
            <ul>
                <li>{{ $t('Your private keys remain in your wallet - we never see them') }}</li>
                <li>{{ $t('Login using cryptographic signatures instead of passwords') }}</li>
                <li>{{ $t('One wallet can only be linked to one account') }}</li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import WalletLinkSection from '@/components/wallet/WalletLinkSection.vue';
import { AuthController } from '@/control/auth';

const walletStatus = ref({
    walletLinked: false,
    walletProvider: null as string | null,
    walletIdentityKey: null as string | null,
});

onMounted(() => {
    loadWalletStatus();
});

function loadWalletStatus() {
    // Check if user is authenticated
    if (!AuthController.isAuthenticated()) {
        return;
    }
    
    // Debug: Log current AuthController values
    console.log('AuthController.WalletIdentityKey:', AuthController.WalletIdentityKey);
    console.log('AuthController.WalletProvider:', AuthController.WalletProvider);
    
    // Get wallet status from AuthController (now populated from backend)
    walletStatus.value = {
        walletLinked: !!AuthController.WalletIdentityKey,
        walletProvider: AuthController.WalletProvider || null,
        walletIdentityKey: AuthController.WalletIdentityKey || null,
    };
    
    console.log('walletStatus.value:', walletStatus.value);
}

function onWalletLinked() {
    // Refresh wallet status after linking
    loadWalletStatus();
}
</script>

<style scoped>
.page-container {
    padding: 1.5rem;
    max-width: 800px;
}

h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: var(--text-color, #333);
}

.info-section {
    margin-top: 2rem;
    padding: 1.5rem;
    background: var(--background-secondary, #f9f9f9);
    border-radius: 8px;
}

.info-section h3 {
    margin-top: 0;
    color: var(--text-color, #333);
}

.info-section p {
    color: var(--text-secondary, #666);
    line-height: 1.6;
}

.info-section ul {
    color: var(--text-secondary, #666);
    line-height: 1.8;
}

.info-section li {
    margin: 0.5rem 0;
}
</style>
