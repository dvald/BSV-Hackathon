<template>
    <ModalDialogContainer ref="modalContainer" v-model:display="displayStatus" :static="isProcessing">
        <div class="modal-dialog modal-md buy-credits-modal" role="document" @click="stopPropagationEvent">
            <!-- Header -->
            <div class="modal-header">
                <div class="modal-title">
                    <i class="mdi mdi-ticket-confirmation" aria-hidden="true"></i>
                    {{ $t("Buy Service Credits") }}
                </div>
                <button 
                    type="button" 
                    class="modal-close-btn" 
                    :title="$t('Close')" 
                    @click="close"
                    :disabled="isProcessing"
                >
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Body: Select Amount -->
            <div v-if="state === 'select'" class="modal-body">
                <div class="credits-info">
                    <div class="current-balance">
                        <span class="balance-label">{{ $t("Your current balance") }}:</span>
                        <span class="balance-value">{{ currentBalance }} {{ $t("tokens") }}</span>
                    </div>

                    <div class="package-grid">
                        <div 
                            v-for="pkg in packages" 
                            :key="pkg.tokens"
                            class="package-card"
                            :class="{ selected: selectedPackage === pkg }"
                            @click="selectedPackage = pkg"
                        >
                            <div class="package-tokens">{{ pkg.tokens }}</div>
                            <div class="package-label">{{ $t("tokens") }}</div>
                            <div class="package-price">
                                <i class="mdi mdi-bitcoin" aria-hidden="true"></i>
                                {{ pkg.sats }} sats
                            </div>
                            <div class="package-bonus" v-if="pkg.bonus">
                                +{{ pkg.bonus }} {{ $t("bonus!") }}
                            </div>
                        </div>
                    </div>

                    <!-- Payment Method -->
                    <div class="payment-method-section">
                        <label class="method-label">{{ $t("Payment method") }}:</label>
                        <div class="method-tabs">
                            <button 
                                type="button"
                                class="method-btn"
                                :class="{ active: paymentMethod === 'txid' }"
                                @click="paymentMethod = 'txid'"
                            >
                                <i class="mdi mdi-form-textbox" aria-hidden="true"></i>
                                TXID
                            </button>
                            <button 
                                type="button"
                                class="method-btn"
                                :class="{ active: paymentMethod === 'wallet' }"
                                @click="paymentMethod = 'wallet'"
                            >
                                <i class="mdi mdi-wallet" aria-hidden="true"></i>
                                Wallet
                            </button>
                        </div>
                    </div>

                    <!-- TXID Payment Section -->
                    <div v-if="paymentMethod === 'txid'" class="txid-section">
                        <div class="payment-address">
                            <label>{{ $t("Send BSV to") }}:</label>
                            <div class="address-box">
                                <code>{{ backendAddress || $t("Loading...") }}</code>
                                <button type="button" class="btn-copy" @click="copyAddress">
                                    <i class="mdi" :class="addressCopied ? 'mdi-check' : 'mdi-content-copy'" aria-hidden="true"></i>
                                </button>
                            </div>
                            <a 
                                v-if="backendAddress && selectedPackage"
                                :href="'bitcoin:' + backendAddress + '?amount=' + (selectedPackage.sats / 100000000)" 
                                class="btn-open-wallet"
                                target="_blank"
                            >
                                <i class="mdi mdi-open-in-new" aria-hidden="true"></i>
                                {{ $t("Open BSV Wallet") }}
                            </a>
                        </div>
                        <div class="txid-input-group">
                            <label>{{ $t("Transaction ID (TXID)") }}:</label>
                            <input 
                                v-model="txid" 
                                type="text" 
                                class="txid-input"
                                :placeholder="$t('Paste your TXID here...')"
                            />
                        </div>
                        <button 
                            type="button"
                            class="btn btn-buy"
                            :disabled="txid.length < 64"
                            @click="buyWithTxid"
                        >
                            <i class="mdi mdi-cart" aria-hidden="true"></i>
                            {{ $t("Buy") }} {{ totalTokens }} {{ $t("Credits") }}
                        </button>
                    </div>

                    <!-- Wallet Payment Section -->
                    <div v-if="paymentMethod === 'wallet'" class="wallet-section">
                        <div class="wallet-info">
                            <div class="wallet-status" :class="{ connected: isConnected }">
                                <i class="mdi" :class="isConnected ? 'mdi-check-circle' : 'mdi-alert-circle'" aria-hidden="true"></i>
                                <span v-if="isConnected">{{ $t("Wallet Connected") }}</span>
                                <span v-else>{{ $t("Wallet Not Connected") }}</span>
                            </div>
                            <button 
                                v-if="!isConnected"
                                type="button"
                                class="btn btn-connect"
                                @click="connectWallet"
                                :disabled="isConnecting"
                            >
                                <i class="mdi mdi-wallet" aria-hidden="true"></i>
                                {{ isConnecting ? $t("Connecting...") : $t("Connect Wallet") }}
                            </button>
                        </div>
                        <div class="payment-summary">
                            <div class="summary-row">
                                <span>{{ $t("You pay") }}:</span>
                                <strong>{{ selectedPackage?.sats || 0 }} sats</strong>
                            </div>
                            <div class="summary-row">
                                <span>{{ $t("You receive") }}:</span>
                                <strong>{{ totalTokens }} {{ $t("tokens") }}</strong>
                            </div>
                        </div>
                        <button 
                            type="button"
                            class="btn btn-buy"
                            :disabled="!isConnected || !selectedPackage"
                            @click="buyWithWallet"
                        >
                            <i class="mdi mdi-flash" aria-hidden="true"></i>
                            {{ $t("Pay with Wallet") }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Body: Wallet Prompt -->
            <div v-if="state === 'wallet-prompt'" class="modal-body wallet-prompt-state">
                <div class="wallet-prompt-content">
                    <i class="mdi mdi-wallet wallet-icon pulse" aria-hidden="true"></i>
                    <h3>{{ $t("Confirm in your BSV Wallet") }}</h3>
                    <p>{{ $t("Please sign the transaction in your wallet application...") }}</p>
                    <div class="payment-preview">
                        <span class="amount">{{ selectedPackage?.sats || 0 }} sats</span>
                        <i class="mdi mdi-arrow-right" aria-hidden="true"></i>
                        <span class="tokens">{{ totalTokens }} tokens</span>
                    </div>
                    <button type="button" class="btn btn-cancel" @click="cancelPayment">
                        {{ $t("Cancel") }}
                    </button>
                </div>
            </div>

            <!-- Body: Processing -->
            <div v-if="state === 'processing'" class="modal-body processing-state">
                <i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i>
                <span>{{ $t("Processing purchase...") }}</span>
            </div>

            <!-- Body: Success -->
            <div v-if="state === 'success'" class="modal-body success-state">
                <div class="success-content">
                    <i class="mdi mdi-check-circle success-icon" aria-hidden="true"></i>
                    <h2>{{ $t("Credits Purchased!") }}</h2>
                    <div class="purchased-amount">
                        <span class="amount">+{{ purchasedTokens }}</span>
                        <span class="label">{{ $t("tokens") }}</span>
                    </div>
                    <div class="new-balance">
                        {{ $t("New balance") }}: <strong>{{ newBalance }}</strong> {{ $t("tokens") }}
                    </div>
                    <button type="button" class="btn btn-done" @click="close">
                        {{ $t("Done") }}
                    </button>
                </div>
            </div>

            <!-- Body: Error -->
            <div v-if="state === 'error'" class="modal-body error-state">
                <i class="mdi mdi-alert-circle error-icon" aria-hidden="true"></i>
                <h3>{{ $t("Purchase Failed") }}</h3>
                <p>{{ errorMessage }}</p>
                <button type="button" class="btn btn-retry" @click="state = 'select'">
                    {{ $t("Try Again") }}
                </button>
            </div>
        </div>
    </ModalDialogContainer>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from "vue";
import { useVModel } from "../../utils/v-model";
import { useWallet } from "@/composables/useWallet";
import { getApiUrl } from "@/api/utils";
import { P2PKH, PublicKey, Utils, WalletProtocol } from "@bsv/sdk";

// BRC-29 Protocol ID for payment derivation
const BRC29_PROTOCOL_ID: WalletProtocol = [2, '3241645161d8'];

interface Package {
    tokens: number;
    sats: number;
    bonus?: number;
}

type ModalState = 'select' | 'wallet-prompt' | 'processing' | 'success' | 'error';

export default defineComponent({
    name: "BuyCreditsModal",
    emits: ["update:display", "purchase-success"],
    props: {
        display: {
            type: Boolean,
            default: false
        },
        currentBalance: {
            type: Number,
            default: 0
        }
    },
    setup(props, { emit }) {
        const displayStatus = useVModel(props, "display");
        const state = ref<ModalState>('select');
        const isProcessing = ref(false);
        const errorMessage = ref('');
        
        // Wallet integration
        const { wallet, identityKey, isConnected, isConnecting, connect } = useWallet();
        const backendIdentityKey = ref<string | null>(null);
        
        // Packages
        const packages = ref<Package[]>([
            { tokens: 50, sats: 100 },
            { tokens: 100, sats: 180, bonus: 10 },
            { tokens: 200, sats: 320, bonus: 40 }
        ]);
        const selectedPackage = ref<Package | null>(packages.value[0]);
        
        // Total tokens including bonus
        const totalTokens = computed(() => {
            if (!selectedPackage.value) return 0;
            return selectedPackage.value.tokens + (selectedPackage.value.bonus || 0);
        });
        
        // Payment
        const paymentMethod = ref<'txid' | 'wallet'>('txid');
        const txid = ref('');
        const backendAddress = ref('');
        const addressCopied = ref(false);
        
        // Results
        const purchasedTokens = ref(0);
        const newBalance = ref(0);
        
        // Fetch backend address
        const fetchBackendAddress = async () => {
            try {
                const response = await fetch(getApiUrl('/api/v1/gamification/payment-address'));
                if (response.ok) {
                    const data = await response.json();
                    backendAddress.value = data.address;
                }
            } catch (error) {
                console.error('Error fetching address:', error);
            }
        };

        // Fetch backend identity key
        const fetchBackendIdentityKey = async () => {
            try {
                const response = await fetch(getApiUrl('/api/v1/bsv/wallet-info'));
                if (response.ok) {
                    const data = await response.json();
                    backendIdentityKey.value = data.identityKey;
                }
            } catch (error) {
                console.error('Error fetching backend identity key:', error);
            }
        };
        
        // Copy address
        const copyAddress = async () => {
            if (backendAddress.value) {
                await navigator.clipboard.writeText(backendAddress.value);
                addressCopied.value = true;
                setTimeout(() => { addressCopied.value = false; }, 2000);
            }
        };

        const connectWallet = async () => {
            await connect();
        };
        
        // Buy with TXID (manual payment)
        const buyWithTxid = async () => {
            if (!selectedPackage.value || txid.value.length < 64) return;
            
            state.value = 'processing';
            isProcessing.value = true;
            
            try {
                const userKey = identityKey.value;
                if (!userKey) throw new Error('User identity not available');
                
                const response = await fetch(getApiUrl('/api/v1/tokens/economy/buy-credits'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-bsv-identity-key': userKey
                    },
                    body: JSON.stringify({
                        txid: txid.value,
                        tokensRequested: totalTokens.value,
                        satsPaid: selectedPackage.value.sats
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || data.error || 'Purchase failed');
                }
                
                purchasedTokens.value = totalTokens.value;
                newBalance.value = data.balance || (props.currentBalance + purchasedTokens.value);
                
                state.value = 'success';
                emit('purchase-success', { tokens: purchasedTokens.value, balance: newBalance.value });
                
            } catch (error: any) {
                console.error('Purchase error:', error);
                errorMessage.value = error.message;
                state.value = 'error';
            } finally {
                isProcessing.value = false;
            }
        };

        // Buy with Wallet (x402 flow)
        const buyWithWallet = async () => {
            if (!wallet.value || !isConnected.value || !selectedPackage.value) {
                errorMessage.value = 'Please connect your BSV wallet first';
                state.value = 'error';
                return;
            }

            state.value = 'processing';
            isProcessing.value = true;
            errorMessage.value = '';

            try {
                console.log('[BuyCreditsModal] Starting x402 payment flow...');

                // Step 1: Get derivation prefix from backend
                if (!backendIdentityKey.value) {
                    await fetchBackendIdentityKey();
                }

                if (!backendIdentityKey.value) {
                    throw new Error('Could not fetch backend identity key');
                }

                // Generate derivation prefix
                const derivationPrefix = Utils.toBase64(Utils.toArray(`buy-credits-${Date.now()}`, 'utf8'));
                const derivationSuffix = Utils.toBase64(Utils.toArray(`pkg-${selectedPackage.value.tokens}`, 'utf8'));

                // Step 2: Show wallet prompt
                state.value = 'wallet-prompt';

                // Step 3: Derive payment key using BRC-29
                const { publicKey: derivedPublicKey } = await wallet.value.getPublicKey({
                    counterparty: backendIdentityKey.value,
                    protocolID: BRC29_PROTOCOL_ID,
                    keyID: `${derivationPrefix} ${derivationSuffix}`,
                    forSelf: false
                });

                // Create locking script for payment
                const lockingScript = new P2PKH().lock(
                    PublicKey.fromString(derivedPublicKey).toAddress()
                ).toHex();

                console.log('[BuyCreditsModal] Creating BSV transaction...');

                // Step 4: Create the BSV transaction
                const action = await wallet.value.createAction({
                    outputs: [{
                        lockingScript,
                        satoshis: selectedPackage.value.sats,
                        outputDescription: `Buy ${totalTokens.value} Service Credits`
                    }],
                    description: `Buy ${totalTokens.value} Service Credits`,
                    options: { randomizeOutputs: false }
                });

                if (!action.tx) {
                    throw new Error('Transaction creation failed or was cancelled');
                }

                console.log('[BuyCreditsModal] Transaction created, sending to backend...');
                state.value = 'processing';

                // Get sender identity key
                const { publicKey: senderIdentityKey } = await wallet.value.getPublicKey({ identityKey: true });

                // Create payment header
                const paymentHeader = JSON.stringify({
                    derivationPrefix,
                    derivationSuffix,
                    transaction: Utils.toBase64(action.tx),
                    senderIdentityKey,
                    amount: selectedPackage.value.sats
                });

                // Step 5: Send payment to backend
                const response = await fetch(getApiUrl('/api/v1/tokens/economy/buy-credits-x402'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-bsv-identity-key': senderIdentityKey,
                        'x-bsv-payment': paymentHeader
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        tokensRequested: totalTokens.value,
                        satsPaid: selectedPackage.value.sats
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || data.error || 'Payment failed');
                }

                purchasedTokens.value = totalTokens.value;
                newBalance.value = data.balance || (props.currentBalance + purchasedTokens.value);

                state.value = 'success';
                emit('purchase-success', { tokens: purchasedTokens.value, balance: newBalance.value });

            } catch (error: any) {
                console.error('[BuyCreditsModal] Payment error:', error);
                errorMessage.value = error.message || 'Transaction Failed';
                state.value = 'error';
            } finally {
                isProcessing.value = false;
            }
        };

        const cancelPayment = () => {
            state.value = 'select';
            isProcessing.value = false;
        };
        
        const close = () => {
            if (!isProcessing.value) {
                displayStatus.value = false;
                setTimeout(() => {
                    state.value = 'select';
                    txid.value = '';
                    errorMessage.value = '';
                }, 300);
            }
        };
        
        const stopPropagationEvent = (e: Event) => {
            e.stopPropagation();
        };
        
        // Fetch address when modal opens
        watch(() => props.display, (newVal) => {
            if (newVal) {
                if (!backendAddress.value) fetchBackendAddress();
                if (!backendIdentityKey.value) fetchBackendIdentityKey();
            }
        }, { immediate: true });
        
        return {
            displayStatus,
            state,
            isProcessing,
            errorMessage,
            packages,
            selectedPackage,
            totalTokens,
            paymentMethod,
            txid,
            backendAddress,
            addressCopied,
            purchasedTokens,
            newBalance,
            // Wallet
            wallet,
            isConnected,
            isConnecting,
            // Methods
            copyAddress,
            connectWallet,
            buyWithTxid,
            buyWithWallet,
            cancelPayment,
            close,
            stopPropagationEvent
        };
    }
});
</script>

<style scoped>
.buy-credits-modal {
    max-width: 480px;
    margin-top: var(--top-bar-size, 60px);
    max-height: calc(100vh - var(--top-bar-size, 60px) - 2rem);
    overflow-y: auto;
}

/* Use global modal-header styles - no custom override */

.modal-title {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm, 0.5rem);
}

.modal-title i {
    color: var(--a11y-primary);
}

.current-balance {
    text-align: center;
    margin-bottom: var(--a11y-spacing-lg, 1.5rem);
    padding: var(--a11y-spacing-md, 1rem);
    background-color: var(--mci-gray-100, #f8f9fa);
    border-radius: var(--a11y-border-radius, 0.5rem);
    border: 1px solid var(--theme-border-color, #e0e0e0);
}

.balance-label {
    display: block;
    font-size: var(--a11y-font-size-small, 0.875rem);
    color: var(--a11y-text-secondary);
}

.balance-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--a11y-primary);
}

.package-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--a11y-spacing-sm, 0.75rem);
    margin-bottom: var(--a11y-spacing-lg, 1.5rem);
}

.package-card {
    padding: var(--a11y-spacing-md, 1rem);
    border: 2px solid var(--theme-border-color, #e0e0e0);
    border-radius: var(--a11y-border-radius, 0.5rem);
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background-color: var(--modal-bg-color, white);
}

.package-card:hover {
    border-color: var(--a11y-primary);
    background-color: var(--mci-gray-100, #f8f9fa);
}

.package-card.selected {
    border-color: var(--a11y-primary);
    background-color: var(--mci-gray-100, #f8f9fa);
    box-shadow: 0 0 0 3px rgba(var(--a11y-primary-rgb, 59, 130, 246), 0.15);
}

.package-tokens {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--a11y-primary);
}

.package-label {
    font-size: var(--a11y-font-size-small, 0.75rem);
    color: var(--a11y-text-secondary);
}

.package-price {
    margin-top: var(--a11y-spacing-sm, 0.5rem);
    font-size: var(--a11y-font-size-small, 0.875rem);
    font-weight: 600;
    color: var(--a11y-text);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-xs, 0.25rem);
}

.package-price i {
    color: var(--a11y-primary);
}

.package-bonus {
    margin-top: var(--a11y-spacing-xs, 0.25rem);
    font-size: var(--a11y-font-size-small, 0.7rem);
    color: var(--a11y-text-secondary);
    font-weight: 500;
}

.payment-method-section {
    margin-bottom: var(--a11y-spacing-md, 1rem);
}

.method-label {
    display: block;
    font-size: var(--a11y-font-size-small, 0.875rem);
    font-weight: 500;
    margin-bottom: var(--a11y-spacing-sm, 0.5rem);
    color: var(--a11y-text);
}

.method-tabs {
    display: flex;
    gap: var(--a11y-spacing-sm, 0.5rem);
}

.method-btn {
    flex: 1;
    padding: var(--a11y-spacing-sm, 0.75rem);
    border: 1px solid var(--theme-border-color, #e0e0e0);
    background-color: var(--modal-bg-color, white);
    border-radius: var(--a11y-border-radius, 0.375rem);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-sm, 0.5rem);
    transition: all 0.2s;
    color: var(--a11y-text-secondary);
    font-weight: 500;
}

.method-btn:hover {
    border-color: var(--a11y-primary);
}

.method-btn.active {
    border-color: var(--a11y-primary);
    background-color: var(--mci-gray-100, #f8f9fa);
    color: var(--a11y-primary);
}

/* TXID Section */
.txid-section, .wallet-section {
    margin-top: var(--a11y-spacing-md, 1rem);
    padding: var(--a11y-spacing-md, 1rem);
    background-color: var(--mci-gray-100, #f8f9fa);
    border-radius: var(--a11y-border-radius, 0.5rem);
    border: 1px solid var(--theme-border-color, #e0e0e0);
}

.payment-address {
    margin-bottom: var(--a11y-spacing-md, 1rem);
}

.payment-address label {
    display: block;
    font-size: var(--a11y-font-size-small, 0.875rem);
    margin-bottom: var(--a11y-spacing-xs, 0.25rem);
    color: var(--a11y-text);
}

.address-box {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm, 0.5rem);
    padding: var(--a11y-spacing-sm, 0.5rem);
    background-color: var(--modal-bg-color, white);
    border: 1px solid var(--theme-border-color, #e0e0e0);
    border-radius: var(--a11y-border-radius, 0.375rem);
    margin-bottom: var(--a11y-spacing-sm, 0.5rem);
}

.address-box code {
    flex: 1;
    font-size: 0.7rem;
    word-break: break-all;
    color: var(--a11y-text-secondary);
}

.btn-copy {
    padding: var(--a11y-spacing-xs, 0.25rem) var(--a11y-spacing-sm, 0.5rem);
    border: none;
    background-color: var(--theme-border-color, #e0e0e0);
    border-radius: var(--a11y-border-radius-sm, 0.25rem);
    cursor: pointer;
    color: var(--a11y-text-secondary);
    transition: background-color 0.2s;
}

.btn-copy:hover {
    background-color: var(--a11y-primary);
    color: white;
}

.btn-open-wallet {
    display: inline-flex;
    align-items: center;
    gap: var(--a11y-spacing-sm, 0.5rem);
    padding: var(--a11y-spacing-sm, 0.5rem) var(--a11y-spacing-md, 1rem);
    background-color: var(--a11y-primary);
    color: white;
    border-radius: var(--a11y-border-radius, 0.375rem);
    text-decoration: none;
    font-size: var(--a11y-font-size-small, 0.875rem);
    font-weight: 500;
    transition: background-color 0.2s;
}

.btn-open-wallet:hover {
    background-color: var(--a11y-primary-dark);
}

.txid-input-group {
    margin-bottom: var(--a11y-spacing-md, 1rem);
}

.txid-input-group label {
    display: block;
    font-size: var(--a11y-font-size-small, 0.875rem);
    margin-bottom: var(--a11y-spacing-xs, 0.25rem);
    color: var(--a11y-text);
}

.txid-input {
    width: 100%;
    padding: var(--a11y-spacing-sm, 0.75rem);
    border: 1px solid var(--theme-border-color, #e0e0e0);
    border-radius: var(--a11y-border-radius, 0.375rem);
    font-family: monospace;
    font-size: var(--a11y-font-size-small, 0.875rem);
    background-color: var(--modal-bg-color, white);
    color: var(--a11y-text);
    transition: border-color 0.2s, box-shadow 0.2s;
}

.txid-input:focus {
    outline: none;
    border-color: var(--a11y-primary);
    box-shadow: 0 0 0 3px rgba(var(--a11y-primary-rgb, 59, 130, 246), 0.1);
}

/* Wallet Section */
.wallet-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--a11y-spacing-md, 1rem);
}

.wallet-status {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm, 0.5rem);
    font-size: var(--a11y-font-size-small, 0.875rem);
    color: var(--a11y-text-secondary);
}

.wallet-status.connected {
    color: var(--a11y-primary);
}

.wallet-status i {
    font-size: 1.25rem;
}

.btn-connect {
    padding: var(--a11y-spacing-sm, 0.5rem) var(--a11y-spacing-md, 1rem);
    background-color: var(--a11y-primary);
    color: white;
    border: none;
    border-radius: var(--a11y-border-radius, 0.375rem);
    font-size: var(--a11y-font-size-small, 0.875rem);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm, 0.5rem);
    font-weight: 500;
    transition: background-color 0.2s;
}

.btn-connect:hover:not(:disabled) {
    background-color: var(--a11y-primary-dark);
}

.btn-connect:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.payment-summary {
    background-color: var(--modal-bg-color, white);
    border: 1px solid var(--theme-border-color, #e0e0e0);
    border-radius: var(--a11y-border-radius, 0.5rem);
    padding: var(--a11y-spacing-md, 1rem);
    margin-bottom: var(--a11y-spacing-md, 1rem);
}

.summary-row {
    display: flex;
    justify-content: space-between;
    padding: var(--a11y-spacing-sm, 0.5rem) 0;
    color: var(--a11y-text);
}

.summary-row span {
    color: var(--a11y-text-secondary);
}

.summary-row strong {
    color: var(--a11y-primary);
}

.summary-row:not(:last-child) {
    border-bottom: 1px solid var(--mci-gray-100, #f3f4f6);
}

.btn-buy {
    width: 100%;
    padding: var(--a11y-spacing-md, 1rem);
    background-color: var(--a11y-primary);
    color: white;
    border: none;
    border-radius: var(--a11y-border-radius, 0.5rem);
    font-size: var(--a11y-font-size-base, 1rem);
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-sm, 0.5rem);
    transition: background-color 0.2s;
}

.btn-buy:hover:not(:disabled) {
    background-color: var(--a11y-primary-dark);
}

.btn-buy:disabled {
    background-color: var(--a11y-text-secondary);
    cursor: not-allowed;
}

/* Wallet Prompt State */
.wallet-prompt-state {
    text-align: center;
    padding: var(--a11y-spacing-xl, 2rem);
}

.wallet-prompt-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--a11y-spacing-md, 1rem);
}

.wallet-prompt-content h3 {
    color: var(--a11y-primary);
    margin: 0;
}

.wallet-prompt-content p {
    color: var(--a11y-text-secondary);
    margin: 0;
}

.wallet-icon {
    font-size: 4rem;
    color: var(--a11y-primary);
}

.wallet-icon.pulse {
    animation: wallet-pulse 1.5s ease-in-out infinite;
}

@keyframes wallet-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
}

.payment-preview {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-md, 1rem);
    padding: var(--a11y-spacing-md, 1rem);
    background-color: var(--mci-gray-100, #f8f9fa);
    border-radius: var(--a11y-border-radius, 0.5rem);
    border: 1px solid var(--theme-border-color, #e0e0e0);
}

.payment-preview .amount {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--a11y-primary);
}

.payment-preview i {
    color: var(--a11y-text-secondary);
}

.payment-preview .tokens {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--a11y-primary);
}

.btn-cancel {
    padding: var(--a11y-spacing-sm, 0.5rem) var(--a11y-spacing-lg, 1.5rem);
    background-color: var(--mci-gray-100, #f8f9fa);
    border: 1px solid var(--theme-border-color, #e0e0e0);
    border-radius: var(--a11y-border-radius, 0.375rem);
    cursor: pointer;
    color: var(--a11y-text);
    font-weight: 500;
    transition: background-color 0.2s;
}

.btn-cancel:hover {
    background-color: var(--theme-border-color, #e0e0e0);
}

/* Processing State */
.processing-state {
    text-align: center;
    padding: var(--a11y-spacing-xl, 3rem);
    color: var(--a11y-primary);
}

.processing-state i {
    font-size: 3rem;
    margin-bottom: var(--a11y-spacing-md, 1rem);
    display: block;
}

/* Success State */
.success-state {
    text-align: center;
}

.success-content {
    padding: var(--a11y-spacing-md, 1rem);
}

.success-content h2 {
    color: var(--a11y-primary);
    margin: var(--a11y-spacing-md, 1rem) 0;
}

.success-icon {
    font-size: 4rem;
    color: var(--a11y-primary);
}

.purchased-amount {
    margin: var(--a11y-spacing-md, 1rem) 0;
    padding: var(--a11y-spacing-md, 1rem);
    background-color: var(--mci-gray-100, #f8f9fa);
    border-radius: var(--a11y-border-radius, 0.5rem);
}

.purchased-amount .amount {
    font-size: 3rem;
    font-weight: 800;
    color: var(--a11y-primary);
}

.purchased-amount .label {
    display: block;
    color: var(--a11y-text-secondary);
}

.new-balance {
    margin-bottom: var(--a11y-spacing-lg, 1.5rem);
    color: var(--a11y-text-secondary);
}

.new-balance strong {
    color: var(--a11y-primary);
}

.btn-done {
    padding: var(--a11y-spacing-sm, 0.75rem) var(--a11y-spacing-xl, 2rem);
    background-color: var(--a11y-primary);
    color: white;
    border: none;
    border-radius: var(--a11y-border-radius, 0.375rem);
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
}

.btn-done:hover {
    background-color: var(--a11y-primary-dark);
}

/* Error State */
.error-state {
    text-align: center;
    padding: var(--a11y-spacing-xl, 2rem);
}

.error-state h3 {
    color: var(--a11y-error);
    margin: var(--a11y-spacing-md, 1rem) 0 var(--a11y-spacing-sm, 0.5rem);
}

.error-state p {
    color: var(--a11y-text-secondary);
    margin: 0;
}

.error-icon {
    font-size: 3rem;
    color: var(--a11y-error);
}

.btn-retry {
    margin-top: var(--a11y-spacing-md, 1rem);
    padding: var(--a11y-spacing-sm, 0.75rem) var(--a11y-spacing-lg, 1.5rem);
    background-color: var(--mci-gray-100, #f8f9fa);
    border: 1px solid var(--theme-border-color, #e0e0e0);
    border-radius: var(--a11y-border-radius, 0.375rem);
    cursor: pointer;
    color: var(--a11y-text);
    font-weight: 500;
    transition: background-color 0.2s;
}

.btn-retry:hover {
    background-color: var(--theme-border-color, #e0e0e0);
}
</style>
