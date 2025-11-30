<template>
    <div class="page-content miciudad-mis-credenciales" tabindex="-1">
        <!-- Skip link para accesibilidad -->
        <a href="#main-content" class="a11y-skip-link">
            {{ $t("Skip to main content") }}
        </a>

        <!-- Encabezado -->
        <header class="page-header">
            <div class="header-content">
                <h1 class="a11y-heading-1">
                    <i class="mdi mdi-file-document-edit" aria-hidden="true"></i>
                    {{ $t("Gestiones") }}
                </h1>
                <p class="a11y-text-secondary">
                    {{ $t("Your credentials and municipal procedures") }}
                </p>
            </div>
        </header>

        <main id="main-content">
            <!-- Resumen de credenciales -->
            <section aria-labelledby="summary-heading" class="credentials-summary">
                <h2 id="summary-heading" class="a11y-visually-hidden">
                    {{ $t("Credentials summary") }}
                </h2>
                
                <div class="summary-cards">
                    <article class="stat-card a11y-card" aria-labelledby="stat-active">
                        <i class="mdi mdi-check-decagram stat-icon" aria-hidden="true"></i>
                        <div class="stat-content">
                            <p class="stat-value">{{ activeCredentials.length }}</p>
                            <h3 id="stat-active" class="stat-label">{{ $t("Active credentials") }}</h3>
                        </div>
                    </article>
                    
                    <article class="stat-card a11y-card" aria-labelledby="stat-pending">
                        <i class="mdi mdi-clock-outline stat-icon" aria-hidden="true"></i>
                        <div class="stat-content">
                            <p class="stat-value">{{ pendingCredentials.length }}</p>
                            <h3 id="stat-pending" class="stat-label">{{ $t("Pending") }}</h3>
                        </div>
                    </article>
                    
                    <article class="stat-card a11y-card" aria-labelledby="stat-expiring">
                        <i class="mdi mdi-alert-circle stat-icon stat-icon-warning" aria-hidden="true"></i>
                        <div class="stat-content">
                            <p class="stat-value stat-value-warning">{{ expiringCredentials.length }}</p>
                            <h3 id="stat-expiring" class="stat-label">{{ $t("Expired") }}</h3>
                        </div>
                    </article>
                </div>
            </section>

            <!-- Lista de credenciales activas -->
            <section aria-labelledby="active-credentials-heading" class="credentials-section a11y-mt-lg">
                <h2 id="active-credentials-heading" class="a11y-heading-2">
                    <i class="mdi mdi-certificate" aria-hidden="true"></i>
                    {{ $t("My Credentials") }}
                </h2>

                <div class="credentials-grid">
                    <article 
                        v-for="credential in activeCredentials" 
                        :key="credential.id"
                        class="credential-card a11y-card"
                        :class="{ 'credential-expiring': isExpiringSoon(credential.expiresAt) }"
                    >
                        <header class="credential-header">
                            <i :class="'mdi ' + getCredentialIcon(credential.type) + ' credential-icon'" aria-hidden="true"></i>
                            <h3 class="credential-title">{{ $t(credential.name) }}</h3>
                            <span 
                                class="a11y-badge"
                                :class="getStatusBadgeClass(credential.status)"
                            >
                                {{ $t(credential.status) }}
                            </span>
                        </header>

                        <div class="credential-body">
                            <p class="credential-description a11y-text">
                                {{ $t(credential.description) }}
                            </p>

                            <!-- Detalles de la credencial -->
                            <div class="credential-details">
                                <div class="detail-row">
                                    <span class="detail-label">{{ $t("Issued by") }}:</span>
                                    <span class="detail-value">{{ credential.issuer }}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">{{ $t("Issue date") }}:</span>
                                    <span class="detail-value">{{ formatDate(credential.issuedAt) }}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">{{ $t("Valid until") }}:</span>
                                    <span class="detail-value" :class="{ 'expiring-text': isExpiringSoon(credential.expiresAt) }">
                                        {{ formatDate(credential.expiresAt) }}
                                        <i v-if="isExpiringSoon(credential.expiresAt)" class="mdi mdi-alert" aria-hidden="true"></i>
                                    </span>
                                </div>
                            </div>

                            <!-- Verificacion blockchain -->
                            <div class="blockchain-verification">
                                <i class="mdi mdi-check-decagram verification-icon" aria-hidden="true"></i>
                                <span class="verification-text">{{ $t("Verified on blockchain") }}</span>
                                <a 
                                    :href="getBlockchainUrl(credential.txId)"
                                    target="_blank"
                                    rel="noopener"
                                    class="verification-link"
                                >
                                    {{ truncateTx(credential.txId) }}
                                    <i class="mdi mdi-open-in-new" aria-hidden="true"></i>
                                </a>
                            </div>
                        </div>

                        <footer class="credential-footer">
                            <button 
                                @click="showCredential(credential)"
                                class="a11y-btn a11y-btn-secondary"
                            >
                                <i class="mdi mdi-eye" aria-hidden="true"></i>
                                {{ $t("View") }}
                            </button>
                
                        </footer>
                    </article>
                </div>

                <!-- Estado vacio -->
                <div 
                    v-if="activeCredentials.length === 0" 
                    class="empty-state a11y-card"
                    role="status"
                >
                    <i class="mdi mdi-file-document-outline empty-icon" aria-hidden="true"></i>
                    <p class="empty-title">{{ $t("No credentials yet") }}</p>
                    <p class="empty-desc a11y-text-secondary">
                        {{ $t("You don't have any credentials yet. Check available services to request one.") }}
                    </p>
                    <RouterLink :to="{name: 'services'}" class="a11y-btn a11y-btn-primary">
                        {{ $t("See available services") }}
                    </RouterLink>
                </div>
            </section>

            <!-- Solicitudes pendientes -->
            <section v-if="pendingCredentials.length > 0" aria-labelledby="pending-heading" class="pending-section a11y-mt-lg">
                <h2 id="pending-heading" class="a11y-heading-2">
                    <i class="mdi mdi-clock-outline" aria-hidden="true"></i>
                    {{ $t("Pending Requests") }}
                </h2>

                <div class="pending-list">
                    <article 
                        v-for="request in pendingCredentials" 
                        :key="request.id"
                        class="pending-card a11y-card"
                    >
                        <i :class="'mdi ' + getCredentialIcon(request.type) + ' pending-icon'" aria-hidden="true"></i>
                        <div class="pending-content">
                            <h3 class="pending-title">{{ $t(request.name) }}</h3>
                            <p class="pending-status a11y-text-secondary">
                                {{ $t("Requested on") }} {{ formatDate(request.requestedAt) }}
                            </p>
                            <div class="pending-progress">
                                <div class="progress-bar-container">
                                    <div 
                                        class="progress-bar-fill"
                                        :style="{ width: request.progress + '%' }"
                                    ></div>
                                </div>
                                <span class="progress-text">{{ $t(request.statusText) }}</span>
                            </div>
                        </div>
                    </article>
                </div>
            </section>
        </main>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { RouterLink } from "vue-router";

interface Credential {
    id: string;
    name: string;
    type: string;
    description: string;
    status: string;
    issuer: string;
    issuedAt: string;
    expiresAt: string;
    txId: string;
}

interface PendingRequest {
    id: string;
    name: string;
    type: string;
    requestedAt: string;
    progress: number;
    statusText: string;
}

export default defineComponent({
    components: {
        RouterLink,
    },
    name: "MisCredencialesPage",
    data: function () {
        return {
            activeCredentials: [
                {
                    id: "cred-001",
                    name: "Disability Credential",
                    type: "disability",
                    description: "Official recognition of disability status with reduced mobility",
                    status: "Active",
                    issuer: "Ayuntamiento - Bienestar Social",
                    issuedAt: "2024-01-15T10:00:00Z",
                    expiresAt: "2026-01-15T10:00:00Z",
                    txId: "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
                },
                {
                    id: "cred-002",
                    name: "Census Credential",
                    type: "census",
                    description: "Proof of municipal census registration",
                    status: "Active",
                    issuer: "Ayuntamiento - Padron Municipal",
                    issuedAt: "2024-06-01T09:00:00Z",
                    expiresAt: "2025-06-01T09:00:00Z",
                    txId: "xyz789abc123def456ghi012jkl345mno678pqr901stu234vw",
                },
                {
                    id: "cred-003",
                    name: "Large Family Credential",
                    type: "large_family",
                    description: "Official recognition as large family member with access to special benefits and discounts",
                    status: "Active",
                    issuer: "Ayuntamiento - Servicios Sociales",
                    issuedAt: "2024-03-10T11:30:00Z",
                    expiresAt: "2026-03-10T11:30:00Z",
                    txId: "fam123large456family789cred012xyz345abc678def901ghi",
                },
            ] as Credential[],
            pendingCredentials: [] as PendingRequest[],
        };
    },
    computed: {
        expiringCredentials(): Credential[] {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            
            return this.activeCredentials.filter(cred => {
                const expiresAt = new Date(cred.expiresAt);
                return expiresAt <= thirtyDaysFromNow;
            });
        },
    },
    methods: {
        formatDate: function (dateStr: string): string {
            return new Date(dateStr).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
            });
        },
        isExpiringSoon: function (dateStr: string): boolean {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            return new Date(dateStr) <= thirtyDaysFromNow;
        },
        getCredentialIcon: function (type: string): string {
            const icons: Record<string, string> = {
                disability: "mdi-wheelchair-accessibility",
                census: "mdi-clipboard-account",
                senior: "mdi-account-clock",
                large_family: "mdi-human-male-female-child",
            };
            return icons[type] || "mdi-certificate";
        },
        getStatusBadgeClass: function (status: string): string {
            const classes: Record<string, string> = {
                "Active": "a11y-badge-success",
                "Expired": "a11y-badge-error",
                "Revoked": "a11y-badge-error",
                "Pending": "a11y-badge-warning",
            };
            return classes[status] || "a11y-badge-info";
        },
        truncateTx: function (tx: string): string {
            if (tx.length <= 16) return tx;
            return tx.substring(0, 8) + "..." + tx.slice(-6);
        },
        getBlockchainUrl: function (txId: string): string {
            return `/block-explorer/transaction/${txId}`;
        },
        showCredential: function (credential: Credential) {
            // TODO: Abrir modal con detalles completos y QR
            console.log("Show credential:", credential.id);
        },
        shareCredential: function (credential: Credential) {
            // TODO: Generar presentacion verificable para compartir
            console.log("Share credential:", credential.id);
        },
    },
    mounted: function () {
        // TODO: Cargar credenciales desde el API
    },
});
</script>

<style scoped>
/* Header */
.page-header {
    margin-bottom: var(--a11y-spacing-lg);
}

.page-header h1 {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
}

/* Summary Cards */
.credentials-summary {
    margin-bottom: var(--a11y-spacing-lg);
}

.summary-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--a11y-spacing-md);
}

.stat-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
}

.stat-icon {
    font-size: 1.5rem;
    color: var(--a11y-primary, #004d99);
    flex-shrink: 0;
}

.stat-content {
    flex: 1;
    min-width: 0;
}

.stat-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--a11y-primary, #004d99);
    margin: 0;
    line-height: 1.2;
}

.stat-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--a11y-text-secondary, #666);
    margin: 0;
    margin-top: 0.125rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.stat-icon-warning {
    color: var(--a11y-warning, #f57c00);
}

.stat-value-warning {
    color: var(--a11y-warning, #f57c00);
}

/* Credentials Section */
.credentials-section h2 {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-lg);
}

.credentials-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: var(--a11y-spacing-lg);
}

/* Credential Card */
.credential-card {
    display: flex;
    flex-direction: column;
}

.credential-card.credential-expiring {
    border-left: 4px solid var(--a11y-warning);
}

.credential-header {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-md);
}

.credential-icon {
    font-size: 1.75rem;
    flex-shrink: 0;
    line-height: 1;
}

.credential-title {
    flex: 1;
    font-size: var(--a11y-font-size-large);
    font-weight: 600;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.credential-body {
    flex: 1;
}

.credential-description {
    margin-bottom: var(--a11y-spacing-md);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.credential-details {
    display: flex;
    flex-direction: column;
    gap: var(--a11y-spacing-xs);
    margin-bottom: var(--a11y-spacing-md);
    padding: var(--a11y-spacing-sm);
    background-color: #f8f9fa;
    border-radius: var(--a11y-border-radius);
}

.detail-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--a11y-font-size-small);
    white-space: nowrap;
}

.detail-label {
    color: var(--a11y-text-secondary);
    flex-shrink: 0;
}

.detail-value {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: right;
}

.expiring-text {
    color: var(--a11y-warning);
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
}

/* Blockchain Verification */
.blockchain-verification {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
    padding: var(--a11y-spacing-sm);
    background-color: #e8f5e9;
    border-radius: var(--a11y-border-radius);
    font-size: var(--a11y-font-size-small);
    margin-bottom: var(--a11y-spacing-md);
    white-space: nowrap;
    overflow: hidden;
}

.verification-icon {
    color: var(--a11y-success);
    font-size: 1.25rem;
    flex-shrink: 0;
}

.verification-text {
    color: var(--a11y-success);
    font-weight: 500;
    flex-shrink: 0;
}

.verification-link {
    margin-left: auto;
    color: var(--a11y-primary);
    text-decoration: none;
    font-family: monospace;
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
    flex-shrink: 0;
}

.verification-link:hover {
    text-decoration: underline;
}

/* Credential Footer */
.credential-footer {
    display: flex;
    gap: var(--a11y-spacing-sm);
    padding-top: var(--a11y-spacing-md);
    border-top: 1px solid #e0e0e0;
    margin-top: auto;
}

.credential-footer button {
    flex: 1;
}

/* Pending Section */
.pending-section h2 {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-lg);
}

.pending-list {
    display: flex;
    flex-direction: column;
    gap: var(--a11y-spacing-md);
}

.pending-card {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-md);
    padding: var(--a11y-spacing-lg);
}

.pending-icon {
    font-size: 1.75rem;
    flex-shrink: 0;
    line-height: 1;
    color: var(--a11y-warning);
}

.pending-content {
    flex: 1;
}

.pending-title {
    font-size: var(--a11y-font-size-base);
    font-weight: 600;
    margin: 0;
    margin-bottom: var(--a11y-spacing-xs);
}

.pending-status {
    margin: 0;
    margin-bottom: var(--a11y-spacing-sm);
}

.pending-progress {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
}

.progress-bar-container {
    flex: 1;
    height: 8px;
    background-color: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}

.progress-bar-fill {
    height: 100%;
    background-color: var(--a11y-primary);
    border-radius: 4px;
    transition: width 0.3s ease;
}

.progress-text {
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
    white-space: nowrap;
}

/* Request Section */
.request-card {
    text-align: center;
    padding: var(--a11y-spacing-xl);
}

.request-card h2 {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-md);
}

.request-actions {
    margin-top: var(--a11y-spacing-lg);
}

/* Empty State */
.empty-state {
    text-align: center;
    padding: var(--a11y-spacing-xl);
}

.empty-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: var(--a11y-spacing-md);
    color: var(--a11y-text-secondary);
}

.empty-title {
    font-size: var(--a11y-font-size-large);
    font-weight: 600;
    margin: 0;
    margin-bottom: var(--a11y-spacing-sm);
}

.empty-desc {
    margin: 0;
    margin-bottom: var(--a11y-spacing-lg);
}

/* Responsive */
@media (max-width: 1024px) {
    .summary-cards {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .miciudad-mis-credenciales {
        padding: var(--a11y-spacing-md);
    }
    
    .credentials-grid {
        grid-template-columns: 1fr;
    }
    
    .credential-footer {
        flex-direction: column;
    }
    
    .pending-card {
        flex-direction: column;
        text-align: center;
    }
    
    .pending-progress {
        flex-direction: column;
    }
}
</style>
