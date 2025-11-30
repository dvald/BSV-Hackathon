<template>
    <ModalDialogContainer ref="modalContainer" v-model:display="displayStatus" :static="isProcessing">
        <div class="modal-dialog modal-md service-payment-modal" role="document" @click="stopPropagationEvent">
            <!-- Header -->
            <div class="modal-header">
                <div class="modal-title">
                    <i :class="'mdi ' + serviceIcon" aria-hidden="true"></i>
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
                        <i :class="'mdi ' + serviceIcon + ' payment-icon'" aria-hidden="true"></i>
                        <h3>{{ serviceActionTitle }}</h3>
                    </div>

                    <!-- ========================================== -->
                    <!-- FREE SERVICE VIEW (Accessible Parking) -->
                    <!-- ========================================== -->
                    <template v-if="serviceType === 'free'">
                        <div class="free-service-section">
                            <div class="free-service-badge">
                                <i class="mdi mdi-check-circle" aria-hidden="true"></i>
                                <span>{{ $t("Free Service") }}</span>
                            </div>
                            
                            <div class="free-service-info">
                                <p class="free-description">
                                    {{ serviceDescription || $t("This service is free for citizens with valid credentials.") }}
                                </p>
                                
                                <div class="free-benefit-list">
                                    <div class="benefit-item">
                                        <i class="mdi mdi-parking" aria-hidden="true"></i>
                                        <span>{{ $t("Access to reserved accessible parking spaces") }}</span>
                                    </div>
                                    <div class="benefit-item">
                                        <i class="mdi mdi-infinity" aria-hidden="true"></i>
                                        <span>{{ $t("Unlimited use with valid credential") }}</span>
                                    </div>
                                    <div class="benefit-item">
                                        <i class="mdi mdi-map-marker-check" aria-hidden="true"></i>
                                        <span>{{ $t("Valid in all municipal parking areas") }}</span>
                                    </div>
                                </div>

                                <div v-if="reward > 0" class="free-reward-hint">
                                    <i class="mdi mdi-star" aria-hidden="true"></i>
                                    <span>{{ $t("You will earn") }} +{{ reward }} {{ $t("loyalty points") }}</span>
                                </div>
                            </div>

                            <!-- Activate Free Service Button -->
                            <div v-if="!isUsingTokens && !tokenUseSuccess" class="free-action-section">
                                <button 
                                    type="button"
                                    class="a11y-btn a11y-btn-primary a11y-btn-large free-activate-btn"
                                    @click="activateFreeService"
                                >
                                    <i class="mdi mdi-check-decagram" aria-hidden="true"></i>
                                    {{ serviceButtonText }}
                                </button>
                            </div>

                            <!-- Processing State -->
                            <div v-if="isUsingTokens" class="using-tokens-state">
                                <i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i>
                                <span>{{ $t("Activating service...") }}</span>
                            </div>

                            <!-- Success State -->
                            <div v-if="tokenUseSuccess" class="token-use-success">
                                <i :class="'mdi ' + serviceIcon" aria-hidden="true"></i>
                                <div class="success-text">
                                    <strong>🎉 {{ serviceSuccessMessage }}</strong>
                                    <span v-if="reward > 0">+{{ reward }} {{ $t("loyalty points earned!") }}</span>
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- ========================================== -->
                    <!-- SUBSCRIPTION SERVICE VIEW (Transport Pass) -->
                    <!-- ========================================== -->
                    <template v-else-if="serviceType === 'subscription'">
                        <div class="subscription-section">
                            <div class="subscription-badge">
                                <i class="mdi mdi-calendar-month" aria-hidden="true"></i>
                                <span>{{ $t("Monthly Pass") }}</span>
                            </div>

                            <div class="subscription-info">
                                <p class="subscription-description">
                                    {{ serviceDescription || $t("Get unlimited access to public transport for a full month.") }}
                                </p>

                                <div class="subscription-benefit-list">
                                    <div class="benefit-item">
                                        <i class="mdi mdi-bus" aria-hidden="true"></i>
                                        <span>{{ $t("Unlimited bus rides") }}</span>
                                    </div>
                                    <div class="benefit-item">
                                        <i class="mdi mdi-subway-variant" aria-hidden="true"></i>
                                        <span>{{ $t("Metro and tram access") }}</span>
                                    </div>
                                    <div class="benefit-item">
                                        <i class="mdi mdi-percent" aria-hidden="true"></i>
                                        <span>{{ $t("20% discount on standard fares") }}</span>
                                    </div>
                                </div>

                                <div class="subscription-price-box">
                                    <div class="price-label">{{ $t("Monthly price") }}</div>
                                    <div class="price-value">{{ cost }} <span class="price-unit">{{ $t("Tokens") }}</span></div>
                                    <div v-if="reward > 0" class="price-reward">+{{ reward }} {{ $t("loyalty points") }}</div>
                                </div>
                            </div>

                            <!-- Payment Tabs for Subscription -->
                            <div class="payment-method-tabs three-tabs">
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
                                <button 
                                    type="button"
                                    class="tab-btn"
                                    :class="{ active: paymentMethod === 'manual' }"
                                    @click="paymentMethod = 'manual'"
                                >
                                    <i class="mdi mdi-form-textbox" aria-hidden="true"></i>
                                    {{ $t("TXID") }}
                                </button>
                                <button 
                                    type="button"
                                    class="tab-btn"
                                    :class="{ active: paymentMethod === 'auto' }"
                                    @click="paymentMethod = 'auto'"
                                >
                                    <i class="mdi mdi-wallet" aria-hidden="true"></i>
                                    {{ $t("Wallet") }}
                                </button>
                            </div>

                            <!-- Token Payment for Subscription -->
                            <div v-if="paymentMethod === 'tokens'" class="subscription-tokens-view">
                                <div class="tokens-balance-display compact">
                                    <span class="tokens-label">{{ $t("Your balance") }}:</span>
                                    <span class="tokens-amount">{{ serviceBalance }}</span>
                                    <span class="tokens-label">{{ $t("tokens") }}</span>
                                </div>

                                <div v-if="serviceBalance >= cost && !isUsingTokens && !tokenUseSuccess" class="use-tokens-section">
                                    <button 
                                        type="button"
                                        class="a11y-btn a11y-btn-primary a11y-btn-large"
                                        @click="useServiceTokens"
                                    >
                                        <i class="mdi mdi-check-decagram" aria-hidden="true"></i>
                                        {{ serviceButtonText }}
                                    </button>
                                </div>

                                <div v-if="serviceBalance < cost && !isUsingTokens" class="not-enough-tokens">
                                    <i class="mdi mdi-alert-circle-outline" aria-hidden="true"></i>
                                    <span>{{ $t("Not enough tokens.") }} {{ $t("You need") }} {{ cost - serviceBalance }} {{ $t("more.") }}</span>
                                    <p class="buy-hint">{{ $t("Buy more tokens in the TXID or Wallet tab.") }}</p>
                                </div>
                            </div>

                            <!-- Processing State -->
                            <div v-if="isUsingTokens" class="using-tokens-state">
                                <i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i>
                                <span>{{ $t("Processing purchase...") }}</span>
                            </div>

                            <!-- Success State -->
                            <div v-if="tokenUseSuccess" class="token-use-success">
                                <i :class="'mdi ' + serviceIcon" aria-hidden="true"></i>
                                <div class="success-text">
                                    <strong>🎉 {{ serviceSuccessMessage }}</strong>
                                    <span>+{{ reward }} {{ $t("loyalty points earned!") }}</span>
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- ========================================== -->
                    <!-- PAID SERVICE VIEW (Family Parking - Default) -->
                    <!-- ========================================== -->
                    <template v-else>
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
                            <!-- Tab 2: Buy with TXID -->
                            <button 
                                type="button"
                                class="tab-btn"
                                :class="{ active: paymentMethod === 'manual' }"
                                @click="paymentMethod = 'manual'"
                            >
                                <i class="mdi mdi-form-textbox" aria-hidden="true"></i>
                                {{ $t("TXID") }}
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
                        <div v-if="paymentMethod === 'manual' || paymentMethod === 'auto'" class="payment-details">
                            <div class="detail-row bsv-row">
                                <span class="detail-label">{{ $t("Service Cost") }}:</span>
                                <span class="detail-value cost bsv-cost">
                                    <i class="mdi mdi-bitcoin" aria-hidden="true"></i>
                                    {{ satoshiCost }} sats
                                </span>
                            </div>
                            <div class="detail-row service-row">
                                <span class="detail-label">{{ $t("Service") }}:</span>
                                <span class="detail-value service">{{ serviceEmoji }} {{ serviceName }}</span>
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
                                    {{ serviceButtonText }}
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
                                <i :class="'mdi ' + serviceIcon" aria-hidden="true"></i>
                                <div class="success-text">
                                    <strong>🎉 {{ serviceSuccessMessage }}</strong>
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

                    <!-- MANUAL PAYMENT VIEW -->
                    <div v-if="paymentMethod === 'manual'" class="manual-payment-section">
                        <div class="manual-payment-header">
                            <i class="mdi mdi-wallet-travel" aria-hidden="true"></i>
                            <span>{{ $t("Pay with BSV Desktop Wallet") }}</span>
                        </div>

                        <!-- Step 1: Payment Address -->
                        <div class="manual-step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <label>{{ $t("Send BSV to this address") }}:</label>
                                <div class="address-box">
                                    <code class="payment-address">{{ backendAddress || $t("Loading...") }}</code>
                                    <button 
                                        type="button" 
                                        class="btn-copy" 
                                        @click="copyAddress"
                                        :title="$t('Copy address')"
                                    >
                                        <i class="mdi" :class="addressCopied ? 'mdi-check' : 'mdi-content-copy'" aria-hidden="true"></i>
                                    </button>
                                </div>
                                <a 
                                    v-if="backendAddress"
                                    :href="bsvPaymentUri" 
                                    class="btn-open-wallet"
                                    target="_blank"
                                >
                                    <i class="mdi mdi-open-in-new" aria-hidden="true"></i>
                                    {{ $t("Open BSV Wallet") }}
                                </a>
                            </div>
                        </div>

                        <!-- Step 2: Enter TXID -->
                        <div class="manual-step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <label for="manual-txid">{{ $t("Paste your Transaction ID (TXID)") }}:</label>
                                <input 
                                    id="manual-txid"
                                    v-model="manualTxid"
                                    type="text"
                                    class="txid-input"
                                    :placeholder="$t('64-character transaction ID')"
                                    maxlength="64"
                                />
                                <div v-if="manualTxidError" class="txid-error">
                                    <i class="mdi mdi-alert-circle" aria-hidden="true"></i>
                                    {{ manualTxidError }}
                                </div>
                            </div>
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
                    </template>
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
                    <!-- Manual Payment Button -->
                    <button 
                        v-if="paymentMethod === 'manual'"
                        type="button" 
                        class="btn btn-primary confirm-btn verify-btn"
                        :disabled="!manualTxid || manualTxid.length !== 64 || isProcessing"
                        @click="verifyManualPayment"
                    >
                        <i class="mdi mdi-check-circle" aria-hidden="true"></i>
                        {{ $t("Verify Payment") }}
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
        serviceIcon: {
            type: String,
            default: "mdi-human-male-child"
        },
        serviceEmoji: {
            type: String,
            default: "👨‍👩‍👧‍👦"
        },
        serviceActionTitle: {
            type: String,
            default: "Reserve Parking Space"
        },
        serviceButtonText: {
            type: String,
            default: "Reserve with my Tokens"
        },
        serviceSuccessMessage: {
            type: String,
            default: "Space Reserved!"
        },
        // Service type: 'paid' (tokens/BSV), 'free' (no cost), 'subscription' (monthly pass)
        serviceType: {
            type: String as () => 'paid' | 'free' | 'subscription',
            default: 'paid'
        },
        // Description for the service benefit
        serviceDescription: {
            type: String,
            default: ''
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

        // Payment method (manual = txid, auto = x402, loyalty = redeem points)
        const paymentMethod = ref<'tokens' | 'manual' | 'auto' | 'loyalty'>('manual'); // Default: manual for hackathon
        
        // Manual payment state
        const manualTxid = ref('');
        const manualTxidError = ref('');
        const backendAddress = ref('');
        const addressCopied = ref(false);

        // Token balances (fetched from backend)
        const serviceBalance = ref(0);
        const loyaltyBalance = ref(0);

        // Use tokens state
        const isUsingTokens = ref(false);
        const tokenUseSuccess = ref(false);

        // Redemption state
        const isRedeeming = ref(false);
        const redemptionSuccess = ref(false);

        // Computed: BSV Payment URI for external wallet
        const bsvPaymentUri = computed(() => {
            if (!backendAddress.value) return '#';
            return `bitcoin:${backendAddress.value}?amount=${satoshiCost.value / 100000000}`;
        });

        // Fetch backend payment address
        const fetchPaymentAddress = async () => {
            try {
                const response = await fetch(getApiUrl('/api/v1/gamification/payment-address'));
                if (response.ok) {
                    const data = await response.json();
                    backendAddress.value = data.address;
                    if (data.satoshisRequired) {
                        satoshiCost.value = data.satoshisRequired;
                    }
                }
            } catch (error) {
                console.error('[ServicePaymentModal] Error fetching payment address:', error);
            }
        };

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

        // Watch for display changes to fetch backend key and address
        watch(() => props.display, (newVal) => {
            if (newVal) {
                if (!backendIdentityKey.value) {
                    fetchBackendIdentityKey();
                }
                if (!backendAddress.value) {
                    fetchPaymentAddress();
                }
                // Always fetch loyalty balance when modal opens
                fetchBalances();
                // Reset manual payment state
                manualTxid.value = '';
                manualTxidError.value = '';
                addressCopied.value = false;
            }
        }, { immediate: true });

        // Copy address to clipboard
        const copyAddress = async () => {
            if (backendAddress.value) {
                try {
                    await navigator.clipboard.writeText(backendAddress.value);
                    addressCopied.value = true;
                    setTimeout(() => { addressCopied.value = false; }, 2000);
                } catch (error) {
                    console.error('[ServicePaymentModal] Failed to copy address:', error);
                }
            }
        };

        const connectWallet = async () => {
            await connect();
        };

        const formatTxId = (txid: string | null): string => {
            if (!txid) return 'N/A';
            if (txid.length <= 16) return txid;
            return `${txid.substring(0, 8)}...${txid.substring(txid.length - 8)}`;
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

        /**
         * Verify Manual Payment - For external wallets (BSV Desktop)
         * User enters TXID after sending BSV from external wallet
         */
        const verifyManualPayment = async () => {
            // Validate TXID format
            const txidRegex = /^[a-fA-F0-9]{64}$/;
            if (!txidRegex.test(manualTxid.value)) {
                manualTxidError.value = 'Invalid TXID format. Must be 64 hexadecimal characters.';
                return;
            }

            manualTxidError.value = '';
            state.value = 'loading';
            isProcessing.value = true;

            try {
                console.log('[ServicePaymentModal] Verifying manual payment with TXID:', manualTxid.value);

                const response = await fetch(getApiUrl('/api/v1/gamification/pay-service'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-bsv-identity-key': identityKey.value || props.userId
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        serviceId: props.serviceId,
                        manualTxid: manualTxid.value
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || data.message || 'Payment verification failed');
                }

                console.log('[ServicePaymentModal] Manual payment verified!', data);

                // Success!
                bsvPaymentTxid.value = data.bsvTxid || data.txIds?.bsvPayment || manualTxid.value;
                txIds.value = {
                    // Backend sends: txIds.bsvPayment (payment) and txIds.loyalty (reward)
                    burn: data.txIds?.burn || data.txIds?.bsvPayment || manualTxid.value,
                    mint: data.txIds?.mint || data.txIds?.loyalty || null
                };
                newBalances.value = {
                    serviceToken: data.balances?.serviceToken || 0,
                    loyaltyToken: data.balances?.loyaltyToken || 0
                };

                state.value = 'success';
                emit('payment-success', data);

            } catch (error: any) {
                console.error('[ServicePaymentModal] Manual payment error:', error);
                manualTxidError.value = error.message || 'Payment verification failed';
                errorMessage.value = error.message || 'Payment verification failed';
                state.value = 'error';
            } finally {
                isProcessing.value = false;
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

        // Activate FREE service (no cost, just grant access and minimal points)
        const activateFreeService = async () => {
            isUsingTokens.value = true;
            tokenUseSuccess.value = false;
            
            try {
                const userKey = identityKey.value;
                if (!userKey) {
                    throw new Error('User identity not available');
                }

                // Call the activate-free-service endpoint (grants access, mints minimal LOYALTY_TOKEN)
                const response = await fetch(getApiUrl('/api/v1/gamification/activate-free-service'), {
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
                    throw new Error(data.message || data.error || 'Service activation failed');
                }

                // Update balances with new values
                loyaltyBalance.value = data.balances?.loyaltyToken || 0;
                
                newBalances.value = {
                    serviceToken: data.balances?.serviceToken || 0,
                    loyaltyToken: data.balances?.loyaltyToken || 0
                };

                txIds.value = {
                    burn: null,
                    mint: data.txIds?.mint || data.txIds?.loyalty || null
                };

                // Show success
                tokenUseSuccess.value = true;
                state.value = 'success';
                emit('payment-success', data);

            } catch (error: any) {
                console.error('[ServicePaymentModal] Free service activation error:', error);
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
            // Manual payment
            manualTxid,
            manualTxidError,
            backendAddress,
            addressCopied,
            bsvPaymentUri,
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
            verifyManualPayment,
            copyAddress,
            connectWallet,
            useServiceTokens,
            activateFreeService,
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
    max-height: calc(100vh - var(--top-bar-size) - 2rem);
    margin-top: var(--top-bar-size);
    display: flex;
    flex-direction: column;
    border-radius: var(--a11y-border-radius, 8px);
}

.service-payment-modal .modal-header {
    flex-shrink: 0;
}

.service-payment-modal .modal-body {
    flex: 1;
    overflow-y: auto;
}

.service-payment-modal .modal-footer {
    flex-shrink: 0;
}

.modal-header .modal-title {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
}

.modal-header .modal-title i {
    font-size: 1.5rem;
    color: var(--a11y-primary);
}

/* Confirm State */
.payment-info {
    padding: var(--a11y-spacing-md) 0;
}

.payment-header {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-md);
    margin-bottom: var(--a11y-spacing-lg);
    padding-bottom: var(--a11y-spacing-md);
    border-bottom: 1px solid var(--theme-border-color);
}

.payment-icon {
    font-size: 2.5rem;
    color: var(--a11y-primary);
}

.payment-header h3 {
    margin: 0;
    font-size: var(--a11y-font-size-large);
}

.payment-details {
    display: flex;
    flex-direction: column;
    gap: var(--a11y-spacing-sm);
}

.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--a11y-spacing-sm);
    background-color: var(--mci-gray-100, #f8f9fa);
    border-radius: var(--a11y-border-radius);
}

.detail-label {
    font-weight: 500;
    color: var(--a11y-text-secondary);
}

.detail-value {
    font-weight: 600;
}

.detail-value.cost {
    color: var(--a11y-error);
}

.detail-value.balance {
    color: var(--a11y-primary);
}

.detail-value.balance.insufficient {
    color: var(--a11y-error);
}

.reward-row {
    background-color: var(--mci-gray-100, #f8f9fa);
    border: 1px solid var(--theme-border-color);
}

.detail-value.reward {
    color: var(--a11y-primary);
    font-size: 1.1rem;
}

.insufficient-funds-warning {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    margin-top: var(--a11y-spacing-md);
    padding: var(--a11y-spacing-sm);
    background-color: var(--a11y-error-bg, #fef2f2);
    border: 1px solid var(--a11y-error);
    border-radius: var(--a11y-border-radius);
    color: var(--a11y-error);
    font-size: var(--a11y-font-size-small);
}

/* Loading State */
.loading-state {
    text-align: center;
    padding: var(--a11y-spacing-xl) var(--a11y-spacing-md);
}

.loading-content h3 {
    margin: var(--a11y-spacing-md) 0 var(--a11y-spacing-sm);
    color: var(--a11y-primary);
}

.loading-subtitle {
    color: var(--a11y-text-secondary);
    margin: 0;
}

.spinner-container {
    display: flex;
    justify-content: center;
}

.loading-spinner {
    font-size: 3rem;
    color: var(--a11y-primary);
}

.bsv-animation {
    display: flex;
    justify-content: center;
    gap: var(--a11y-spacing-sm);
    margin-top: var(--a11y-spacing-lg);
}

.bsv-dot {
    width: 10px;
    height: 10px;
    background-color: var(--a11y-primary);
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
    padding: var(--a11y-spacing-lg) var(--a11y-spacing-md);
}

.success-icon-container {
    margin-bottom: var(--a11y-spacing-md);
}

.success-icon {
    font-size: 4rem;
    color: var(--a11y-primary);
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
    color: var(--a11y-primary);
    margin: 0 0 var(--a11y-spacing-lg);
    font-size: var(--a11y-font-size-xlarge, 1.5rem);
}

.reward-celebration {
    background-color: var(--mci-gray-100, #f8f9fa);
    border: 2px solid var(--a11y-primary);
    border-radius: var(--a11y-border-radius);
    padding: var(--a11y-spacing-lg);
    margin-bottom: var(--a11y-spacing-lg);
}

.reward-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-sm);
}

.reward-badge i {
    font-size: 2rem;
    color: var(--a11y-primary);
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
    color: var(--a11y-primary);
}

.reward-message {
    margin: var(--a11y-spacing-sm) 0 0;
    color: var(--a11y-text-secondary);
    font-weight: 600;
}

.transaction-info {
    background-color: var(--mci-gray-100, #f8f9fa);
    border-radius: var(--a11y-border-radius);
    padding: var(--a11y-spacing-md);
    margin-bottom: var(--a11y-spacing-md);
    text-align: left;
}

.transaction-info h4 {
    margin: 0 0 var(--a11y-spacing-sm);
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
}

.tx-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--a11y-spacing-sm) 0;
    border-bottom: 1px solid var(--theme-border-color);
}

.tx-row:last-child {
    border-bottom: none;
}

.tx-label {
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
}

.tx-link {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
    font-family: monospace;
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-primary);
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
    gap: var(--a11y-spacing-xl);
    padding-top: var(--a11y-spacing-md);
}

.balance-item {
    text-align: center;
}

.balance-label {
    display: block;
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
    margin-bottom: var(--a11y-spacing-xs);
}

.balance-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--a11y-text);
}

.balance-value.loyalty {
    color: var(--a11y-primary);
}

/* Error State */
.error-state {
    text-align: center;
    padding: var(--a11y-spacing-xl) var(--a11y-spacing-md);
}

.error-icon {
    font-size: 3rem;
    color: var(--a11y-error);
}

.error-content h3 {
    color: var(--a11y-error);
    margin: var(--a11y-spacing-md) 0 var(--a11y-spacing-sm);
}

.error-message {
    color: var(--a11y-text-secondary);
}

/* Footer */
.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--a11y-spacing-sm);
    padding-top: var(--a11y-spacing-md);
    border-top: 1px solid var(--theme-border-color, #e0e0e0);
    background-color: var(--modal-bg-color, white);
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
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-sm) var(--a11y-spacing-md);
    border-radius: var(--a11y-border-radius);
    margin-bottom: var(--a11y-spacing-md);
}

.wallet-status.connected {
    background-color: var(--mci-gray-100, #f8f9fa);
    border: 1px solid var(--a11y-primary);
}

.wallet-status.disconnected {
    background-color: var(--mci-gray-100, #f8f9fa);
    border: 1px solid var(--theme-border-color);
}

.wallet-status-icon i {
    font-size: 1.5rem;
}

.wallet-status.connected .wallet-status-icon i {
    color: var(--a11y-primary);
}

.wallet-status.disconnected .wallet-status-icon i {
    color: var(--a11y-text-secondary);
}

.wallet-status-text {
    flex: 1;
    font-weight: 500;
}

.wallet-status.connected .wallet-status-text {
    color: var(--a11y-primary);
}

.wallet-status.disconnected .wallet-status-text {
    color: var(--a11y-text-secondary);
}

.btn-connect {
    background-color: var(--a11y-primary);
    color: white;
    border: none;
    padding: var(--a11y-spacing-sm) var(--a11y-spacing-md);
    border-radius: var(--a11y-border-radius);
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
    transition: background-color 0.2s;
}

.btn-connect:hover {
    background-color: var(--a11y-primary-dark);
}

.wallet-required-warning {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    margin-top: var(--a11y-spacing-md);
    padding: var(--a11y-spacing-sm);
    background-color: var(--mci-gray-100, #f8f9fa);
    border: 1px solid var(--theme-border-color);
    border-radius: var(--a11y-border-radius);
    color: var(--a11y-text-secondary);
    font-size: var(--a11y-font-size-small);
}

/* BSV Payment Row */
.bsv-row {
    background-color: var(--mci-gray-100, #f8f9fa);
    border: 1px solid var(--a11y-primary);
}

.bsv-cost {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
    color: var(--a11y-primary) !important;
}

.bsv-cost i {
    color: var(--a11y-primary);
}

/* BSV Pay Button */
.bsv-pay-btn {
    background-color: var(--a11y-primary);
    border: none;
}

.bsv-pay-btn:hover:not(:disabled) {
    background-color: var(--a11y-primary-dark);
}

.bsv-pay-btn i {
    color: white;
}

/* Wallet Prompt State */
.wallet-prompt-state {
    text-align: center;
    padding: var(--a11y-spacing-xl) var(--a11y-spacing-md);
}

.wallet-prompt-content h3 {
    margin: var(--a11y-spacing-md) 0 var(--a11y-spacing-sm);
    color: var(--a11y-primary);
}

.wallet-prompt-subtitle {
    color: var(--a11y-text-secondary);
    margin: 0 0 var(--a11y-spacing-lg);
}

.wallet-icon-container {
    display: flex;
    justify-content: center;
}

.wallet-icon {
    font-size: 4rem;
    color: var(--a11y-primary);
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
    gap: var(--a11y-spacing-md);
    padding: var(--a11y-spacing-md);
    background-color: var(--mci-gray-100, #f8f9fa);
    border-radius: var(--a11y-border-radius);
}

.tx-amount {
    font-size: var(--a11y-font-size-large);
    font-weight: 700;
    color: var(--a11y-primary);
}

.transaction-preview i {
    color: var(--a11y-text-secondary);
}

.tx-recipient {
    font-weight: 600;
    color: var(--a11y-text);
}

/* Payment Method Tabs */
.payment-method-tabs {
    display: flex;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-md);
    padding: var(--a11y-spacing-xs);
    background-color: var(--mci-gray-100, #f8f9fa);
    border-radius: var(--a11y-border-radius);
}

.payment-method-tabs.three-tabs .tab-btn,
.payment-method-tabs.four-tabs .tab-btn {
    padding: var(--a11y-spacing-sm) var(--a11y-spacing-xs);
    font-size: var(--a11y-font-size-small);
    flex-direction: column;
    gap: var(--a11y-spacing-xs);
}

.payment-method-tabs.four-tabs {
    gap: var(--a11y-spacing-xs);
}

.tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-sm) var(--a11y-spacing-md);
    border: none;
    background-color: transparent;
    border-radius: var(--a11y-border-radius);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--a11y-text-secondary);
    position: relative;
}

.tab-btn:hover {
    background-color: var(--theme-border-color);
}

.tab-btn.active {
    background-color: var(--modal-bg-color, white);
    color: var(--a11y-primary);
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.tab-btn.loyalty-tab.active {
    color: var(--a11y-primary);
}

.tab-btn.loyalty-tab.has-points {
    background-color: var(--mci-gray-100, #f8f9fa);
}

.tab-btn.loyalty-tab.has-points.active {
    background-color: var(--mci-gray-100, #f8f9fa);
}

/* Tokens tab styling */
.tab-btn.tokens-tab.active {
    color: var(--a11y-primary);
}

.tab-btn.tokens-tab.has-tokens {
    background-color: var(--mci-gray-100, #f8f9fa);
}

.tab-btn.tokens-tab.has-tokens.active {
    background-color: var(--mci-gray-100, #f8f9fa);
}

.tokens-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background-color: var(--a11y-primary);
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
    background-color: var(--a11y-primary);
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

/* Manual Payment Section */
.manual-payment-section {
    margin-top: var(--a11y-spacing-md);
    padding: var(--a11y-spacing-md);
    background-color: var(--mci-gray-100, #f8f9fa);
    border-radius: var(--a11y-border-radius);
    border: 1px solid var(--theme-border-color);
}

.manual-payment-header {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-md);
    font-weight: 600;
    color: var(--a11y-text);
}

.manual-payment-header i {
    font-size: 1.25rem;
    color: var(--a11y-primary);
}

.manual-step {
    display: flex;
    gap: var(--a11y-spacing-md);
    margin-bottom: var(--a11y-spacing-md);
    padding-bottom: var(--a11y-spacing-md);
    border-bottom: 1px solid var(--theme-border-color);
}

.manual-step:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
}

.step-number {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--a11y-primary);
    color: white;
    border-radius: 50%;
    font-weight: 700;
    font-size: var(--a11y-font-size-small);
    flex-shrink: 0;
}

.step-content {
    flex: 1;
}

.step-content label {
    display: block;
    font-size: var(--a11y-font-size-small);
    font-weight: 500;
    color: var(--a11y-text-secondary);
    margin-bottom: var(--a11y-spacing-sm);
}

.address-box {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-sm);
    background-color: var(--modal-bg-color, white);
    border: 1px solid var(--theme-border-color);
    border-radius: var(--a11y-border-radius);
    margin-bottom: var(--a11y-spacing-sm);
}

.payment-address {
    flex: 1;
    font-family: monospace;
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text);
    word-break: break-all;
}

.btn-copy {
    padding: var(--a11y-spacing-xs) var(--a11y-spacing-sm);
    background-color: var(--theme-border-color);
    border: none;
    border-radius: var(--a11y-border-radius);
    cursor: pointer;
    transition: background-color 0.2s;
}

.btn-copy:hover {
    background-color: var(--a11y-text-secondary);
}

.btn-copy i {
    font-size: 1rem;
    color: var(--a11y-text);
}

.btn-open-wallet {
    display: inline-flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
    padding: var(--a11y-spacing-sm) var(--a11y-spacing-md);
    background-color: var(--a11y-primary);
    color: white;
    border-radius: var(--a11y-border-radius);
    text-decoration: none;
    font-weight: 500;
    font-size: var(--a11y-font-size-small);
    transition: background-color 0.2s;
}

.btn-open-wallet:hover {
    background-color: var(--a11y-primary-dark);
}

.txid-input {
    width: 100%;
    padding: var(--a11y-spacing-sm);
    font-family: monospace;
    font-size: var(--a11y-font-size-small);
    border: 1px solid var(--theme-border-color);
    border-radius: var(--a11y-border-radius);
    background-color: var(--modal-bg-color, white);
}

.txid-input:focus {
    outline: none;
    border-color: var(--a11y-primary);
    box-shadow: 0 0 0 3px rgba(var(--a11y-primary-rgb, 59, 130, 246), 0.1);
}

.txid-error {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
    margin-top: var(--a11y-spacing-sm);
    color: var(--a11y-error);
    font-size: var(--a11y-font-size-small);
}

/* Auto Payment Section */
.auto-payment-section {
    margin-top: var(--a11y-spacing-md);
}

/* Verify Button */
.verify-btn {
    background-color: var(--a11y-primary);
    border: none;
}

.verify-btn:hover:not(:disabled) {
    background-color: var(--a11y-primary-dark);
}

.verify-btn:disabled {
    background-color: var(--a11y-text-secondary);
    cursor: not-allowed;
}

/* Redemption Section */
.redemption-section {
    margin-top: var(--a11y-spacing-lg);
    padding-top: var(--a11y-spacing-lg);
    border-top: 1px dashed var(--theme-border-color);
}

.redemption-progress {
    margin-bottom: var(--a11y-spacing-md);
}

.progress-bar-container {
    height: 12px;
    background-color: var(--theme-border-color);
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: var(--a11y-spacing-sm);
}

.progress-bar-fill {
    height: 100%;
    background-color: var(--a11y-primary);
    border-radius: 6px;
    transition: width 0.5s ease-out;
}

.progress-text {
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
    text-align: center;
    display: block;
}

.btn-redeem {
    width: 100%;
    padding: var(--a11y-spacing-md) var(--a11y-spacing-lg);
    font-size: var(--a11y-font-size-base);
    font-weight: 600;
    color: white;
    background-color: var(--a11y-primary);
    border: none;
    border-radius: var(--a11y-border-radius);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-sm);
    transition: all 0.2s;
}

.btn-redeem:hover {
    background-color: var(--a11y-primary-dark);
}

.redeeming-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-md);
    color: var(--a11y-primary);
    font-weight: 500;
}

.redeeming-state i {
    font-size: 1.5rem;
}

.redemption-success {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-md);
    background-color: var(--mci-gray-100, #f8f9fa);
    border-radius: var(--a11y-border-radius);
    color: var(--a11y-primary);
    font-weight: 600;
    margin-top: var(--a11y-spacing-md);
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
    margin-top: var(--a11y-spacing-md);
    padding: var(--a11y-spacing-lg);
    background-color: var(--mci-gray-100, #f8f9fa);
    border-radius: var(--a11y-border-radius);
    border: 2px solid var(--a11y-primary);
}

.tokens-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-lg);
    font-weight: 600;
    color: var(--a11y-primary);
    font-size: var(--a11y-font-size-large);
}

.tokens-header i {
    font-size: 1.5rem;
    color: var(--a11y-primary);
}

.tokens-balance-display {
    text-align: center;
    margin-bottom: var(--a11y-spacing-md);
}

.tokens-amount {
    display: block;
    font-size: 4rem;
    font-weight: 800;
    color: var(--a11y-primary);
    line-height: 1;
}

.tokens-label {
    display: block;
    font-size: var(--a11y-font-size-base);
    color: var(--a11y-primary);
    font-weight: 500;
    margin-top: var(--a11y-spacing-xs);
}

.tokens-cost-info {
    text-align: center;
    margin-bottom: var(--a11y-spacing-lg);
    color: var(--a11y-text-secondary);
    font-size: var(--a11y-font-size-base);
}

.tokens-cost-info strong {
    color: var(--a11y-primary);
}

.use-tokens-section {
    text-align: center;
}

.btn-use-tokens {
    width: 100%;
    padding: var(--a11y-spacing-md) var(--a11y-spacing-lg);
    font-size: var(--a11y-font-size-base);
    font-weight: 600;
    color: white;
    background-color: var(--a11y-primary);
    border: none;
    border-radius: var(--a11y-border-radius);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-sm);
    transition: all 0.2s;
}

.btn-use-tokens:hover {
    background-color: var(--a11y-primary-dark);
}

.tokens-hint {
    margin-top: var(--a11y-spacing-sm);
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-xs);
}

.tokens-hint i {
    color: var(--a11y-primary);
}

.using-tokens-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-md);
    color: var(--a11y-primary);
    font-weight: 500;
}

.using-tokens-state i {
    font-size: 1.5rem;
}

.token-use-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-lg);
    background-color: var(--mci-gray-100, #f8f9fa);
    border-radius: var(--a11y-border-radius);
    border: 2px solid var(--a11y-primary);
    animation: celebration 0.5s ease-out;
}

.token-use-success i {
    font-size: 2.5rem;
    color: var(--a11y-primary);
}

.token-use-success .success-text {
    text-align: center;
}

.token-use-success .success-text strong {
    display: block;
    font-size: var(--a11y-font-size-large);
    color: var(--a11y-primary);
    margin-bottom: var(--a11y-spacing-xs);
}

.token-use-success .success-text span {
    color: var(--a11y-text-secondary);
}

.not-enough-tokens {
    text-align: center;
    padding: var(--a11y-spacing-md);
    background-color: var(--mci-gray-100, #f8f9fa);
    border-radius: var(--a11y-border-radius);
    color: var(--a11y-text-secondary);
    border: 1px solid var(--theme-border-color);
}

.not-enough-tokens i {
    font-size: 1.5rem;
    color: var(--a11y-text-secondary);
    display: block;
    margin-bottom: var(--a11y-spacing-sm);
}

.not-enough-tokens .buy-hint {
    margin-top: var(--a11y-spacing-sm);
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
}

/* Loyalty Section */
.loyalty-section {
    margin-top: var(--a11y-spacing-md);
    padding: var(--a11y-spacing-lg);
    background-color: var(--mci-gray-100, #f8f9fa);
    border-radius: var(--a11y-border-radius);
    border: 2px solid var(--a11y-primary);
}

.loyalty-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-lg);
    font-weight: 600;
    color: var(--a11y-primary);
    font-size: var(--a11y-font-size-large);
}

.loyalty-header i {
    font-size: 1.5rem;
    color: var(--a11y-primary);
}

.loyalty-balance-display {
    text-align: center;
    margin-bottom: var(--a11y-spacing-lg);
}

.loyalty-amount {
    display: block;
    font-size: 4rem;
    font-weight: 800;
    color: var(--a11y-primary);
    line-height: 1;
}

.loyalty-label {
    display: block;
    font-size: var(--a11y-font-size-base);
    color: var(--a11y-primary);
    font-weight: 500;
    margin-top: var(--a11y-spacing-xs);
}

.loyalty-progress {
    margin-bottom: var(--a11y-spacing-lg);
}

.redeem-section {
    text-align: center;
}

.redeem-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-md);
    color: var(--a11y-primary);
    font-weight: 500;
}

.redeem-info i {
    font-size: 1.25rem;
    color: var(--a11y-primary);
}

.redemption-success-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-lg);
    background-color: var(--mci-gray-100, #f8f9fa);
    border-radius: var(--a11y-border-radius);
    border: 2px solid var(--a11y-primary);
    animation: celebration 0.5s ease-out;
}

.redemption-success-box i {
    font-size: 2.5rem;
    color: var(--a11y-primary);
}

.redemption-success-box .success-text {
    text-align: center;
}

.redemption-success-box .success-text strong {
    display: block;
    font-size: var(--a11y-font-size-large);
    color: var(--a11y-primary);
    margin-bottom: var(--a11y-spacing-xs);
}

.redemption-success-box .success-text span {
    color: var(--a11y-text-secondary);
}

.redemption-success-box .new-balance {
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
    font-weight: 500;
}

.not-enough-points {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-md);
    background-color: var(--mci-gray-100, #f8f9fa);
    border-radius: var(--a11y-border-radius);
    color: var(--a11y-text-secondary);
    font-size: var(--a11y-font-size-small);
    border: 1px solid var(--theme-border-color);
}

.not-enough-points i {
    color: var(--a11y-text-secondary);
}

.success-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-sm);
    margin-top: var(--a11y-spacing-md);
    padding: var(--a11y-spacing-sm);
    background-color: var(--mci-gray-100, #f8f9fa);
    border-radius: var(--a11y-border-radius);
    color: var(--a11y-text-secondary);
    font-size: var(--a11y-font-size-small);
}

.success-hint i {
    color: var(--a11y-primary);
}

/* ========================================== */
/* FREE SERVICE STYLES (Accessible Parking) */
/* ========================================== */
.free-service-section {
    text-align: center;
}

.free-service-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-sm) var(--a11y-spacing-lg);
    background-color: var(--mci-gray-100, #f8f9fa);
    color: var(--a11y-primary);
    border-radius: var(--a11y-border-radius);
    font-weight: 600;
    font-size: var(--a11y-font-size-large);
    margin-bottom: var(--a11y-spacing-lg);
    border: 1px solid var(--a11y-primary);
}

.free-service-badge i {
    font-size: 1.5rem;
}

.free-service-info {
    text-align: left;
    margin-bottom: var(--a11y-spacing-lg);
}

.free-description {
    color: var(--a11y-text-secondary);
    margin-bottom: var(--a11y-spacing-md);
    font-size: var(--a11y-font-size-base);
}

.free-benefit-list {
    display: flex;
    flex-direction: column;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-md);
}

.benefit-item {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-sm) var(--a11y-spacing-md);
    background-color: var(--mci-gray-100, #f8f9fa);
    border-radius: var(--a11y-border-radius);
    font-size: var(--a11y-font-size-base);
}

.benefit-item i {
    color: var(--a11y-primary);
    font-size: 1.25rem;
}

.free-reward-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-sm);
    background-color: var(--mci-gray-100, #f8f9fa);
    border-radius: var(--a11y-border-radius);
    color: var(--a11y-text-secondary);
    font-weight: 500;
}

.free-reward-hint i {
    color: var(--a11y-primary);
}

.free-action-section {
    margin-top: var(--a11y-spacing-lg);
}

.free-activate-btn {
    width: 100%;
}

/* ========================================== */
/* SUBSCRIPTION SERVICE STYLES (Transport) */
/* ========================================== */
.subscription-section {
    text-align: center;
}

.subscription-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-sm) var(--a11y-spacing-lg);
    background-color: var(--mci-gray-100, #f8f9fa);
    color: var(--a11y-primary);
    border-radius: var(--a11y-border-radius);
    font-weight: 600;
    font-size: var(--a11y-font-size-large);
    margin-bottom: var(--a11y-spacing-lg);
    border: 1px solid var(--a11y-primary);
}

.subscription-badge i {
    font-size: 1.5rem;
}

.subscription-info {
    text-align: left;
    margin-bottom: var(--a11y-spacing-lg);
}

.subscription-description {
    color: var(--a11y-text-secondary);
    margin-bottom: var(--a11y-spacing-md);
    font-size: var(--a11y-font-size-base);
}

.subscription-benefit-list {
    display: flex;
    flex-direction: column;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-lg);
}

.subscription-price-box {
    text-align: center;
    padding: var(--a11y-spacing-lg);
    background-color: var(--mci-gray-100, #f8f9fa);
    border: 2px solid var(--a11y-primary);
    border-radius: var(--a11y-border-radius);
    margin-bottom: var(--a11y-spacing-lg);
}

.price-label {
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
    margin-bottom: var(--a11y-spacing-xs);
}

.price-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--a11y-primary);
}

.price-unit {
    font-size: var(--a11y-font-size-base);
    font-weight: 500;
}

.price-reward {
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
    font-weight: 500;
    margin-top: var(--a11y-spacing-xs);
}

.subscription-tokens-view {
    margin-top: var(--a11y-spacing-md);
}

.tokens-balance-display.compact {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-md);
}

.tokens-balance-display.compact .tokens-amount {
    font-size: 1.5rem;
}
</style>

