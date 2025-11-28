<template>
    <div class="page-content" tabindex="-1">
        <ComponentLoader v-if="loading"></ComponentLoader>
        
        <div class="crowdfunding-container" v-if="!loading">
            <div class="header-section">
                <div class="row">
                    <div class="col-md-8">
                        <h1>{{ $t("Crowdfunding Campaign") }}</h1>
                        <p class="subtitle">{{ $t("Invest in the future of blockchain technology") }}</p>
                    </div>
                    <div class="col-md-4 text-right" style="text-align: right;">
                         <button class="btn btn-danger btn-sm" @click="resetCampaign" style="margin-top: 10px;">
                            <i class="fas fa-trash"></i> {{ $t("Reset Campaign") }}
                        </button>
                    </div>
                </div>
                <div class="wallet-status">
                    <button v-if="!isConnected" class="btn btn-outline-primary btn-sm" @click="connect">
                        {{ $t("Connect Wallet") }}
                    </button>
                    <span v-else class="badge badge-success">
                        <i class="fas fa-check-circle"></i> {{ $t("Wallet Connected") }}
                    </span>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">{{ status.goal }} sats</div>
                    <div class="stat-label">{{ $t("Goal") }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ status.raised }} sats</div>
                    <div class="stat-label">{{ $t("Raised") }}</div>
                </div>
                <div class="stat-card">
                    <div class="form-group">
                        <label>{{ $t("Amount (sats)") }}</label>
                        <input type="number" v-model.number="investmentAmount" class="form-control" :disabled="investing" min="1" />
                    </div>
                    <div class="button-group">
                        <button class="btn btn-primary" @click="invest" :disabled="investing || investmentAmount <= 0">
                            <i class="fas fa-rocket" v-if="!investing"></i>
                            <i class="fas fa-spinner fa-spin" v-else></i>
                            {{ $t("Invest with Wallet") }}
                        </button>
                    </div>
                </div>
                <div v-if="message" :class="['message', messageType]">
                    {{ message }}
                </div>
            </div>

            <div class="progress-section">
                <div class="progress-bar-container">
                    <div class="progress-bar" :style="{ width: percentFunded + '%' }"></div>
                </div>
                <div class="progress-text">{{ percentFunded }}% {{ $t("Funded") }}</div>
            </div>

            <div v-if="percentFunded >= 100 && !isComplete" class="complete-section">
                <p class="success-message">Goal Reached! 🎉</p>
                <button @click="completeCampaign" :disabled="loading" class="btn-complete">
                    Complete Campaign & Distribute Tokens
                </button>
            </div>

            <div v-if="isComplete" class="completion-message">
                <h3>Campaign Completed! 🚀</h3>
                <p>Tokens have been distributed to investors.</p>
                <p v-if="completionTxid">TXID: <a :href="'https://whatsonchain.com/tx/' + completionTxid" target="_blank">{{ completionTxid.substring(0, 8) }}...</a></p>
            </div>

            <div class="investors-list" v-if="status.investors && status.investors.length > 0">
                <h3>{{ $t("Recent Investors") }}</h3>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>{{ $t("Identity Key") }}</th>
                                <th>{{ $t("Amount") }}</th>
                                <th>{{ $t("Time") }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(inv, index) in status.investors" :key="index">
                                <td class="mono">{{ inv.identityKey }}</td>
                                <td>{{ inv.amount }} sats</td>
                                <td>{{ renderDate(inv.timestamp) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, computed, getCurrentInstance } from "vue";
import ComponentLoader from "@/components/utils/ComponentLoader.vue";
import { getUniqueStringId } from "@/utils/unique-id";
import { Timeouts } from "@/utils/timeout";
import { Request } from "@asanrom/request-browser";
import { ApiCrowdfunding } from "@/api/api-group-crowdfunding";
import { renderDate } from "@/utils/time-utils";
import { useWallet } from "@/composables/useWallet";
import { P2PKH, PublicKey, Utils, WalletProtocol } from '@bsv/sdk';
import { getApiUrl } from "@/api/utils";

export default defineComponent({
    name: "CrowdfundingPage",
    components: {
        ComponentLoader,
    },
    setup() {
        const { proxy } = getCurrentInstance() as any;
        const t = proxy.$t;
        
        const loading = ref(true);
        const investing = ref(false);
        const status = ref<any>({});
        const investmentAmount = ref(1000);
        const message = ref("");
        const messageType = ref("");
        const loadRequestId = getUniqueStringId();
        const investRequestId = getUniqueStringId();
        
        const backendIdentityKey = ref("");
        const { wallet, isConnected, connect } = useWallet();
        
        const loadStatus = () => {
            Timeouts.Abort(loadRequestId);
            Request.Abort(loadRequestId);

            Request.Pending(loadRequestId, ApiCrowdfunding.GetCrowdfundingStatus())
                .onSuccess((data) => {
                    loading.value = false;
                    status.value = data;
                })
                .onRequestError((err, handleErr) => {
                    handleErr(err, {
                        temporalError: () => {
                            Timeouts.Set(loadRequestId, 2000, loadStatus);
                        }
                    });
                })
                .onUnexpectedError((err) => {
                    console.error(err);
                    Timeouts.Set(loadRequestId, 2000, loadStatus);
                });
        };

        const loadWalletInfo = () => {
             Request.Pending(getUniqueStringId(), ApiCrowdfunding.GetWalletInfo())
                .onSuccess((data) => {
                    backendIdentityKey.value = data.identityKey;
                })
                .onUnexpectedError((err) => {
                    console.error("Failed to load wallet info", err);
                });
        }

        const invest = async () => {
            if (!isConnected.value) {
                await connect();
                if (!isConnected.value) {
                    message.value = "Please connect your wallet first.";
                    messageType.value = "error";
                    return;
                }
            }
            
            if (investmentAmount.value <= 0) return;
            
            investing.value = true;
            message.value = "Initiating investment...";
            messageType.value = "info";
            
            try {
                // 1. Initial Request (Expect 402)
                let response = await fetch(ApiCrowdfunding.Invest().url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: investmentAmount.value })
                });

                if (response.status === 402) {
                    console.log("402 Payment Required detected");
                    const derivationPrefix = response.headers.get('x-bsv-payment-derivation-prefix');
                    console.log("Derivation Prefix:", derivationPrefix);

                    if (!derivationPrefix) throw new Error("Missing derivation prefix from server");

                    if (!backendIdentityKey.value) {
                         // Try to fetch it if missing
                         await new Promise<void>((resolve) => {
                             Request.Pending(getUniqueStringId(), ApiCrowdfunding.GetWalletInfo())
                                .onSuccess((data) => {
                                    backendIdentityKey.value = data.identityKey;
                                    resolve();
                                })
                                .onUnexpectedError(() => resolve());
                         });
                    }

                    if (!backendIdentityKey.value) throw new Error("Backend identity key not found");

                    message.value = "Please sign the transaction in your wallet...";

                    // BRC-29 Derivation
                    const brc29ProtocolID: WalletProtocol = [2, '3241645161d8'];
                    const derivationSuffix = Utils.toBase64(Utils.toArray('investment' + Date.now(), 'utf8'));
                    
                    const { publicKey: derivedPublicKey } = await wallet.value!.getPublicKey({
                        counterparty: backendIdentityKey.value,
                        protocolID: brc29ProtocolID,
                        keyID: `${derivationPrefix} ${derivationSuffix}`,
                        forSelf: false
                    });

                    const lockingScript = new P2PKH().lock(PublicKey.fromString(derivedPublicKey).toAddress()).toHex();
                    
                    const action = await wallet.value!.createAction({
                        outputs: [{
                            lockingScript,
                            satoshis: investmentAmount.value,
                            outputDescription: 'Crowdfunding investment'
                        }],
                        description: 'Investment in crowdfunding',
                        options: { randomizeOutputs: false }
                    });

                    if (!action.tx) throw new Error("Transaction creation failed or cancelled");

                    const { publicKey: investorKey } = await wallet.value!.getPublicKey({ identityKey: true });
                    console.log("Investor Key:", investorKey);

                    const paymentHeader = JSON.stringify({
                        derivationPrefix,
                        derivationSuffix,
                        transaction: Utils.toBase64(action.tx),
                        senderIdentityKey: investorKey,
                        amount: investmentAmount.value
                    });
                    console.log("Payment Header:", paymentHeader);

                    message.value = "Broadcasting payment...";

                    // 2. Retry with Payment Header
                    response = await fetch(ApiCrowdfunding.Invest().url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-bsv-payment': paymentHeader
                        },
                        body: JSON.stringify({ amount: investmentAmount.value })
                    });
                }

                const data = await response.json();

                if (response.ok) {
                    investing.value = false;
                    message.value = "Investment successful!";
                    messageType.value = "success";
                    loadStatus();
                } else {
                    throw new Error(data.message || data.description || "Investment failed");
                }

            } catch (e: any) {
                console.error("Investment error:", e);
                investing.value = false;
                message.value = "Investment failed: " + e.message;
                messageType.value = "error";
            }
        };

        const completeCampaign = async () => {
            if (!confirm("Are you sure you want to complete the campaign and distribute tokens?")) return;
            
            loading.value = true;
            try {
                // Use fetch directly as ApiCrowdfunding might not have this method yet
                const response = await fetch(getApiUrl('/api/v1/bsv/complete'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || "Failed to complete campaign");
                }

                const result = await response.json();
                
                // IMPORTANT: Internalize the token to add it to our wallet basket
                if (result.tx && wallet.value) {
                    console.log("Internalizing token transaction...");
                    try {
                        await wallet.value.internalizeAction({
                            tx: result.tx,
                            outputs: [{
                                outputIndex: 0,
                                protocol: 'basket insertion',
                                insertionRemittance: { basket: 'crowdfunding' }
                            }],
                            description: 'Internalize crowdfunding token'
                        });
                        console.log("Token internalized successfully!");
                        alert(result.message + "\n\nToken added to your wallet! Check 'My Tokens' page.");
                    } catch (e) {
                        console.error("Failed to internalize token:", e);
                        alert(result.message + "\n\nNote: You may need to manually claim the token.");
                    }
                } else {
                    alert(result.message);
                }
                
                loadStatus();
            } catch (error: any) {
                console.error("Completion error:", error);
                alert("Error: " + error.message);
            } finally {
                loading.value = false;
            }
        };

        const resetCampaign = async () => {
            if (!confirm("Are you sure you want to RESET the campaign? This will delete all investments.")) return;
            
            loading.value = true;
            try {
                const response = await fetch(getApiUrl('/api/v1/bsv/reset'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const result = await response.json();
                alert(result.message);
                loadStatus();
            } catch (error: any) {
                alert("Error: " + error.message);
            } finally {
                loading.value = false;
            }
        };

        onMounted(() => {
            loadStatus();
            loadWalletInfo();
        });

        onUnmounted(() => {
            Timeouts.Abort(loadRequestId);
            Request.Abort(loadRequestId);
            Request.Abort(investRequestId);
        });

        return {
            loading,
            investing,
            status,
            investmentAmount,
            message,
            messageType,
            isConnected,
            connect,
            invest,
            renderDate: (d: any) => renderDate(d, t),
            completeCampaign,
            resetCampaign,
            percentFunded: computed(() => status.value.percentFunded || 0),
            raised: computed(() => status.value.raised || 0),
            goal: computed(() => status.value.goal || 0),
            isComplete: computed(() => status.value.isComplete || false),
            completionTxid: computed(() => status.value.completionTxid || "")
        };
    }
});
</script>

<style scoped>
.crowdfunding-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
}

.header-section {
    text-align: center;
    margin-bottom: 2rem;
}

.wallet-status {
    margin-top: 1rem;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: var(--theme-card-bg);
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--theme-primary);
}

.progress-section {
    margin-bottom: 3rem;
}

.progress-bar-container {
    height: 20px;
    background: #eee;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 0.5rem;
}

.progress-bar {
    height: 100%;
    background: var(--theme-primary);
    transition: width 0.5s ease;
}

.progress-text {
    text-align: right;
    font-weight: bold;
}

.invest-section {
    background: var(--theme-card-bg);
    padding: 2rem;
    border-radius: 8px;
    margin-bottom: 2rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-control {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.button-group {
    display: flex;
    gap: 1rem;
}

.btn-secondary {
    background: #6c757d;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
}

.message {
    margin-top: 1rem;
    padding: 1rem;
    border-radius: 4px;
}

.message.success {
    background: #d4edda;
    color: #155724;
}

.message.error {
    background: #f8d7da;
    color: #721c24;
}

.message.info {
    background: #cce5ff;
    color: #004085;
}

.mono {
    font-family: monospace;
}

.badge {
    padding: 0.5em 0.75em;
    border-radius: 0.25rem;
    font-weight: bold;
}

.badge-success {
    background-color: #28a745;
    color: white;
}

.complete-section {
    margin-top: 2rem;
    text-align: center;
    padding: 1.5rem;
    background: #d1fae5;
    border-radius: 8px;
    border: 1px solid #10b981;
}

.success-message {
    color: #065f46;
    font-weight: bold;
    font-size: 1.2rem;
    margin-bottom: 1rem;
}

.btn-complete {
    background: #10b981;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.2s;
}

.btn-complete:hover {
    background: #059669;
}

.btn-complete:disabled {
    background: #a7f3d0;
    cursor: not-allowed;
}

.completion-message {
    margin-top: 2rem;
    text-align: center;
    padding: 2rem;
    background: #eff6ff;
    border-radius: 8px;
    border: 1px solid #3b82f6;
}

.completion-message h3 {
    color: #1e40af;
    margin-bottom: 1rem;
}
</style>
