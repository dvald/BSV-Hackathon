<template>
    <div class="page-content miciudad-mi-actividad" tabindex="-1">
        <!-- Skip link para accesibilidad -->
        <a href="#main-content" class="a11y-skip-link">
            {{ $t("Skip to main content") }}
        </a>

        <!-- Encabezado -->
        <header class="page-header">
            <div class="header-content">
                <h1 class="a11y-heading-1">
                    <i class="mdi mdi-clipboard-text-clock" aria-hidden="true"></i>
                    {{ $t("My Activity") }}
                </h1>
                <p class="a11y-text-secondary">
                    {{ $t("See how your data has been used and by whom") }}
                </p>
            </div>
        </header>

        <main id="main-content">
            <!-- Resumen de actividad -->
            <section aria-labelledby="summary-heading" class="activity-summary">
                <h2 id="summary-heading" class="a11y-visually-hidden">
                    {{ $t("Activity summary") }}
                </h2>
                
                <div class="stat-cards">
                    <article class="stat-card a11y-card">
                        <i class="mdi mdi-check-decagram stat-icon" aria-hidden="true"></i>
                        <div class="stat-content">
                            <span class="stat-value">{{ stats.verifications }}</span>
                            <span class="stat-label">{{ $t("Verifications") }}</span>
                        </div>
                    </article>
                    
                    <article class="stat-card a11y-card">
                        <i class="mdi mdi-share-variant stat-icon" aria-hidden="true"></i>
                        <div class="stat-content">
                            <span class="stat-value">{{ stats.shares }}</span>
                            <span class="stat-label">{{ $t("Data shares") }}</span>
                        </div>
                    </article>
                    
                    <article class="stat-card a11y-card">
                        <i class="mdi mdi-domain stat-icon" aria-hidden="true"></i>
                        <div class="stat-content">
                            <span class="stat-value">{{ stats.services }}</span>
                            <span class="stat-label">{{ $t("Services used") }}</span>
                        </div>
                    </article>
                </div>
            </section>

            <!-- Filtros -->
            <section class="filters-section a11y-card a11y-mt-lg" aria-labelledby="filters-heading">
                <h2 id="filters-heading" class="a11y-visually-hidden">{{ $t("Filters") }}</h2>
                
                <div class="filters-grid">
                    <div class="a11y-form-group">
                        <label for="filter-type" class="a11y-label">
                            {{ $t("Activity type") }}
                        </label>
                        <select 
                            id="filter-type" 
                            v-model="filters.type"
                            class="a11y-select"
                        >
                            <option value="">{{ $t("All") }}</option>
                            <option value="verification">{{ $t("Verifications") }}</option>
                            <option value="share">{{ $t("Data shares") }}</option>
                            <option value="token_use">{{ $t("Token usage") }}</option>
                            <option value="credential_issued">{{ $t("Credential issued") }}</option>
                        </select>
                    </div>
                    
                    <div class="a11y-form-group">
                        <label for="filter-service" class="a11y-label">
                            {{ $t("Service") }}
                        </label>
                        <select 
                            id="filter-service" 
                            v-model="filters.service"
                            class="a11y-select"
                        >
                            <option value="">{{ $t("All services") }}</option>
                            <option value="parking_pmr">{{ $t("PMR Parking") }}</option>
                            <option value="eco_puntos">{{ $t("EcoPoints") }}</option>
                            <option value="transport">{{ $t("Public Transport") }}</option>
                        </select>
                    </div>

                    <div class="a11y-form-group">
                        <label for="filter-date" class="a11y-label">
                            {{ $t("Period") }}
                        </label>
                        <select 
                            id="filter-date" 
                            v-model="filters.period"
                            class="a11y-select"
                        >
                            <option value="7">{{ $t("Last 7 days") }}</option>
                            <option value="30">{{ $t("Last 30 days") }}</option>
                            <option value="90">{{ $t("Last 3 months") }}</option>
                            <option value="all">{{ $t("All time") }}</option>
                        </select>
                    </div>
                </div>
            </section>

            <!-- Timeline de actividad -->
            <section aria-labelledby="activity-heading" class="activity-timeline a11y-mt-lg">
                <h2 id="activity-heading" class="a11y-heading-2">
                    <i class="mdi mdi-timeline" aria-hidden="true"></i>
                    {{ $t("Activity Log") }}
                    <span class="results-count">({{ filteredActivities.length }})</span>
                </h2>

                <div class="timeline">
                    <article 
                        v-for="activity in filteredActivities" 
                        :key="activity.id"
                        class="activity-card a11y-card"
                        :class="'activity-type-' + activity.type"
                    >
                        <div class="activity-content">
                            <header class="activity-header">
                                <i :class="'mdi ' + getActivityIcon(activity.type) + ' activity-icon'" aria-hidden="true"></i>
                                <h3 class="activity-title">{{ $t(activity.title) }}</h3>
                                <time class="activity-time" :datetime="activity.timestamp">
                                    {{ formatRelativeTime(activity.timestamp) }}
                                </time>
                            </header>
                            
                            <p class="activity-description">{{ activity.description }}</p>
                            
                            <div class="activity-details">
                                <div class="detail-item">
                                    <i class="mdi mdi-domain" aria-hidden="true"></i>
                                    <span>{{ activity.service }}</span>
                                </div>
                                <div v-if="activity.accessor" class="detail-item">
                                    <i class="mdi mdi-account" aria-hidden="true"></i>
                                    <span>{{ activity.accessor }}</span>
                                </div>
                                <div v-if="activity.dataShared" class="detail-item data-shared">
                                    <i class="mdi mdi-file-document-outline" aria-hidden="true"></i>
                                    <span>{{ $t("Data shared") }}: {{ activity.dataShared.join(", ") }}</span>
                                </div>
                            </div>

                            <!-- Verificacion blockchain -->
                            <div v-if="activity.txId" class="blockchain-ref">
                                <i class="mdi mdi-link-variant" aria-hidden="true"></i>
                                <span>{{ $t("Blockchain record") }}:</span>
                                <a 
                                    :href="getBlockchainUrl(activity.txId)"
                                    target="_blank"
                                    rel="noopener"
                                    class="tx-link"
                                >
                                    {{ truncateTx(activity.txId) }}
                                    <i class="mdi mdi-open-in-new" aria-hidden="true"></i>
                                </a>
                            </div>
                        </div>
                    </article>
                </div>

                <!-- Estado vacio -->
                <div 
                    v-if="filteredActivities.length === 0" 
                    class="empty-state a11y-card"
                    role="status"
                >
                    <i class="mdi mdi-clipboard-text-outline empty-icon" aria-hidden="true"></i>
                    <p class="empty-title">{{ $t("No activity found") }}</p>
                    <p class="empty-desc a11y-text-secondary">
                        {{ $t("No activity matches your filters. Try adjusting them.") }}
                    </p>
                </div>

                <!-- Cargar mas -->
                <div v-if="hasMoreActivities" class="load-more">
                    <button 
                        @click="loadMore"
                        class="a11y-btn a11y-btn-secondary"
                    >
                        <i class="mdi mdi-chevron-down" aria-hidden="true"></i>
                        {{ $t("Load more") }}
                    </button>
                </div>
            </section>

            <!-- Informacion sobre privacidad -->
            <aside class="privacy-info a11y-card a11y-mt-lg" aria-labelledby="privacy-heading">
                <h3 id="privacy-heading" class="a11y-heading-3">
                    <i class="mdi mdi-shield-check" aria-hidden="true"></i>
                    {{ $t("Your privacy is protected") }}
                </h3>
                <p class="a11y-text">
                    {{ $t("All access to your data is recorded on the blockchain, providing:") }}
                </p>
                <ul class="privacy-list">
                    <li>
                        <strong>{{ $t("Full transparency") }}:</strong>
                        {{ $t("You can see who accessed your data and when") }}
                    </li>
                    <li>
                        <strong>{{ $t("Minimal disclosure") }}:</strong>
                        {{ $t("Only the necessary data is shared for each service") }}
                    </li>
                    <li>
                        <strong>{{ $t("Your control") }}:</strong>
                        {{ $t("You decide what to share and with whom") }}
                    </li>
                    <li>
                        <strong>{{ $t("Immutable record") }}:</strong>
                        {{ $t("Activity cannot be modified or deleted") }}
                    </li>
                </ul>
            </aside>
        </main>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

interface Activity {
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    service: string;
    accessor?: string;
    dataShared?: string[];
    txId?: string;
}

export default defineComponent({
    components: {},
    name: "MiActividadPage",
    data: function () {
        return {
            filters: {
                type: "",
                service: "",
                period: "30",
            },
            stats: {
                verifications: 12,
                shares: 8,
                services: 3,
            },
            activities: [
                {
                    id: "act-001",
                    type: "verification",
                    title: "Credential verified",
                    description: "Your Disability Credential was verified to access PMR parking",
                    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
                    service: "PMR Parking - Plaza Mayor",
                    accessor: "Sistema Parking PMR",
                    dataShared: ["Disability status", "Reduced mobility"],
                    txId: "abc123verification456def789",
                },
                {
                    id: "act-002",
                    type: "token_use",
                    title: "Token used",
                    description: "1 parking use consumed from your monthly allowance",
                    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
                    service: "PMR Parking - Plaza Mayor",
                    txId: "xyz789tokenuse123abc456",
                },
                {
                    id: "act-003",
                    type: "share",
                    title: "Data shared",
                    description: "You shared census data to register for EcoPoints",
                    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
                    service: "EcoPoints Program",
                    accessor: "Ayuntamiento - Medio Ambiente",
                    dataShared: ["Census registration", "District"],
                    txId: "def456datashare789ghi012",
                },
                {
                    id: "act-004",
                    type: "verification",
                    title: "Credential verified",
                    description: "Your Census Credential was verified at recycling point",
                    timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
                    service: "EcoPoints - Punto Limpio Norte",
                    accessor: "Sistema EcoPuntos",
                    dataShared: ["Census status"],
                    txId: "ghi012verification345jkl678",
                },
                {
                    id: "act-005",
                    type: "credential_issued",
                    title: "Credential issued",
                    description: "You received a new Census Credential",
                    timestamp: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
                    service: "Ayuntamiento - Padron Municipal",
                    txId: "jkl345credential678mno901",
                },
                {
                    id: "act-006",
                    type: "token_use",
                    title: "EcoPoints earned",
                    description: "You earned 50 EcoPoints for recycling at Punto Limpio",
                    timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
                    service: "EcoPoints - Punto Limpio Norte",
                    txId: "mno678ecopoints901pqr234",
                },
            ] as Activity[],
            hasMoreActivities: true,
        };
    },
    computed: {
        filteredActivities(): Activity[] {
            return this.activities.filter(activity => {
                // Filter by type
                if (this.filters.type && activity.type !== this.filters.type) {
                    return false;
                }
                
                // Filter by service
                if (this.filters.service) {
                    const serviceMap: Record<string, string> = {
                        parking_pmr: "PMR Parking",
                        eco_puntos: "EcoPoints",
                        transport: "Transport",
                    };
                    if (!activity.service.toLowerCase().includes(serviceMap[this.filters.service]?.toLowerCase() || this.filters.service)) {
                        return false;
                    }
                }
                
                // Filter by period
                if (this.filters.period !== "all") {
                    const days = parseInt(this.filters.period);
                    const cutoff = new Date();
                    cutoff.setDate(cutoff.getDate() - days);
                    if (new Date(activity.timestamp) < cutoff) {
                        return false;
                    }
                }
                
                return true;
            });
        },
    },
    methods: {
        formatRelativeTime(timestamp: string): string {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffHours < 1) {
                return this.$t("Just now") as string;
            } else if (diffHours < 24) {
                return `${diffHours}h ${this.$t("ago")}`;
            } else if (diffDays === 1) {
                return this.$t("Yesterday") as string;
            } else if (diffDays < 7) {
                return `${diffDays} ${this.$t("days ago")}`;
            } else {
                return date.toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                });
            }
        },
        getActivityIcon(type: string): string {
            const icons: Record<string, string> = {
                verification: "mdi-check-decagram",
                share: "mdi-share-variant",
                token_use: "mdi-ticket-confirmation",
                credential_issued: "mdi-certificate",
            };
            return icons[type] || "mdi-clipboard-text";
        },
        truncateTx(tx: string): string {
            if (tx.length <= 16) return tx;
            return tx.substring(0, 8) + "..." + tx.slice(-6);
        },
        getBlockchainUrl(txId: string): string {
            return `/block-explorer/transaction/${txId}`;
        },
        loadMore() {
            // TODO: Cargar mas actividades desde el API
            this.hasMoreActivities = false;
        },
    },
    mounted: function () {
        // TODO: Cargar actividades desde el API
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

/* Stat Cards */
.activity-summary {
    margin-bottom: var(--a11y-spacing-lg);
}

.stat-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--a11y-spacing-md);
}

.stat-card {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-md);
    padding: var(--a11y-spacing-lg);
}

.stat-icon {
    font-size: 1.75rem;
    color: var(--a11y-primary);
    flex-shrink: 0;
}

.stat-content {
    display: flex;
    flex-direction: column;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--a11y-primary);
    line-height: 1.2;
}

.stat-label {
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
}

/* Filters */
.filters-section {
    padding: var(--a11y-spacing-lg);
}

.filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--a11y-spacing-md);
}

/* Activity Timeline */
.activity-timeline h2 {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-lg);
}

.results-count {
    font-weight: 400;
    color: var(--a11y-text-secondary);
    font-size: var(--a11y-font-size-base);
}

.timeline {
    display: flex;
    flex-direction: column;
    gap: var(--a11y-spacing-md);
}

/* Activity Card */
.activity-card {
    padding: var(--a11y-spacing-lg);
    border-left: 4px solid var(--a11y-primary);
}

.activity-icon {
    font-size: 1.75rem;
    color: var(--a11y-primary);
    flex-shrink: 0;
}

.activity-content {
    flex: 1;
    min-width: 0;
}

.activity-header {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-xs);
}

.activity-title {
    font-size: var(--a11y-font-size-base);
    font-weight: 600;
    margin: 0;
    flex: 1;
}

.activity-time {
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
    white-space: nowrap;
}

.activity-description {
    margin: 0;
    margin-bottom: var(--a11y-spacing-sm);
    color: var(--a11y-text-secondary);
}

.activity-details {
    display: flex;
    flex-wrap: wrap;
    gap: var(--a11y-spacing-md);
    margin-bottom: var(--a11y-spacing-sm);
}

.detail-item {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
    font-size: var(--a11y-font-size-small);
}

.detail-item i {
    color: var(--a11y-text-secondary);
}

.detail-item.data-shared {
    width: 100%;
    padding: var(--a11y-spacing-xs) var(--a11y-spacing-sm);
    background-color: #f5f5f5;
    border-radius: var(--a11y-border-radius);
}

/* Blockchain Ref */
.blockchain-ref {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
    padding-top: var(--a11y-spacing-sm);
    border-top: 1px solid #e0e0e0;
}

.tx-link {
    color: var(--a11y-primary);
    text-decoration: none;
    font-family: monospace;
    display: inline-flex;
    align-items: center;
    gap: 2px;
}

.tx-link:hover {
    text-decoration: underline;
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

/* Load More */
.load-more {
    text-align: center;
    margin-top: var(--a11y-spacing-lg);
}

/* Privacy Info */
.privacy-info {
    padding: var(--a11y-spacing-lg);
    background-color: #f8f9fa;
}

.privacy-info h3 {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    color: var(--a11y-success);
}

.privacy-list {
    margin: var(--a11y-spacing-md) 0 0 var(--a11y-spacing-md);
    padding: 0;
}

.privacy-list li {
    margin-bottom: var(--a11y-spacing-sm);
}

/* Responsive */
@media (max-width: 1024px) {
    .stat-cards {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .miciudad-mi-actividad {
        padding: var(--a11y-spacing-md);
    }
    
    .activity-card {
        flex-direction: column;
    }
    
    .activity-header {
        flex-direction: column;
        gap: var(--a11y-spacing-xs);
    }
    
    .activity-details {
        flex-direction: column;
        gap: var(--a11y-spacing-xs);
    }
}
</style>
