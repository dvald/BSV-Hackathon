<template>
    <div class="page-content admin-page" tabindex="-1">
        <div class="admin-container">
            <h1 class="admin-title">{{ $t('Administration and moderation') }}</h1>
            
            <!-- Wallet Status Card -->
            <div class="wallet-status-card">
                <div class="wallet-header">
                    <i class="mdi mdi-wallet" aria-hidden="true"></i>
                    <span class="wallet-title">{{ $t('Backend Wallet') }}</span>
                </div>
                <div v-if="walletLoading" class="wallet-loading">
                    <i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i>
                    <span>{{ $t('Loading...') }}</span>
                </div>
                <div v-else-if="walletError" class="wallet-error">
                    <i class="mdi mdi-alert-circle" aria-hidden="true"></i>
                    <span>{{ walletError }}</span>
                </div>
                <div v-else class="wallet-content">
                    <div class="wallet-balance">
                        <span class="balance-value">{{ formatBsv(walletBalance.bsv) }}</span>
                        <span class="balance-unit">BSV</span>
                    </div>
                    <div class="wallet-satoshis">
                        {{ formatNumber(walletBalance.satoshis) }} satoshis
                        <span v-if="walletBalance.outputCount > 1" class="output-count">
                            ({{ walletBalance.outputCount }} UTXOs across multiple derived addresses)
                        </span>
                    </div>
                    
                    <!-- Deposit Address (shows funded BRC-29 address if available) -->
                    <div class="wallet-deposit">
                        <span class="deposit-label">
                            <i class="mdi mdi-arrow-down-bold-circle" aria-hidden="true"></i>
                            {{ $t('Funded Address') }}:
                        </span>
                        <div class="deposit-row">
                            <code class="deposit-value" :title="displayAddress">
                                {{ displayAddress }}
                            </code>
                            <button @click="copyToClipboard(displayAddress, 'address')" class="copy-btn" :title="$t('Copy')">
                                <i class="mdi" :class="copied === 'address' ? 'mdi-check' : 'mdi-content-copy'" aria-hidden="true"></i>
                            </button>
                        </div>
                        <small v-if="walletBalance.fundedAddress" class="derived-note">
                            <i class="mdi mdi-information-outline" aria-hidden="true"></i>
                            BRC-29 derived address with funds
                        </small>
                        <a :href="'https://whatsonchain.com/address/' + displayAddress" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           class="explorer-link">
                            <i class="mdi mdi-open-in-new" aria-hidden="true"></i>
                            {{ $t('View on WhatsonChain') }}
                        </a>
                    </div>
                    
                    <!-- Identity Key (for reference) -->
                    <div class="wallet-identity">
                        <span class="identity-label">{{ $t('Identity Key') }}:</span>
                        <div class="identity-row">
                            <code class="identity-value" :title="walletBalance.identityKey">
                                {{ shortenIdentity(walletBalance.identityKey) }}
                            </code>
                            <button @click="copyToClipboard(walletBalance.identityKey)" class="copy-btn" :title="$t('Copy')">
                                <i class="mdi" :class="copied === 'identity' ? 'mdi-check' : 'mdi-content-copy'" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                    
                </div>
                <button @click="loadWalletStatus" class="refresh-btn" :disabled="walletLoading">
                    <i class="mdi mdi-refresh" :class="{ 'mdi-spin': walletLoading }" aria-hidden="true"></i>
                </button>
            </div>

            <UsersPage></UsersPage>
        </div>
    </div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from "vue";

import { AuthController } from "@/control/auth";
import { HOME_ROUTE } from "@/app-events-plugin";
import ComponentLoader from "@/components/utils/ComponentLoader.vue";
import { getApiUrl } from "@/api/utils";

const UsersPage = defineAsyncComponent({
    loader: () => import("./UsersPage.vue"),
    loadingComponent: ComponentLoader,
    delay: 1000,
});

const REQUIRED_PERMISSIONS = ["mod.users", "admin.roles"];

export default defineComponent({
    components: {
        UsersPage,
    },
    name: "AdministrationPage",
    data: function () {
        return {
            canUsers: AuthController.hasPermission("mod.users"),
            canRoles: AuthController.hasPermission("admin.roles"),
            walletLoading: true,
            walletError: "",
            walletBalance: {
                satoshis: 0,
                bsv: 0,
                address: "",
                identityKey: "",
                fundedAddress: "",
                outputCount: 0,
            },
            copied: "" as string,
            showInternalizeForm: false,
            internalizeTxid: "",
            internalizeSender: "",
            internalizing: false,
            internalizeResult: null as { success: boolean; message: string } | null,
        };
    },
    computed: {
        displayAddress(): string {
            return this.walletBalance.fundedAddress || this.walletBalance.address || '';
        }
    },
    methods: {
        checkPermission: function () {
            if (!AuthController.isAuthenticated()) {
                this.$requireLogin();
                return;
            }

            for (const p of REQUIRED_PERMISSIONS) {
                if (AuthController.hasPermission(p)) {
                    return;
                }
            }

            // Not enough permissions
            this.$showMessageModal(this.$t("Access denied"), this.$t("You lack the required permission to visit this page"));
            this.$router.push({ name: HOME_ROUTE });
        },

        onAuthChanged: function () {
            this.canUsers = AuthController.hasPermission("mod.users");
            this.canRoles = AuthController.hasPermission("admin.roles");
        },

        async loadWalletStatus() {
            this.walletLoading = true;
            this.walletError = "";
            
            try {
                const response = await fetch(getApiUrl("/api/v1/admin/wallet-status"), {
                    credentials: "include",
                });
                
                if (!response.ok) {
                    throw new Error("Failed to fetch wallet status");
                }
                
                const data = await response.json();
                this.walletBalance = {
                    satoshis: data.satoshis || 0,
                    bsv: data.bsv || 0,
                    address: data.address || "",
                    identityKey: data.identityKey || "",
                    fundedAddress: data.fundedAddress || "",
                    outputCount: data.outputCount || 0,
                };
            } catch (error: any) {
                console.error("Error loading wallet status:", error);
                this.walletError = error.message || "Error loading wallet";
            } finally {
                this.walletLoading = false;
            }
        },

        formatBsv(bsv: number): string {
            return bsv.toFixed(8);
        },

        formatNumber(num: number): string {
            return new Intl.NumberFormat("es-ES").format(num);
        },

        shortenAddress(address: string): string {
            if (!address || address.length < 16) return address;
            return address.substring(0, 8) + "..." + address.substring(address.length - 8);
        },

        shortenIdentity(identity: string): string {
            if (!identity || identity.length < 20) return identity;
            return identity.substring(0, 12) + "..." + identity.substring(identity.length - 12);
        },

        async copyToClipboard(text: string, type: string = 'identity') {
            try {
                await navigator.clipboard.writeText(text);
                this.copied = type;
                setTimeout(() => {
                    this.copied = "";
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        },

        async internalizePayment() {
            if (!this.internalizeTxid || !this.internalizeSender) return;
            
            this.internalizing = true;
            this.internalizeResult = null;
            
            try {
                const response = await fetch(getApiUrl("/api/v1/admin/wallet-internalize"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        txid: this.internalizeTxid.trim(),
                        senderIdentityKey: this.internalizeSender.trim(),
                    }),
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    this.internalizeResult = { success: true, message: "Payment internalized! Refreshing balance..." };
                    this.internalizeTxid = "";
                    this.internalizeSender = "";
                    // Refresh balance
                    setTimeout(() => this.loadWalletStatus(), 1000);
                } else {
                    this.internalizeResult = { success: false, message: data.message || "Failed to internalize" };
                }
            } catch (error: any) {
                this.internalizeResult = { success: false, message: error.message || "Error" };
            } finally {
                this.internalizing = false;
            }
        },
    },
    mounted: function () {
        this.$setSubTitle(this.$t("Administration and moderation"));
        this.$listenOnAppEvent("auth-status-changed", this.onAuthChanged.bind(this));
        this.checkPermission();
        this.loadWalletStatus();
    },
    beforeUnmount: function () {},
});
</script>

<style scoped>
.admin-page {
    padding: 1.5rem;
}

.admin-container {
    max-width: 1200px;
    margin: 0 auto;
}

.admin-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--mci-text-primary, #1a1a1a);
    margin-bottom: 1.5rem;
}

/* Wallet Status Card */
.wallet-status-card {
    background: var(--a11y-card-bg, var(--a11y-bg-secondary));
    border: 1px solid var(--a11y-border, rgba(0, 0, 0, 0.1));
    border-radius: var(--a11y-border-radius, 12px);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    color: var(--a11y-text);
    position: relative;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.wallet-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.wallet-header i {
    font-size: 1.5rem;
    color: var(--a11y-primary);
}

.wallet-title {
    font-size: 1rem;
    font-weight: 600;
    opacity: 0.9;
}

.wallet-loading,
.wallet-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 0;
}

.wallet-loading i {
    font-size: 1.25rem;
}

.wallet-error {
    color: var(--a11y-error, #dc3545);
}

.wallet-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.wallet-balance {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
}

.balance-value {
    font-size: 2.5rem;
    font-weight: 700;
    letter-spacing: -0.5px;
}

.balance-unit {
    font-size: 1.25rem;
    font-weight: 500;
    opacity: 0.8;
}

.wallet-satoshis {
    font-size: 0.875rem;
    opacity: 0.7;
}

/* Deposit Address */
.wallet-deposit {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: var(--a11y-bg-secondary);
    border: 1px solid var(--a11y-border, rgba(0, 0, 0, 0.1));
    border-radius: var(--a11y-border-radius, 8px);
}

.deposit-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--a11y-primary);
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-bottom: 0.5rem;
}

.deposit-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.deposit-value {
    background: var(--a11y-bg-secondary, rgba(0, 0, 0, 0.2));
    padding: 0.5rem 0.75rem;
    border-radius: var(--a11y-border-radius, 6px);
    font-size: 0.75rem;
    color: var(--a11y-text);
    font-family: monospace;
    flex: 1;
    word-break: break-all;
}

.explorer-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--a11y-primary);
    text-decoration: none;
}

.explorer-link:hover {
    color: var(--a11y-text);
    text-decoration: underline;
}

/* Identity Key */
.wallet-identity {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--a11y-border, rgba(0, 0, 0, 0.1));
}

.identity-label {
    font-size: 0.75rem;
    opacity: 0.7;
    display: block;
    margin-bottom: 0.25rem;
}

.identity-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.identity-value {
    background: var(--a11y-bg-secondary);
    padding: 0.375rem 0.75rem;
    border-radius: var(--a11y-border-radius, 6px);
    font-size: 0.8rem;
    color: var(--a11y-text);
    font-family: monospace;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Derived address note */
.derived-note {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.7rem;
    color: var(--a11y-text-secondary);
    margin-top: 0.25rem;
    margin-bottom: 0.5rem;
}

/* Output count */
.output-count {
    display: block;
    font-size: 0.7rem;
    color: var(--a11y-text-secondary);
    margin-top: 0.25rem;
}

/* Address */
.wallet-address {
    margin-top: 0.5rem;
}

.address-label {
    font-size: 0.75rem;
    opacity: 0.7;
    display: block;
    margin-bottom: 0.25rem;
}

.address-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.address-link {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--a11y-primary);
    text-decoration: none;
    font-family: monospace;
    font-size: 0.875rem;
}

.address-link:hover {
    color: var(--a11y-text);
    text-decoration: underline;
}

.address-link i {
    font-size: 0.875rem;
}

/* Copy Button */
.copy-btn {
    background: var(--a11y-bg-secondary);
    border: none;
    border-radius: var(--a11y-border-radius, 6px);
    padding: 0.375rem 0.5rem;
    color: var(--a11y-text);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.copy-btn:hover {
    background: var(--a11y-primary);
}

.copy-btn .mdi-check {
    color: var(--a11y-success, #28a745);
}

/* Internalize Section */
.internalize-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--a11y-border, rgba(0, 0, 0, 0.1));
}

.internalize-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    opacity: 0.9;
    transition: opacity 0.2s;
}

.internalize-header:hover {
    opacity: 1;
}

.internalize-form {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: var(--a11y-bg-secondary);
    border-radius: 8px;
}

.form-group {
    margin-bottom: 0.75rem;
}

.form-group label {
    display: block;
    font-size: 0.75rem;
    opacity: 0.8;
    margin-bottom: 0.25rem;
}

.form-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--a11y-border, rgba(0, 0, 0, 0.1));
    border-radius: var(--a11y-border-radius, 6px);
    background: var(--a11y-bg-secondary, rgba(0, 0, 0, 0.05));
    color: var(--a11y-text);
    font-family: monospace;
    font-size: 0.8rem;
}

.form-input::placeholder {
    color: var(--a11y-text-secondary);
}

.form-input:focus {
    outline: none;
    border-color: var(--a11y-primary);
}

.internalize-btn {
    width: 100%;
    padding: 0.625rem;
    border: none;
    border-radius: var(--a11y-border-radius, 6px);
    background: var(--a11y-primary);
    color: var(--a11y-text);
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: background 0.2s;
}

.internalize-btn:hover:not(:disabled) {
    opacity: 0.9;
}

.internalize-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.internalize-result {
    margin-top: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
}

.internalize-result.success {
    background: var(--a11y-success-bg, rgba(40, 167, 69, 0.15));
    color: var(--a11y-success, #28a745);
}

.internalize-result.error {
    background: var(--a11y-error-bg, rgba(220, 53, 69, 0.15));
    color: var(--a11y-error, #dc3545);
}

.refresh-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: var(--a11y-bg-secondary);
    border: none;
    border-radius: var(--a11y-border-radius, 8px);
    padding: 0.5rem;
    color: var(--a11y-text);
    cursor: pointer;
    transition: background 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
    background: var(--a11y-primary);
}

.refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.refresh-btn i {
    font-size: 1.25rem;
}

/* Spin animation */
.mdi-spin {
    animation: mdi-spin 1s infinite linear;
}

@keyframes mdi-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
    .balance-value {
        font-size: 2rem;
    }
}
</style>
