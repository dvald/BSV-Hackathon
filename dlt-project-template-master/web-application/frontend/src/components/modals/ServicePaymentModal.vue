<template>
    <ModalDialogContainer ref="modalContainer" v-model:display="displayStatus" :static="isProcessing">
        <div class="modal-dialog modal-md service-payment-modal" role="document" @click="stopPropagationEvent">
            <!-- Header -->
            <div class="modal-header">
                <div class="modal-title">
                    <i class="mdi mdi-human-male-child" aria-hidden="true"></i>
                    {{ serviceName }}
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

            <!-- Body: Confirm State -->
            <div v-if="state === 'confirm'" class="modal-body">
                <div class="payment-info">
                    <div class="payment-header">
                        <i class="mdi mdi-human-male-child payment-icon" aria-hidden="true"></i>
                        <h3>{{ $t("Reserve Family Parking") }}</h3>
                    </div>

                    <!-- Payment Method Tabs -->
                    <div class="payment-method-tabs four-tabs">
                        <!-- Tab 1: Use existing SERVICE_TOKEN -->
                        <button 
                            type="button"
                            class="tab-btn tokens-tab"
                            :class="{ active: paymentMethod === 'tokens', 'has-tokens': serviceBalance >= cost }"
                            @click="paymentMethod = 'tokens'"
                        >
                            <i class="mdi mdi-ticket-confirmation" aria-hidden="true"></i>
                            {{ $t("Tokens") }}
                            <span v-if="serviceBalance > 0" class="tokens-badge">{{ serviceBalance }}</span>
                        </button>
                        <!-- Tab 2: Pay with Card (Stripe) -->
                        <button 
                            type="button"
                            class="tab-btn stripe-tab"
                            :class="{ active: paymentMethod === 'stripe' }"
                            @click="paymentMethod = 'stripe'"
                        >
                            <i class="mdi mdi-credit-card" aria-hidden="true"></i>
                            {{ $t("Card") }}
                        </button>
                        <!-- Tab 3: Buy with Wallet -->
                        <button 
                            type="button"
                            class="tab-btn"
                            :class="{ active: paymentMethod === 'auto' }"
                            @click="paymentMethod = 'auto'"
                        >
                            <i class="mdi mdi-wallet" aria-hidden="true"></i>
                            {{ $t("Wallet") }}
                        </button>
                        <!-- Tab 4: Redeem LOYALTY points -->
                        <button 
                            type="button"
                            class="tab-btn loyalty-tab"
                            :class="{ active: paymentMethod === 'loyalty', 'has-points': loyaltyBalance >= 100 }"
                            @click="paymentMethod = 'loyalty'"
                        >
                            <i class="mdi mdi-star" aria-hidden="true"></i>
                            {{ $t("Points") }}
                            <span v-if="loyaltyBalance > 0" class="points-badge">{{ loyaltyBalance }}</span>
                        </button>
                    </div>
                    
                    <!-- Payment Details (for BSV direct payment: TXID and Wallet) -->
                    <div v-if="paymentMethod === 'stripe' || paymentMethod === 'auto'" class="payment-details">
                        <div class="detail-row bsv-row">
                            <span class="detail-label">{{ $t("Parking Cost") }}:</span>
                            <span class="detail-value cost bsv-cost">
                                <i class="mdi mdi-bitcoin" aria-hidden="true"></i>
                                {{ satoshiCost }} sats
                            </span>
                        </div>
                        <div class="detail-row service-row">
                            <span class="detail-label">{{ $t("Service") }}:</span>
                            <span class="detail-value service">👨‍👩‍👧‍👦 {{ $t("Family Parking Reservation") }}</span>
                        </div>
                        <div class="detail-row reward-row">
                            <span class="detail-label">{{ $t("Loyalty Bonus") }}:</span>
                            <span class="detail-value reward">+{{ reward }} {{ $t("Points") }}</span>
                        </div>
                    </div>

                    <!-- USE SERVICE TOKENS VIEW -->
                    <div v-if="paymentMethod === 'tokens'" class="tokens-section">
                        <div class="tokens-header">
                            <i class="mdi mdi-ticket-confirmation" aria-hidden="true"></i>
                            <span>{{ $t("Your Service Tokens") }}</span>
                        </div>

                        <!-- Current Balance Display -->
                        <div class="tokens-balance-display">
                            <span class="tokens-amount">{{ serviceBalance }}</span>
                            <span class="tokens-label">{{ $t("Tokens") }}</span>
                        </div>

                        <!-- Cost info -->
                        <div class="tokens-cost-info">
                            <span>{{ $t("Reservation cost") }}: <strong>{{ cost }} tokens</strong></span>
                        </div>

                        <!-- Use Tokens Button (only if enough balance) -->
                        <div v-if="serviceBalance >= cost && !isUsingTokens && !tokenUseSuccess" class="use-tokens-section">
                            <button 
                                type="button"
                                class="btn btn-use-tokens"
                                @click="useServiceTokens"
                            >
                                <i class="mdi mdi-check-decagram" aria-hidden="true"></i>
                                {{ $t("Reserve with my Tokens") }}
                            </button>
                            <p class="tokens-hint">
                                <i class="mdi mdi-gift" aria-hidden="true"></i>
                                {{ $t("You will also earn") }} +{{ reward }} {{ $t("loyalty points!") }}
                            </p>
                        </div>

                        <!-- Using Tokens State -->
                        <div v-if="isUsingTokens" class="using-tokens-state">
                            <i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i>
                            <span>{{ $t("Processing reservation...") }}</span>
                        </div>

                        <!-- Token Use Success -->
                        <div v-if="tokenUseSuccess" class="token-use-success">
                            <i class="mdi mdi-human-male-child" aria-hidden="true"></i>
                            <div class="success-text">
                                <strong>🎉 {{ $t("Family Space Reserved!") }}</strong>
                                <span>+{{ reward }} {{ $t("loyalty points earned!") }}</span>
                            </div>
                        </div>

                        <!-- Not Enough Tokens -->
                        <div v-if="serviceBalance < cost && !isUsingTokens" class="not-enough-tokens">
                            <i class="mdi mdi-alert-circle-outline" aria-hidden="true"></i>
                            <span>{{ $t("Not enough tokens.") }} {{ $t("You need") }} {{ cost - serviceBalance }} {{ $t("more.") }}</span>
                            <p class="buy-hint">{{ $t("Buy more tokens in the TXID or Wallet tab.") }}</p>
                        </div>
                    </div>

                    <!-- LOYALTY POINTS VIEW -->
                    <div v-if="paymentMethod === 'loyalty'" class="loyalty-section">
                        <div class="loyalty-header">
                            <i class="mdi mdi-star-circle" aria-hidden="true"></i>
                            <span>{{ $t("Your Loyalty Points") }}</span>
                        </div>

                        <!-- Current Balance Display -->
                        <div class="loyalty-balance-display">
                            <span class="loyalty-amount">{{ loyaltyBalance }}</span>
                            <span class="loyalty-label">{{ $t("Points") }}</span>
                        </div>

                        <!-- Progress to Free Reservation -->
                        <div class="loyalty-progress">
                            <div class="progress-bar-container">
                                <div 
                                    class="progress-bar-fill" 
                                    :style="{ width: Math.min(100, (loyaltyBalance / 100) * 100) + '%' }"
                                ></div>
                            </div>
                            <span class="progress-text">
                                {{ loyaltyBalance >= 100 ? '🎉 ' + $t("Ready to redeem!") : (100 - loyaltyBalance) + ' ' + $t("points until free reservation") }}
                            </span>
                        </div>

                        <!-- Redeem Button (only if 100+ points) -->
                        <div v-if="loyaltyBalance >= 100 && !isRedeeming && !redemptionSuccess" class="redeem-section">
                            <div class="redeem-info">
                                <i class="mdi mdi-gift" aria-hidden="true"></i>
                                <span>{{ $t("Exchange 100 points for a FREE reservation!") }}</span>
                            </div>
                            <button 
                                type="button"
                                class="btn btn-redeem"
                                @click="redeemLoyalty"
                            >
                                <i class="mdi mdi-check-decagram" aria-hidden="true"></i>
                                {{ $t("Redeem FREE Reservation") }}
                            </button>
                        </div>

                        <!-- Redeeming State -->
                        <div v-if="isRedeeming" class="redeeming-state">
                            <i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i>
                            <span>{{ $t("Redeeming points on BSV...") }}</span>
                        </div>

                        <!-- Redemption Success -->
                        <div v-if="redemptionSuccess" class="redemption-success-box">
                            <i class="mdi mdi-human-male-child" aria-hidden="true"></i>
                            <div class="success-text">
                                <strong>🎉 {{ $t("FREE Parking Obtained!") }}</strong>
                                <span>{{ $t("Your family parking space is reserved!") }}</span>
                            </div>
                            <div class="new-balance">
                                {{ $t("Remaining points") }}: {{ loyaltyBalance }}
                            </div>
                        </div>

                        <!-- Not Enough Points -->
                        <div v-if="loyaltyBalance < 100 && !isRedeeming" class="not-enough-points">
                            <i class="mdi mdi-information-outline" aria-hidden="true"></i>
                            <span>{{ $t("Use services to earn more points!") }}</span>
                        </div>
                    </div>

                    <!-- STRIPE PAYMENT VIEW -->
                    <div v-if="paymentMethod === 'stripe'" class="stripe-payment-section">
                        <div class="stripe-payment-header">
                            <i class="mdi mdi-credit-card" aria-hidden="true"></i>
                            <span>{{ $t("Pay with Card") }}</span>
                        </div>

                        <!-- Price Display -->
                        <div class="stripe-price-display">
                            <div class="price-amount">
                                <span class="currency">EUR</span>
                                <span class="price">{{ stripePrice.toFixed(2) }}</span>
                            </div>
                            <p class="price-description">{{ $t("Family Parking Reservation") }} - {{ cost }} tokens</p>
                        </div>

                        <!-- Stripe Info -->
                        <div class="stripe-info">
                            <i class="mdi mdi-shield-check" aria-hidden="true"></i>
                            <span>{{ $t("Secure payment powered by Stripe") }}</span>
                        </div>

                        <!-- Stripe Error -->
                        <div v-if="stripeError" class="stripe-error">
                            <i class="mdi mdi-alert-circle" aria-hidden="true"></i>
                            {{ stripeError }}
                        </div>

                        <!-- Processing State -->
                        <div v-if="isStripeProcessing" class="stripe-processing">
                            <i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i>
                            <span>{{ $t("Opening Stripe checkout...") }}</span>
                        </div>
                    </div>

                    <!-- AUTOMATIC PAYMENT VIEW -->
                    <div v-if="paymentMethod === 'auto'" class="auto-payment-section">
                        <!-- Wallet Connection Status -->
                        <div class="wallet-status" :class="{ connected: isConnected, disconnected: !isConnected }">
                            <div class="wallet-status-icon">
                                <i v-if="isConnected" class="mdi mdi-wallet-outline" aria-hidden="true"></i>
                                <i v-else class="mdi mdi-wallet-off-outline" aria-hidden="true"></i>
                            </div>
                            <div class="wallet-status-text">
                                <span v-if="isConnecting">{{ $t("Connecting wallet...") }}</span>
                                <span v-else-if="isConnected">{{ $t("BSV Wallet Connected") }}</span>
                                <span v-else>{{ $t("Wallet not connected") }}</span>
                            </div>
                            <button 
                                v-if="!isConnected && !isConnecting"
                                type="button"
                                class="btn btn-sm btn-connect"
                                @click="connectWallet"
                            >
                                <i class="mdi mdi-connection" aria-hidden="true"></i>
                                {{ $t("Connect") }}
                            </button>
                        </div>

                        <div v-if="!isConnected" class="wallet-required-warning">
                            <i class="mdi mdi-information-outline" aria-hidden="true"></i>
                            {{ $t("Automatic payment requires a browser wallet. Use 'External Wallet' for BSV Desktop.") }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Body: Wallet Prompt State -->
            <div v-if="state === 'wallet-prompt'" class="modal-body wallet-prompt-state">
                <div class="wallet-prompt-content">
                    <div class="wallet-icon-container">
                        <i class="mdi mdi-wallet-outline wallet-icon pulse" aria-hidden="true"></i>
                    </div>
                    <h3>{{ $t("Approve Transaction") }}</h3>
                    <p class="wallet-prompt-subtitle">{{ $t("Please sign the transaction in your BSV wallet") }}</p>
                    <div class="transaction-preview">
                        <span class="tx-amount">{{ satoshiCost }} sats</span>
                        <i class="mdi mdi-arrow-right" aria-hidden="true"></i>
                        <span class="tx-recipient">{{ $t("Family Parking") }}</span>
                    </div>
                </div>
            </div>

            <!-- Body: Loading State -->
            <div v-if="state === 'loading'" class="modal-body loading-state">
                <div class="loading-content">
                    <div class="spinner-container">
                        <i class="mdi mdi-loading mdi-spin loading-spinner" aria-hidden="true"></i>
                    </div>
                    <h3>{{ $t("Processing on Bitcoin SV...") }}</h3>
                    <p class="loading-subtitle">{{ $t("Recording transaction on blockchain") }}</p>
                    <div class="bsv-animation">
                        <span class="bsv-dot"></span>
                        <span class="bsv-dot"></span>
                        <span class="bsv-dot"></span>
                    </div>
                </div>
            </div>

            <!-- Body: Success State -->
            <div v-if="state === 'success'" class="modal-body success-state">
                <div class="success-content">
                    <div class="success-icon-container">
                        <i class="mdi mdi-check-circle success-icon" aria-hidden="true"></i>
                    </div>
                    <h2 class="success-title">{{ $t("Family Space Reserved!") }}</h2>
                    
                    <div class="reward-celebration">
                        <div class="reward-badge">
                            <i class="mdi mdi-star" aria-hidden="true"></i>
                            <span class="reward-amount">+{{ reward }}</span>
                        </div>
                        <p class="reward-message">{{ $t("Loyalty points earned!") }}</p>
                    </div>

                    <div class="transaction-info">
                        <h4>{{ $t("Blockchain Transactions") }}</h4>
                        <div class="tx-row">
                            <span class="tx-label">{{ $t("Payment (BURN)") }}:</span>
                            <a 
                                :href="'https://whatsonchain.com/tx/' + txIds.burn" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                class="tx-link"
                            >
                                {{ formatTxId(txIds.burn) }}
                                <i class="mdi mdi-open-in-new" aria-hidden="true"></i>
                            </a>
                        </div>
                        <div class="tx-row">
                            <span class="tx-label">{{ $t("Reward (MINT)") }}:</span>
                            <a 
                                :href="'https://whatsonchain.com/tx/' + txIds.mint" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                class="tx-link"
                            >
                                {{ formatTxId(txIds.mint) }}
                                <i class="mdi mdi-open-in-new" aria-hidden="true"></i>
                            </a>
                        </div>
                    </div>

                    <div class="new-balances">
                        <div class="balance-item">
                            <span class="balance-label">{{ $t("Service Tokens") }}:</span>
                            <span class="balance-value">{{ newBalances.serviceToken }}</span>
                        </div>
                        <div class="balance-item">
                            <span class="balance-label">{{ $t("Loyalty Points") }}:</span>
                            <span class="balance-value loyalty">{{ newBalances.loyaltyToken }}</span>
                        </div>
                    </div>

                    <p class="success-hint">
                        <i class="mdi mdi-information-outline" aria-hidden="true"></i>
                        {{ $t("Tip: Use your loyalty points in the 'Points' tab!") }}
                    </p>
                </div>
            </div>

            <!-- Body: Error State -->
            <div v-if="state === 'error'" class="modal-body error-state">
                <div class="error-content">
                    <i class="mdi mdi-alert-circle error-icon" aria-hidden="true"></i>
                    <h3>{{ $t("Transaction Failed") }}</h3>
                    <p class="error-message">{{ errorMessage }}</p>
                </div>
            </div>

            <!-- Footer -->
            <div class="modal-footer">
                <template v-if="state === 'confirm'">
                    <!-- Stripe Payment Button -->
                    <button 
                        v-if="paymentMethod === 'stripe'"
                        type="button" 
                        class="btn btn-primary confirm-btn stripe-btn"
                        :disabled="isProcessing || isStripeProcessing"
                        @click="initiateStripePayment"
                    >
                        <i class="mdi mdi-credit-card" aria-hidden="true"></i>
                        {{ $t("Pay") }} {{ stripePrice.toFixed(2) }} EUR
                    </button>
                    <!-- Automatic Payment Button -->
                    <button 
                        v-if="paymentMethod === 'auto'"
                        type="button" 
                        class="btn btn-primary confirm-btn bsv-pay-btn"
                        :disabled="!isConnected || isProcessing"
                        @click="confirmPayment"
                    >
                        <i class="mdi mdi-bitcoin" aria-hidden="true"></i>
                        {{ $t("Pay with BSV Wallet") }}
                    </button>
                    <button type="button" class="btn btn-secondary" @click="close">
                        {{ $t("Cancel") }}
                    </button>
                </template>

                <template v-if="state === 'wallet-prompt'">
                    <button type="button" class="btn btn-secondary" @click="cancelPayment" :disabled="isProcessing">
                        {{ $t("Cancel") }}
                    </button>
                </template>

                <template v-if="state === 'success' || state === 'error'">
                    <button type="button" class="btn btn-primary" @click="close">
                        {{ $t("Close") }}
                    </button>
                </template>
            </div>
        </div>
    </ModalDialogContainer>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType, watch } from "vue";
import { useVModel } from "../../utils/v-model";
import { getApiUrl } from "@/api/utils";
import { useWallet } from "@/composables/useWallet";
import { P2PKH, PublicKey, Utils, WalletProtocol } from "@bsv/sdk";

// BRC-29 Protocol ID for payment derivation
const BRC29_PROTOCOL_ID: WalletProtocol = [2, '3241645161d8'];

type ModalState = 'confirm' | 'loading' | 'wallet-prompt' | 'success' | 'error';

interface TxIds {
    burn: string | null;
    mint: string | null;
}

interface Balances {
    serviceToken: number;
    loyaltyToken: number;
}

export default defineComponent({
    name: "ServicePaymentModal",
    emits: ["update:display", "payment-success"],
    props: {
        display: {
            type: Boolean,
            default: false
        },
        serviceName: {
            type: String,
            default: "Parking Familia Numerosa"
        },
        serviceId: {
            type: String,
            default: "parking-familia"
        },
        cost: {
            type: Number,
            default: 50
        },
        reward: {
            type: Number,
            default: 10
        },
        currentBalance: {
            type: Number,
            default: 0
        },
        userId: {
            type: String,
            required: true
        }
    },
    setup(props, { emit }) {
        const displayStatus = useVModel(props, "display");
        const state = ref<ModalState>('confirm');
        const isProcessing = ref(false);
        const errorMessage = ref('');
        const txIds = ref<TxIds>({ burn: null, mint: null });
        const newBalances = ref<Balances>({ serviceToken: 0, loyaltyToken: 0 });
        const bsvPaymentTxid = ref<string | null>(null);

        // Wallet integration
        const { wallet, identityKey, isConnected, isConnecting, connect } = useWallet();
        const backendIdentityKey = ref<string | null>(null);
        const satoshiCost = ref(100); // Cost in satoshis (100 sats = avoids dust limit)

        // Payment method (stripe = card, auto = x402, loyalty = redeem points)
        const paymentMethod = ref<'tokens' | 'stripe' | 'auto' | 'loyalty'>('stripe'); // Default: stripe for hackathon
        
        // Stripe payment state
        const stripePrice = ref(5.00); // Price in EUR
        const stripeError = ref('');
        const isStripeProcessing = ref(false);

        // Token balances (fetched from backend)
        const serviceBalance = ref(0);
        const loyaltyBalance = ref(0);

        // Use tokens state
        const isUsingTokens = ref(false);
        const tokenUseSuccess = ref(false);

        // Redemption state
        const isRedeeming = ref(false);
        const redemptionSuccess = ref(false);

        // Fetch backend identity key on mount
        const fetchBackendIdentityKey = async () => {
            try {
                const response = await fetch(getApiUrl('/api/v1/bsv/wallet-info'));
                if (response.ok) {
                    const data = await response.json();
                    backendIdentityKey.value = data.identityKey;
                }
            } catch (error) {
                console.error('[ServicePaymentModal] Error fetching backend identity key:', error);
            }
        };

        // Fetch user's token balances (service + loyalty)
        const fetchBalances = async () => {
            try {
                const userKey = identityKey.value;
                if (!userKey) return;
                
                const response = await fetch(getApiUrl('/api/v1/gamification/status'), {
                    headers: {
                        'x-bsv-identity-key': userKey
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    loyaltyBalance.value = data.balances?.loyaltyToken || 0;
                    serviceBalance.value = data.balances?.serviceToken || 0;
                    
                    // Auto-select best tab based on balances
                    if (serviceBalance.value >= props.cost) {
                        paymentMethod.value = 'tokens';
                    } else if (loyaltyBalance.value >= 100) {
                        paymentMethod.value = 'loyalty';
                    }
                }
            } catch (error) {
                console.error('[ServicePaymentModal] Error fetching balances:', error);
            }
        };

        // Watch for display changes to fetch backend key
        watch(() => props.display, (newVal) => {
            if (newVal) {
                if (!backendIdentityKey.value) {
                    fetchBackendIdentityKey();
                }
                // Always fetch balances when modal opens
                fetchBalances();
                // Reset stripe state
                stripeError.value = '';
                isStripeProcessing.value = false;
            }
        }, { immediate: true });

        const connectWallet = async () => {
            await connect();
        };

        const formatTxId = (txid: string | null): string => {
            if (!txid) return 'N/A';
            if (txid.length <= 16) return txid;
            return `${txid.substring(0, 8)}...${txid.substring(txid.length - 8)}`;
        };

        /**
         * Initiate Stripe Payment
         * Calls /api/v1/purchase-token/checkout to create a Stripe checkout session
         */
        const initiateStripePayment = async () => {
            stripeError.value = '';
            isStripeProcessing.value = true;

            try {
                console.log('[ServicePaymentModal] Initiating Stripe payment...');
                
                const userKey = identityKey.value || props.userId;
                if (!userKey) {
                    throw new Error('User identity not available. Please connect your wallet first.');
                }

                // Call the Stripe checkout API (purchase-token/checkout)
                // Use 500 cents = 5 EUR as the fixed price for parking
                const priceCents = 500;
                
                const response = await fetch(getApiUrl('/api/v1/purchase-token/checkout'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        token_id: 'SERVICE', // SERVICE token for parking
                        amount: priceCents, // Price in cents (5 EUR = 500 cents)
                        holder_identity_key: userKey
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    const errorCode = data.code || data.error || 'UNKNOWN_ERROR';
                    const errorMsg = data.message || data.error || 'Failed to create checkout session';
                    console.error('[ServicePaymentModal] Stripe API error:', errorCode, errorMsg);
                    throw new Error(errorMsg);
                }

                console.log('[ServicePaymentModal] Stripe checkout URL:', data.url);

                // Redirect to Stripe checkout
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    throw new Error('No checkout URL received from server');
                }

            } catch (error: any) {
                console.error('[ServicePaymentModal] Stripe payment error:', error);
                stripeError.value = error.message || 'Failed to initiate payment';
            } finally {
                isStripeProcessing.value = false;
            }
        };

        /**
         * x402 Payment Flow:
         * 1. First request to API → expect 402 with derivation prefix
         * 2. Derive payment key using wallet
         * 3. Create BSV transaction with wallet.createAction()
         * 4. Second request with x-bsv-payment header
         * 5. Backend processes payment and grants tokens
         */
        const confirmPayment = async () => {
            if (!wallet.value || !isConnected.value) {
                errorMessage.value = 'Please connect your BSV wallet first';
                state.value = 'error';
                return;
            }

            state.value = 'loading';
            isProcessing.value = true;
            errorMessage.value = '';

            try {
                console.log('[ServicePaymentModal] Starting x402 payment flow...');

                // Step 1: Initial request - expect 402 Payment Required
                let response = await fetch(getApiUrl('/api/v1/gamification/pay-service'), {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-bsv-identity-key': identityKey.value || ''
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        serviceId: props.serviceId,
                        satoshis: satoshiCost.value
                    })
                });

                if (response.status === 402) {
                    console.log('[ServicePaymentModal] 402 Payment Required - proceeding with BSV payment');
                    
                    const derivationPrefix = response.headers.get('x-bsv-payment-derivation-prefix');
                    const requiredSatoshis = parseInt(response.headers.get('x-bsv-payment-satoshis-required') || String(satoshiCost.value));

                    if (!derivationPrefix) {
                        throw new Error('Server did not provide derivation prefix');
                    }

                    // Ensure we have backend identity key
                    if (!backendIdentityKey.value) {
                        await fetchBackendIdentityKey();
                    }

                    if (!backendIdentityKey.value) {
                        throw new Error('Could not fetch backend identity key');
                    }

                    // Step 2: Show wallet prompt state
                    state.value = 'wallet-prompt';

                    // Step 3: Derive payment key using BRC-29
                    const derivationSuffix = Utils.toBase64(Utils.toArray('parking-familia-' + Date.now(), 'utf8'));
                    
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

                    console.log('[ServicePaymentModal] Creating BSV transaction...');

                    // Step 4: Create the actual BSV transaction
                    const action = await wallet.value.createAction({
                        outputs: [{
                            lockingScript,
                            satoshis: requiredSatoshis,
                            outputDescription: 'Family Parking Payment'
                        }],
                        description: `Parking Familia - ${props.serviceName}`,
                        options: { randomizeOutputs: false }
                    });

                    if (!action.tx) {
                        throw new Error('Transaction creation failed or was cancelled');
                    }

                    console.log('[ServicePaymentModal] Transaction created, sending to backend...');
                    state.value = 'loading';

                    // Get sender identity key
                    const { publicKey: senderIdentityKey } = await wallet.value.getPublicKey({ identityKey: true });

                    // Create payment header
                    const paymentHeader = JSON.stringify({
                        derivationPrefix,
                        derivationSuffix,
                        transaction: Utils.toBase64(action.tx),
                        senderIdentityKey,
                        amount: requiredSatoshis
                    });

                    // Step 5: Retry request with payment header
                    response = await fetch(getApiUrl('/api/v1/gamification/pay-service'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-bsv-payment': paymentHeader,
                            'x-bsv-identity-key': senderIdentityKey
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                            serviceId: props.serviceId,
                            satoshis: requiredSatoshis
                        })
                    });
                }

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || data.message || 'Payment failed');
                }

                console.log('[ServicePaymentModal] Payment successful!', data);

                // Success!
                bsvPaymentTxid.value = data.bsvTxid || data.txIds?.bsvPayment || null;
                txIds.value = {
                    // Backend sends: txIds.bsvPayment (payment) and txIds.loyalty (reward)
                    burn: data.txIds?.burn || data.txIds?.bsvPayment || data.bsvTxid || null,
                    mint: data.txIds?.mint || data.txIds?.loyalty || null
                };
                newBalances.value = {
                    serviceToken: data.balances?.serviceToken || 0,
                    loyaltyToken: data.balances?.loyaltyToken || 0
                };

                state.value = 'success';
                emit('payment-success', data);

            } catch (error: any) {
                console.error('[ServicePaymentModal] Payment error:', error);
                errorMessage.value = error.message || 'An error occurred during payment';
                state.value = 'error';
            } finally {
                isProcessing.value = false;
            }
        };

        const cancelPayment = () => {
            if (!isProcessing.value) {
                state.value = 'confirm';
                errorMessage.value = '';
            }
        };

        // Use SERVICE_TOKEN for reservation (no BSV payment needed)
        const useServiceTokens = async () => {
            if (serviceBalance.value < props.cost) return;
            
            isUsingTokens.value = true;
            tokenUseSuccess.value = false;
            
            try {
                const userKey = identityKey.value;
                if (!userKey) {
                    throw new Error('User identity not available');
                }

                // Call the use-service endpoint (burns SERVICE_TOKEN, mints LOYALTY_TOKEN)
                const response = await fetch(getApiUrl('/api/v1/gamification/use-service'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-bsv-identity-key': userKey
                    },
                    body: JSON.stringify({
                        userId: userKey,
                        serviceId: props.serviceId
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || data.error || 'Token use failed');
                }

                // Update balances with new values
                serviceBalance.value = data.balances?.serviceToken || 0;
                loyaltyBalance.value = data.balances?.loyaltyToken || 0;
                
                newBalances.value = {
                    serviceToken: data.balances?.serviceToken || 0,
                    loyaltyToken: data.balances?.loyaltyToken || 0
                };

                txIds.value = {
                    burn: data.txIds?.burn || null,
                    mint: data.txIds?.mint || null
                };

                // Show full success screen with txIds
                tokenUseSuccess.value = true;
                state.value = 'success';

            } catch (error: any) {
                console.error('[ServicePaymentModal] Token use error:', error);
                errorMessage.value = error.message;
                state.value = 'error';
            } finally {
                isUsingTokens.value = false;
            }
        };

        // Redeem loyalty points for free reservation
        const redeemLoyalty = async () => {
            if (loyaltyBalance.value < 100) return;
            
            isRedeeming.value = true;
            redemptionSuccess.value = false;
            
            try {
                const userKey = identityKey.value;
                if (!userKey) {
                    throw new Error('User identity not available');
                }

                const response = await fetch(getApiUrl('/api/v1/gamification/redeem-loyalty'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-bsv-identity-key': userKey
                    }
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || data.error || 'Redemption failed');
                }

                // Update loyalty balance with new value
                loyaltyBalance.value = data.balances?.loyaltyToken || 0;
                
                // Also update newBalances for consistency
                newBalances.value = {
                    serviceToken: data.balances?.serviceToken || newBalances.value.serviceToken,
                    loyaltyToken: data.balances?.loyaltyToken || 0
                };

                redemptionSuccess.value = true;

            } catch (error: any) {
                console.error('[ServicePaymentModal] Redemption error:', error);
                errorMessage.value = error.message;
            } finally {
                isRedeeming.value = false;
            }
        };

        const close = () => {
            if (!isProcessing.value) {
                displayStatus.value = false;
                // Reset state after closing
                setTimeout(() => {
                    state.value = 'confirm';
                    errorMessage.value = '';
                    txIds.value = { burn: null, mint: null };
                    manualTxid.value = '';
                    manualTxidError.value = '';
                    redemptionSuccess.value = false;
                }, 300);
            }
        };

        const stopPropagationEvent = (e: Event) => {
            e.stopPropagation();
        };

        return {
            displayStatus,
            state,
            isProcessing,
            errorMessage,
            txIds,
            newBalances,
            bsvPaymentTxid,
            // Wallet
            wallet,
            identityKey,
            isConnected,
            isConnecting,
            satoshiCost,
            // Payment method
            paymentMethod,
            // Stripe payment
            stripePrice,
            stripeError,
            isStripeProcessing,
            // Token balances
            serviceBalance,
            loyaltyBalance,
            // Use tokens state
            isUsingTokens,
            tokenUseSuccess,
            // Redemption
            isRedeeming,
            redemptionSuccess,
            // Methods
            formatTxId,
            confirmPayment,
            cancelPayment,
            initiateStripePayment,
            connectWallet,
            useServiceTokens,
            redeemLoyalty,
            close,
            stopPropagationEvent
        };
    }
});
</script>

<style scoped>
.service-payment-modal {
    max-width: 480px;
}

.modal-header .modal-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.modal-header .modal-title i {
    font-size: 1.5rem;
    color: var(--a11y-primary, #2563eb);
}

/* Confirm State */
.payment-info {
    padding: 1rem 0;
}

.payment-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
}

.payment-icon {
    font-size: 2.5rem;
    color: var(--a11y-primary, #2563eb);
}

.payment-header h3 {
    margin: 0;
    font-size: 1.25rem;
}

.payment-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background-color: #f9fafb;
    border-radius: 0.5rem;
}

.detail-label {
    font-weight: 500;
    color: #6b7280;
}

.detail-value {
    font-weight: 600;
}

.detail-value.cost {
    color: #dc2626;
}

.detail-value.balance {
    color: #059669;
}

.detail-value.balance.insufficient {
    color: #dc2626;
}

.reward-row {
    background-color: #fef3c7;
    border: 1px solid #f59e0b;
}

.detail-value.reward {
    color: #d97706;
    font-size: 1.1rem;
}

.insufficient-funds-warning {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.75rem;
    background-color: #fef2f2;
    border: 1px solid #fca5a5;
    border-radius: 0.5rem;
    color: #dc2626;
    font-size: 0.9rem;
}

/* Loading State */
.loading-state {
    text-align: center;
    padding: 2rem 1rem;
}

.loading-content h3 {
    margin: 1rem 0 0.5rem;
    color: var(--a11y-primary, #2563eb);
}

.loading-subtitle {
    color: #6b7280;
    margin: 0;
}

.spinner-container {
    display: flex;
    justify-content: center;
}

.loading-spinner {
    font-size: 3rem;
    color: var(--a11y-primary, #2563eb);
}

.bsv-animation {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1.5rem;
}

.bsv-dot {
    width: 10px;
    height: 10px;
    background-color: var(--a11y-primary, #2563eb);
    border-radius: 50%;
    animation: bsv-pulse 1.4s ease-in-out infinite;
}

.bsv-dot:nth-child(2) {
    animation-delay: 0.2s;
}

.bsv-dot:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes bsv-pulse {
    0%, 100% {
        transform: scale(0.6);
        opacity: 0.5;
    }
    50% {
        transform: scale(1);
        opacity: 1;
    }
}

/* Success State */
.success-state {
    text-align: center;
    padding: 1.5rem 1rem;
}

.success-icon-container {
    margin-bottom: 1rem;
}

.success-icon {
    font-size: 4rem;
    color: #10b981;
    animation: success-pop 0.5s ease-out;
}

@keyframes success-pop {
    0% {
        transform: scale(0);
        opacity: 0;
    }
    50% {
        transform: scale(1.2);
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

.success-title {
    color: #10b981;
    margin: 0 0 1.5rem;
    font-size: 1.5rem;
}

.reward-celebration {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 2px solid #f59e0b;
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

.reward-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.reward-badge i {
    font-size: 2rem;
    color: #f59e0b;
    animation: star-spin 1s ease-out;
}

@keyframes star-spin {
    0% {
        transform: rotate(0deg) scale(0);
    }
    50% {
        transform: rotate(180deg) scale(1.2);
    }
    100% {
        transform: rotate(360deg) scale(1);
    }
}

.reward-amount {
    font-size: 2.5rem;
    font-weight: 700;
    color: #b45309;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}

.reward-message {
    margin: 0.5rem 0 0;
    color: #92400e;
    font-weight: 600;
}

.transaction-info {
    background-color: #f3f4f6;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
    text-align: left;
}

.transaction-info h4 {
    margin: 0 0 0.75rem;
    font-size: 0.9rem;
    color: #6b7280;
}

.tx-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e5e7eb;
}

.tx-row:last-child {
    border-bottom: none;
}

.tx-label {
    font-size: 0.85rem;
    color: #6b7280;
}

.tx-link {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-family: monospace;
    font-size: 0.85rem;
    color: var(--a11y-primary, #2563eb);
    text-decoration: none;
}

.tx-link:hover {
    text-decoration: underline;
}

.tx-link i {
    font-size: 0.75rem;
}

.new-balances {
    display: flex;
    justify-content: center;
    gap: 2rem;
    padding-top: 1rem;
}

.balance-item {
    text-align: center;
}

.balance-label {
    display: block;
    font-size: 0.85rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
}

.balance-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
}

.balance-value.loyalty {
    color: #f59e0b;
}

/* Error State */
.error-state {
    text-align: center;
    padding: 2rem 1rem;
}

.error-icon {
    font-size: 3rem;
    color: #dc2626;
}

.error-content h3 {
    color: #dc2626;
    margin: 1rem 0 0.5rem;
}

.error-message {
    color: #6b7280;
}

/* Footer */
.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
}

.confirm-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.confirm-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Wallet Status */
.wallet-status {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
}

.wallet-status.connected {
    background-color: #d1fae5;
    border: 1px solid #10b981;
}

.wallet-status.disconnected {
    background-color: #fef3c7;
    border: 1px solid #f59e0b;
}

.wallet-status-icon i {
    font-size: 1.5rem;
}

.wallet-status.connected .wallet-status-icon i {
    color: #10b981;
}

.wallet-status.disconnected .wallet-status-icon i {
    color: #f59e0b;
}

.wallet-status-text {
    flex: 1;
    font-weight: 500;
}

.wallet-status.connected .wallet-status-text {
    color: #065f46;
}

.wallet-status.disconnected .wallet-status-text {
    color: #92400e;
}

.btn-connect {
    background-color: #f59e0b;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    transition: background-color 0.2s;
}

.btn-connect:hover {
    background-color: #d97706;
}

.wallet-required-warning {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.75rem;
    background-color: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 0.5rem;
    color: #92400e;
    font-size: 0.9rem;
}

/* BSV Payment Row */
.bsv-row {
    background-color: #eff6ff;
    border: 1px solid #3b82f6;
}

.bsv-cost {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: #1d4ed8 !important;
}

.bsv-cost i {
    color: #f59e0b;
}

/* BSV Pay Button */
.bsv-pay-btn {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    border: none;
}

.bsv-pay-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
}

.bsv-pay-btn i {
    color: white;
}

/* Wallet Prompt State */
.wallet-prompt-state {
    text-align: center;
    padding: 2rem 1rem;
}

.wallet-prompt-content h3 {
    margin: 1rem 0 0.5rem;
    color: var(--a11y-primary, #2563eb);
}

.wallet-prompt-subtitle {
    color: #6b7280;
    margin: 0 0 1.5rem;
}

.wallet-icon-container {
    display: flex;
    justify-content: center;
}

.wallet-icon {
    font-size: 4rem;
    color: var(--a11y-primary, #2563eb);
}

.wallet-icon.pulse {
    animation: wallet-pulse 1.5s ease-in-out infinite;
}

@keyframes wallet-pulse {
    0%, 100% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.1);
        opacity: 0.8;
    }
}

.transaction-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
    background-color: #f3f4f6;
    border-radius: 0.5rem;
}

.tx-amount {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f59e0b;
}

.transaction-preview i {
    color: #9ca3af;
}

.tx-recipient {
    font-weight: 600;
    color: #1f2937;
}

/* Payment Method Tabs */
.payment-method-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.25rem;
    background-color: #f3f4f6;
    border-radius: 0.5rem;
}

.payment-method-tabs.three-tabs .tab-btn,
.payment-method-tabs.four-tabs .tab-btn {
    padding: 0.5rem 0.25rem;
    font-size: 0.75rem;
    flex-direction: column;
    gap: 0.2rem;
}

.payment-method-tabs.four-tabs {
    gap: 0.25rem;
}

.tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border: none;
    background-color: transparent;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    color: #6b7280;
    position: relative;
}

.tab-btn:hover {
    background-color: #e5e7eb;
}

.tab-btn.active {
    background-color: white;
    color: #1d4ed8;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.tab-btn.loyalty-tab.active {
    color: #d97706;
}

.tab-btn.loyalty-tab.has-points {
    background-color: #fef3c7;
}

.tab-btn.loyalty-tab.has-points.active {
    background-color: #fde68a;
}

/* Tokens tab styling */
.tab-btn.tokens-tab.active {
    color: #059669;
}

.tab-btn.tokens-tab.has-tokens {
    background-color: #d1fae5;
}

.tab-btn.tokens-tab.has-tokens.active {
    background-color: #a7f3d0;
}

.tokens-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    font-size: 0.6rem;
    font-weight: 700;
    padding: 2px 4px;
    border-radius: 10px;
    min-width: 16px;
    text-align: center;
}

.points-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 2px 5px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
}

.tab-btn i {
    font-size: 1.1rem;
}

/* Stripe Tab */
.tab-btn.stripe-tab {
    color: #635bff;
}

.tab-btn.stripe-tab.active {
    background-color: #635bff;
    color: white;
    border-color: #635bff;
}

/* Stripe Payment Section */
.stripe-payment-section {
    margin-top: 1rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #f0f0ff 0%, #fff 100%);
    border-radius: 0.75rem;
    border: 1px solid #e0e0ff;
}

.stripe-payment-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    font-weight: 600;
    color: #635bff;
}

.stripe-payment-header i {
    font-size: 1.5rem;
}

.stripe-price-display {
    text-align: center;
    padding: 1.5rem;
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 2px 8px rgba(99, 91, 255, 0.1);
    margin-bottom: 1rem;
}

.price-amount {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.25rem;
}

.price-amount .currency {
    font-size: 1rem;
    font-weight: 500;
    color: #6b7280;
}

.price-amount .price {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
}

.price-description {
    margin-top: 0.5rem;
    color: #6b7280;
    font-size: 0.875rem;
}

.stripe-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background-color: #f0fdf4;
    border-radius: 0.375rem;
    color: #15803d;
    font-size: 0.875rem;
}

.stripe-info i {
    font-size: 1rem;
}

.stripe-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.75rem;
    background-color: #fef2f2;
    border-radius: 0.375rem;
    color: #dc2626;
    font-size: 0.875rem;
}

.stripe-processing {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.75rem;
    background-color: #f0f0ff;
    border-radius: 0.375rem;
    color: #635bff;
    font-size: 0.875rem;
}

/* Stripe Button */
.stripe-btn {
    background: linear-gradient(135deg, #635bff 0%, #8b85ff 100%);
    border: none;
}

.stripe-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #524ddb 0%, #7a74e8 100%);
}

.stripe-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
}

/* Auto Payment Section */
.auto-payment-section {
    margin-top: 1rem;
}

/* Redemption Section */
.redemption-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px dashed #e5e7eb;
}

.redemption-progress {
    margin-bottom: 1rem;
}

.progress-bar-container {
    height: 12px;
    background-color: #e5e7eb;
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 0.5rem;
}

.progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
    border-radius: 6px;
    transition: width 0.5s ease-out;
}

.progress-text {
    font-size: 0.875rem;
    color: #6b7280;
    text-align: center;
    display: block;
}

.btn-redeem {
    width: 100%;
    padding: 1rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s;
    animation: pulse-gold 2s infinite;
}

.btn-redeem:hover {
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    transform: scale(1.02);
}

@keyframes pulse-gold {
    0%, 100% {
        box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
    }
    50% {
        box-shadow: 0 0 0 8px rgba(245, 158, 11, 0);
    }
}

.redeeming-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem;
    color: #f59e0b;
    font-weight: 500;
}

.redeeming-state i {
    font-size: 1.5rem;
}

.redemption-success {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-radius: 0.5rem;
    color: #92400e;
    font-weight: 600;
    margin-top: 1rem;
    animation: celebration 0.5s ease-out;
}

.redemption-success i {
    font-size: 1.5rem;
    animation: bounce 0.5s ease-out;
}

@keyframes celebration {
    0% {
        opacity: 0;
        transform: scale(0.8);
    }
    50% {
        transform: scale(1.05);
    }
    100% {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes bounce {
    0%, 100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-8px);
    }
}

/* Tokens Section */
.tokens-section {
    margin-top: 1rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    border-radius: 0.75rem;
    border: 2px solid #a7f3d0;
}

.tokens-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    font-weight: 600;
    color: #065f46;
    font-size: 1.1rem;
}

.tokens-header i {
    font-size: 1.5rem;
    color: #10b981;
}

.tokens-balance-display {
    text-align: center;
    margin-bottom: 1rem;
}

.tokens-amount {
    display: block;
    font-size: 4rem;
    font-weight: 800;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
}

.tokens-label {
    display: block;
    font-size: 1rem;
    color: #065f46;
    font-weight: 500;
    margin-top: 0.25rem;
}

.tokens-cost-info {
    text-align: center;
    margin-bottom: 1.5rem;
    color: #065f46;
    font-size: 0.95rem;
}

.tokens-cost-info strong {
    color: #047857;
}

.use-tokens-section {
    text-align: center;
}

.btn-use-tokens {
    width: 100%;
    padding: 1rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s;
    animation: pulse-green 2s infinite;
}

.btn-use-tokens:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    transform: scale(1.02);
}

@keyframes pulse-green {
    0%, 100% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
    }
    50% {
        box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
    }
}

.tokens-hint {
    margin-top: 0.75rem;
    font-size: 0.875rem;
    color: #065f46;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
}

.tokens-hint i {
    color: #f59e0b;
}

.using-tokens-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem;
    color: #10b981;
    font-weight: 500;
}

.using-tokens-state i {
    font-size: 1.5rem;
}

.token-use-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    border-radius: 0.75rem;
    border: 2px solid #86efac;
    animation: celebration 0.5s ease-out;
}

.token-use-success i {
    font-size: 2.5rem;
    color: #16a34a;
}

.token-use-success .success-text {
    text-align: center;
}

.token-use-success .success-text strong {
    display: block;
    font-size: 1.25rem;
    color: #166534;
    margin-bottom: 0.25rem;
}

.token-use-success .success-text span {
    color: #15803d;
}

.not-enough-tokens {
    text-align: center;
    padding: 1rem;
    background-color: #fef3c7;
    border-radius: 0.5rem;
    color: #92400e;
}

.not-enough-tokens i {
    font-size: 1.5rem;
    color: #f59e0b;
    display: block;
    margin-bottom: 0.5rem;
}

.not-enough-tokens .buy-hint {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: #b45309;
}

/* Loyalty Section */
.loyalty-section {
    margin-top: 1rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
    border-radius: 0.75rem;
    border: 2px solid #fde68a;
}

.loyalty-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    font-weight: 600;
    color: #92400e;
    font-size: 1.1rem;
}

.loyalty-header i {
    font-size: 1.5rem;
    color: #f59e0b;
}

.loyalty-balance-display {
    text-align: center;
    margin-bottom: 1.5rem;
}

.loyalty-amount {
    display: block;
    font-size: 4rem;
    font-weight: 800;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
}

.loyalty-label {
    display: block;
    font-size: 1rem;
    color: #92400e;
    font-weight: 500;
    margin-top: 0.25rem;
}

.loyalty-progress {
    margin-bottom: 1.5rem;
}

.redeem-section {
    text-align: center;
}

.redeem-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    color: #92400e;
    font-weight: 500;
}

.redeem-info i {
    font-size: 1.25rem;
    color: #f59e0b;
}

.redemption-success-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    border-radius: 0.75rem;
    border: 2px solid #86efac;
    animation: celebration 0.5s ease-out;
}

.redemption-success-box i {
    font-size: 2.5rem;
    color: #16a34a;
}

.redemption-success-box .success-text {
    text-align: center;
}

.redemption-success-box .success-text strong {
    display: block;
    font-size: 1.25rem;
    color: #166534;
    margin-bottom: 0.25rem;
}

.redemption-success-box .success-text span {
    color: #15803d;
}

.redemption-success-box .new-balance {
    font-size: 0.875rem;
    color: #166534;
    font-weight: 500;
}

.not-enough-points {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background-color: #fef3c7;
    border-radius: 0.5rem;
    color: #92400e;
    font-size: 0.9rem;
}

.not-enough-points i {
    color: #f59e0b;
}

.success-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.75rem;
    background-color: #fef3c7;
    border-radius: 0.5rem;
    color: #92400e;
    font-size: 0.875rem;
}

.success-hint i {
    color: #f59e0b;
}
</style>

