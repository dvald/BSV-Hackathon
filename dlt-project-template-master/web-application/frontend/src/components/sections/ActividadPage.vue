<template>
    <div class="page-content miciudad-actividad" tabindex="-1">
        <!-- Skip link para accesibilidad -->
        <a href="#main-content" class="a11y-skip-link">
            {{ $t("Skip to main content") }}
        </a>

        <!-- Encabezado -->
        <header class="page-header">
            <div class="header-content">
                <h1 class="a11y-heading-1">
                    <i class="mdi mdi-clipboard-text-clock" aria-hidden="true"></i>
                    {{ $t("Activity and Traceability") }}
                </h1>
            <p class="a11y-text-secondary">
                {{ $t("Review all actions performed: issuance, verification and revocation of credentials") }}
            </p>
            </div>
            <div class="header-actions">
                <button 
                    @click="exportAuditLog"
                    class="a11y-btn a11y-btn-secondary"
                    :aria-label="$t('Export audit log')"
                >
                    <i class="mdi mdi-download" aria-hidden="true"></i>
                    {{ $t("Export") }}
                </button>
            </div>
        </header>

        <main id="main-content">
            <!-- Estadísticas de actividad -->
            <section aria-labelledby="activity-stats-heading" class="activity-stats">
                <h2 id="activity-stats-heading" class="a11y-visually-hidden">
                    {{ $t("Activity statistics") }}
                </h2>
                
                <div class="stats-cards">
                    <article class="stat-card a11y-card">
                        <i class="mdi mdi-certificate stat-icon" aria-hidden="true"></i>
                        <div class="stat-content">
                            <span class="stat-value">{{ formatNumber(stats.credentialsIssued) }}</span>
                            <span class="stat-label">{{ $t("Credentials issued") }}</span>
                            
                        </div>
                    </article>
                    
                    <article class="stat-card a11y-card">
                        <i class="mdi mdi-check-decagram stat-icon" aria-hidden="true"></i>
                        <div class="stat-content">
                            <span class="stat-value">{{ formatNumber(stats.verificationsToday) }}</span>
                            <span class="stat-label">{{ $t("Verifications") }}</span>
                        </div>
                    </article>
                    
                    <article class="stat-card a11y-card">
                        <i class="mdi mdi-link-variant stat-icon" aria-hidden="true"></i>
                        <div class="stat-content">
                            <span class="stat-value">{{ formatNumber(stats.blockchainTx) }}</span>
                            <span class="stat-label">{{ $t("Blockchain transactions") }}</span>
                        </div>
                    </article>
                    
                    <article class="stat-card a11y-card">
                        <i class="mdi mdi-cancel stat-icon" aria-hidden="true"></i>
                        <div class="stat-content">
                            <span class="stat-value">{{ stats.revocations }}</span>
                            <span class="stat-label">{{ $t("Revocations") }}</span>
                        </div>
                    </article>
                </div>
            </section>

            <!-- Filtros -->
            <section class="filters-section a11y-card" aria-labelledby="filters-heading">
                <h2 id="filters-heading" class="a11y-visually-hidden">{{ $t("Filters") }}</h2>
                
                <div class="filters-grid">
                    <div class="a11y-form-group">
                        <label for="filter-type" class="a11y-label">
                            {{ $t("Event type") }}
                        </label>
                        <select 
                            id="filter-type" 
                            v-model="filters.type"
                            class="a11y-select"
                        >
                            <option value="">{{ $t("All types") }}</option>
                            <option value="credential_issued">{{ $t("Credential issued") }}</option>
                            <option value="credential_verified">{{ $t("Credential verified") }}</option>
                            <option value="credential_revoked">{{ $t("Credential revoked") }}</option>
                            <option value="token_issued">{{ $t("Token issued") }}</option>
                            <option value="token_used">{{ $t("Token used") }}</option>
                            <option value="presentation_created">{{ $t("Presentation created") }}</option>
                            <option value="user_registered">{{ $t("User registered") }}</option>
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
                            <option value="admin">{{ $t("Administration") }}</option>
                        </select>
                    </div>

                    <div class="a11y-form-group">
                        <label for="filter-date-from" class="a11y-label">
                            {{ $t("From date") }}
                        </label>
                        <input 
                            id="filter-date-from"
                            type="date"
                            v-model="filters.dateFrom"
                            class="a11y-input"
                        />
                    </div>

                    <div class="a11y-form-group">
                        <label for="filter-date-to" class="a11y-label">
                            {{ $t("To date") }}
                        </label>
                        <input 
                            id="filter-date-to"
                            type="date"
                            v-model="filters.dateTo"
                            class="a11y-input"
                        />
                    </div>
                    
                    <div class="a11y-form-group search-group">
                        <label for="filter-search" class="a11y-label">
                            {{ $t("Search") }}
                        </label>
                        <input 
                            id="filter-search"
                            type="search"
                            v-model="filters.search"
                            class="a11y-input"
                            :placeholder="$t('Citizen, transaction ID...')"
                        />
                    </div>
                </div>
            </section>

            <!-- Timeline de eventos -->
            <section aria-labelledby="events-heading" class="a11y-mt-lg">
                <div class="section-header">
                    <h2 id="events-heading" class="a11y-heading-2">
                        {{ $t("Event log") }}
                        <span class="results-count">({{ filteredEvents.length }})</span>
                    </h2>
                    <div class="view-toggle" role="group" aria-label="View mode">
                        <button 
                            @click="viewMode = 'timeline'"
                            class="toggle-btn"
                            :class="{ active: viewMode === 'timeline' }"
                            :aria-pressed="viewMode === 'timeline'"
                        >
                            <i class="mdi mdi-format-list-bulleted"></i> {{ $t("Timeline") }}
                        </button>
                        <button 
                            @click="viewMode = 'table'"
                            class="toggle-btn"
                            :class="{ active: viewMode === 'table' }"
                            :aria-pressed="viewMode === 'table'"
                        >
                            <i class="mdi mdi-table"></i> {{ $t("Table") }}
                        </button>
                    </div>
                </div>

                <!-- Vista Timeline -->
                <div v-if="viewMode === 'timeline'" class="timeline-view">
                    <article 
                        v-for="event in paginatedEvents"
                        :key="event.id"
                        class="event-card a11y-card"
                        :class="getEventTypeClass(event.type)"
                    >
                        <div class="event-header">
                            <i :class="'mdi ' + getEventIcon(event.type) + ' event-icon'" aria-hidden="true"></i>
                            <div class="event-main">
                                <h3 class="event-title">{{ $t(getEventTitle(event.type)) }}</h3>
                                <time class="event-time" :datetime="event.timestamp">
                                    {{ formatDateTime(event.timestamp) }}
                                </time>
                            </div>
                            <span 
                                class="a11y-badge"
                                :class="getEventBadgeClass(event.type)"
                            >
                                {{ $t(getEventCategory(event.type)) }}
                            </span>
                        </div>
                        
                        <div class="event-body">
                            <p class="event-description">{{ event.description }}</p>
                            
                            <div class="event-details">
                                <div v-if="event.actor" class="detail-item">
                                    <span class="detail-label">{{ $t("Actor") }}:</span>
                                    <span class="detail-value">{{ event.actor }}</span>
                                </div>
                                <div v-if="event.subject" class="detail-item">
                                    <span class="detail-label">{{ $t("Subject") }}:</span>
                                    <span class="detail-value">{{ event.subject }}</span>
                                </div>
                                <div v-if="event.service" class="detail-item">
                                    <span class="detail-label">{{ $t("Service") }}:</span>
                                    <span class="detail-value">{{ $t(event.service) }}</span>
                                </div>
                            </div>
                        </div>
                        
                        <footer class="event-footer" v-if="event.txId">
                            <div class="blockchain-ref">
                                <span class="blockchain-label">
                                    <i class="mdi mdi-link-variant" aria-hidden="true"></i>
                                    {{ $t("Blockchain reference") }}:
                                </span>
                                <a 
                                    :href="getBlockchainUrl(event.txId)"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="blockchain-link"
                                >
                                    {{ event.txId }}
                                    <span class="a11y-visually-hidden">
                                        {{ $t("(opens in new window)") }}
                                    </span>
                                </a>
                                <button 
                                    @click="copyTxId(event.txId)"
                                    class="copy-btn"
                                    :aria-label="$t('Copy transaction ID')"
                                >
                                    <i class="mdi mdi-content-copy"></i>
                                </button>
                            </div>
                            <span 
                                class="verification-status"
                                :class="event.verified ? 'verified' : 'pending'"
                            >
                                <i :class="event.verified ? 'mdi mdi-check-circle' : 'mdi mdi-clock-outline'" aria-hidden="true"></i>
                                {{ event.verified ? $t("Verified on blockchain") : $t("Pending confirmation") }}
                            </span>
                        </footer>
                    </article>
                </div>

                <!-- Vista Tabla -->
                <div v-if="viewMode === 'table'" class="table-view">
                    <div class="a11y-table-responsive">
                        <table class="a11y-table events-table">
                            <thead>
                                <tr>
                                    <th scope="col">{{ $t("Date/Time") }}</th>
                                    <th scope="col">{{ $t("Type") }}</th>
                                    <th scope="col">{{ $t("Description") }}</th>
                                    <th scope="col">{{ $t("Actor") }}</th>
                                    <th scope="col">{{ $t("Service") }}</th>
                                    <th scope="col">{{ $t("Blockchain") }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="event in paginatedEvents" :key="event.id">
                                    <td>
                                        <time :datetime="event.timestamp" class="table-time">
                                            {{ formatDateTimeShort(event.timestamp) }}
                                        </time>
                                    </td>
                                    <td>
                                        <span class="event-type-cell">
                                            <i :class="'mdi ' + getEventIcon(event.type)"></i>
                                            {{ $t(getEventTitle(event.type)) }}
                                        </span>
                                    </td>
                                    <td class="description-cell">{{ event.description }}</td>
                                    <td>{{ event.actor || '-' }}</td>
                                    <td>{{ event.service ? $t(event.service) : '-' }}</td>
                                    <td>
                                        <a 
                                            v-if="event.txId"
                                            :href="getBlockchainUrl(event.txId)"
                                            target="_blank"
                                            rel="noopener"
                                            class="tx-link"
                                        >
                                            {{ truncateTx(event.txId) }}
                                            <span v-if="event.verified" class="verified-dot" title="Verified">✓</span>
                                        </a>
                                        <span v-else>-</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Estado vacío -->
                <div 
                    v-if="filteredEvents.length === 0" 
                    class="empty-state a11y-card"
                    role="status"
                >
                    <i class="mdi mdi-email-outline empty-icon" aria-hidden="true"></i>
                    <p class="empty-title">{{ $t("No events found") }}</p>
                    <p class="empty-desc a11y-text-secondary">
                        {{ $t("Try adjusting your filters to see more results") }}
                    </p>
                </div>

                <!-- Paginación -->
                <nav 
                    v-if="totalPages > 1"
                    class="pagination" 
                    aria-label="Event log pagination"
                >
                    <button 
                        @click="currentPage--"
                        :disabled="currentPage === 1"
                        class="a11y-btn a11y-btn-secondary"
                        :aria-label="$t('Previous page')"
                    >
                        ← {{ $t("Previous") }}
                    </button>
                    
                    <span class="page-info" aria-live="polite">
                        {{ $t("Page") }} {{ currentPage }} {{ $t("of") }} {{ totalPages }}
                    </span>
                    
                    <button 
                        @click="currentPage++"
                        :disabled="currentPage === totalPages"
                        class="a11y-btn a11y-btn-secondary"
                        :aria-label="$t('Next page')"
                    >
                        {{ $t("Next") }} →
                    </button>
                </nav>
            </section>

            <!-- Info sobre verificación blockchain -->
            <aside class="blockchain-info a11y-card a11y-mt-lg" aria-labelledby="blockchain-info-heading">
                <h3 id="blockchain-info-heading" class="a11y-heading-3">
                    <i class="mdi mdi-information" aria-hidden="true"></i>
                    {{ $t("About blockchain traceability") }}
                </h3>
                <p class="a11y-text">
                    {{ $t("Each action in MiCiudadID is recorded on the BSV blockchain, providing:") }}
                </p>
                <ul class="info-list">
                    <li>
                        <strong>{{ $t("Immutability") }}:</strong>
                        {{ $t("Records cannot be altered once confirmed") }}
                    </li>
                    <li>
                        <strong>{{ $t("Transparency") }}:</strong>
                        {{ $t("Anyone can verify transactions on the public blockchain") }}
                    </li>
                    <li>
                        <strong>{{ $t("Traceability") }}:</strong>
                        {{ $t("Complete audit trail for all credential operations") }}
                    </li>
                    <li>
                        <strong>{{ $t("Privacy") }}:</strong>
                        {{ $t("Only hashes are stored on-chain, personal data remains private") }}
                    </li>
                </ul>
            </aside>
        </main>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useWallet } from "@/composables/useWallet";
import { getApiUrl } from "@/api/utils";

interface AuditEvent {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    actor?: string;
    subject?: string;
    service?: string;
    txId?: string;
    verified: boolean;
    amount?: number;
}

export default defineComponent({
    components: {},
    name: "ActividadPage",
    setup() {
        const { identityKey } = useWallet();
        return { identityKey };
    },
    data: function () {
        return {
            viewMode: "timeline" as "timeline" | "table",
            currentPage: 1,
            pageSize: 10,
            loading: false,
            filters: {
                type: "",
                service: "",
                dateFrom: "",
                dateTo: "",
                search: "",
            },
            stats: {
                credentialsIssued: 234,
                verificationsToday: 1456,
                blockchainTx: 0,
                revocations: 12,
            },
            // Events will be loaded from API and combined with hardcoded credentials
            events: [] as AuditEvent[],
        };
    },
    computed: {
        filteredEvents(): AuditEvent[] {
            return this.events.filter((event) => {
                // Filter by type
                if (this.filters.type && event.type !== this.filters.type) {
                    return false;
                }
                
                // Filter by service
                if (this.filters.service) {
                    if (this.filters.service === "parking_pmr" && event.service !== "PMR Parking") {
                        return false;
                    }
                    if (this.filters.service === "eco_puntos" && event.service !== "EcoPoints") {
                        return false;
                    }
                    if (this.filters.service === "admin" && event.service !== "Administration") {
                        return false;
                    }
                }
                
                // Filter by date range
                if (this.filters.dateFrom) {
                    const eventDate = new Date(event.timestamp);
                    const fromDate = new Date(this.filters.dateFrom);
                    if (eventDate < fromDate) return false;
                }
                
                if (this.filters.dateTo) {
                    const eventDate = new Date(event.timestamp);
                    const toDate = new Date(this.filters.dateTo);
                    toDate.setHours(23, 59, 59);
                    if (eventDate > toDate) return false;
                }
                
                // Filter by search
                if (this.filters.search) {
                    const search = this.filters.search.toLowerCase();
                    return (
                        event.description.toLowerCase().includes(search) ||
                        (event.actor && event.actor.toLowerCase().includes(search)) ||
                        (event.subject && event.subject.toLowerCase().includes(search)) ||
                        (event.txId && event.txId.toLowerCase().includes(search))
                    );
                }
                
                return true;
            });
        },
        totalPages(): number {
            return Math.ceil(this.filteredEvents.length / this.pageSize);
        },
        paginatedEvents(): AuditEvent[] {
            const start = (this.currentPage - 1) * this.pageSize;
            return this.filteredEvents.slice(start, start + this.pageSize);
        },
    },
    methods: {
        formatNumber(num: number): string {
            return new Intl.NumberFormat("es-ES").format(num);
        },
        formatDateTime(timestamp: string): string {
            return new Date(timestamp).toLocaleString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        },
        formatDateTimeShort(timestamp: string): string {
            return new Date(timestamp).toLocaleString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
        },
        truncateTx(tx: string): string {
            if (tx.length <= 16) return tx;
            return tx.substring(0, 8) + "..." + tx.slice(-6);
        },
        getEventIcon(type: string): string {
            const icons: Record<string, string> = {
                credential_issued: "mdi-certificate",
                credential_verified: "mdi-check-decagram",
                credential_revoked: "mdi-cancel",
                token_issued: "mdi-hand-coin",
                token_used: "mdi-ticket-confirmation",
                token_created: "mdi-plus-circle",
                token_transfer: "mdi-swap-horizontal",
                token_operation: "mdi-cog",
                file_uploaded: "mdi-file-check",
                presentation_created: "mdi-file-document",
                user_registered: "mdi-account-plus",
            };
            return icons[type] || "mdi-clipboard-text";
        },
        getEventTitle(type: string): string {
            const titles: Record<string, string> = {
                credential_issued: "Credential issued",
                credential_verified: "Credential verified",
                credential_revoked: "Credential revoked",
                token_issued: "Token issued",
                token_used: "Token used",
                token_created: "Token created",
                token_transfer: "Token transfer",
                token_operation: "Token operation",
                file_uploaded: "File uploaded",
                presentation_created: "Presentation created",
                user_registered: "User registered",
            };
            return titles[type] || type;
        },
        getEventCategory(type: string): string {
            if (type.startsWith("credential")) return "Credential";
            if (type.startsWith("token")) return "Token";
            if (type.startsWith("file")) return "Storage";
            if (type.startsWith("presentation")) return "Presentation";
            if (type.startsWith("user")) return "User";
            return "System";
        },
        getEventTypeClass(type: string): string {
            const classes: Record<string, string> = {
                credential_issued: "event-success",
                credential_verified: "event-info",
                credential_revoked: "event-danger",
                token_issued: "event-success",
                token_used: "event-info",
                presentation_created: "event-info",
                user_registered: "event-success",
            };
            return classes[type] || "";
        },
        getEventBadgeClass(type: string): string {
            if (type.includes("revoked")) return "a11y-badge-error";
            if (type.includes("verified") || type.includes("used")) return "a11y-badge-info";
            if (type.includes("issued") || type.includes("registered")) return "a11y-badge-success";
            return "a11y-badge-info";
        },
        getBlockchainUrl(txId: string): string {
            // Real WhatsonChain URL for BSV mainnet
            if (!txId || txId.length < 10) return '#';
            return `https://whatsonchain.com/tx/${txId}`;
        },
        copyTxId(txId: string) {
            navigator.clipboard.writeText(txId);
            // TODO: Mostrar notificación
        },
        exportAuditLog() {
            // TODO: Exportar en CSV/JSON
            console.log("Export audit log");
        },
        // Get hardcoded credential events (kept as requested)
        getHardcodedCredentialEvents(): AuditEvent[] {
            return [
                {
                    id: "cred-001",
                    type: "credential_issued",
                    description: "Credencial de Familia Numerosa emitida",
                    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
                    actor: "Admin Sistema",
                    subject: "Ciudadano ****8765",
                    service: "Administration",
                    txId: undefined,
                    verified: false
                },
                {
                    id: "cred-002",
                    type: "credential_verified",
                    description: "Credencial de Discapacidad verificada en Parking PMR",
                    timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
                    actor: "Sistema Parking",
                    subject: "Ciudadano ****4521",
                    service: "PMR Parking",
                    txId: undefined,
                    verified: false
                },
                {
                    id: "cred-003",
                    type: "user_registered",
                    description: "Nuevo ciudadano registrado con DID creado",
                    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
                    actor: "Admin Carlos López",
                    subject: "Ciudadano ****9087",
                    service: "Administration",
                    txId: undefined,
                    verified: false
                }
            ];
        },
        // Load real transactions from backend
        async loadTransactions() {
            this.loading = true;
            try {
                let data: any = null;
                
                // If we have an identity key, try user-specific transactions first
                if (this.identityKey) {
                    console.log('Loading user transactions for:', this.identityKey.substring(0, 16) + '...');
                    const response = await fetch(getApiUrl('/api/v1/gamification/transactions'), {
                        headers: { 
                            'x-bsv-identity-key': this.identityKey,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (response.ok) {
                        data = await response.json();
                    }
                }
                
                // If no user transactions or no identity key, load all for demo
                if (!data || !data.events || data.events.length === 0) {
                    console.log('Loading all transactions (demo mode)...');
                    const response = await fetch(getApiUrl('/api/v1/gamification/all-transactions'));
                    if (response.ok) {
                        data = await response.json();
                    }
                }

                if (data && data.events) {
                    console.log('Loaded transactions:', data);

                    // Map token events to audit events
                    const tokenEvents: AuditEvent[] = (data.events || []).map((e: any) => ({
                        id: e.id,
                        type: e.type,
                        description: e.description || `${e.amount} tokens`,
                        timestamp: e.timestamp,
                        actor: e.actor || "System",
                        service: e.service || "Token Service",
                        txId: e.txId,
                        verified: e.verified || false,
                        amount: e.amount
                    }));

                    // Get hardcoded credential events
                    const credentialEvents = this.getHardcodedCredentialEvents();

                    // Combine and sort by timestamp (newest first)
                    this.events = [...tokenEvents, ...credentialEvents]
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                    // Update stats with real blockchain tx count
                    this.stats.blockchainTx = tokenEvents.filter((e: AuditEvent) => e.txId && e.txId.length > 10).length;
                }
            } catch (error) {
                console.error('Error loading transactions:', error);
            } finally {
                this.loading = false;
            }
        },
    },
    watch: {
        filters: {
            deep: true,
            handler() {
                this.currentPage = 1;
            },
        },
        identityKey: {
            immediate: true,
            handler(newVal: string) {
                if (newVal) {
                    this.loadTransactions();
                }
            }
        }
    },
    mounted: function () {
        // Always load transactions - will use fallback if no identityKey
        this.loadTransactions();
    },
    beforeUnmount: function () {},
});
</script>

<style scoped>


/* Header */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: var(--a11y-spacing-md);
    margin-bottom: var(--a11y-spacing-lg);
}

.page-header h1 {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
}

/* Stats Cards - Consistente con Dashboard */
.activity-stats {
    margin-bottom: var(--a11y-spacing-lg);
}

.stats-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
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
    display: flex;
    flex-direction: column;
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
}

.stat-period {
    font-size: 0.75rem;
    color: var(--a11y-text-secondary, #595959);
    margin-top: 0.125rem;
}

/* Filters */
.filters-section.a11y-card {
    padding: 0.75rem 1rem;
}

.filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.5rem;
}

.filters-section .a11y-form-group {
    margin-bottom: 0;
}

.filters-section .a11y-label {
    margin-bottom: 0.25rem;
    font-size: 0.85rem;
}

.filters-section .a11y-select,
.filters-section .a11y-input {
    padding: 0.4rem 0.75rem;
    font-size: 0.9rem;
}

.search-group {
    grid-column: span 2;
}

/* Section Header */
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--a11y-spacing-md);
    flex-wrap: wrap;
    gap: var(--a11y-spacing-sm);
}

.results-count {
    font-weight: 400;
    color: var(--a11y-text-secondary);
}

/* View Toggle */
.view-toggle {
    display: flex;
    gap: 2px;
    background-color: #e0e0e0;
    border-radius: var(--a11y-border-radius);
    padding: 2px;
}

.toggle-btn {
    padding: var(--a11y-spacing-xs) var(--a11y-spacing-sm);
    background: transparent;
    border: none;
    border-radius: calc(var(--a11y-border-radius) - 2px);
    cursor: pointer;
    font-size: var(--a11y-font-size-small);
    transition: all var(--a11y-transition);
}

.toggle-btn:hover {
    background-color: rgba(255, 255, 255, 0.5);
}

.toggle-btn.active {
    background-color: white;
    font-weight: 600;
}

/* Timeline View */
.timeline-view {
    display: flex;
    flex-direction: column;
    gap: var(--a11y-spacing-md);
}

.event-card {
    position: relative;
    border-left: 4px solid #e0e0e0;
}

.event-card.event-success {
    border-left-color: var(--a11y-success);
}

.event-card.event-info {
    border-left-color: var(--a11y-info);
}

.event-card.event-danger {
    border-left-color: var(--a11y-error);
}

.event-header {
    display: flex;
    align-items: flex-start;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-md);
}

.event-icon {
    font-size: 1.5rem;
}

.event-main {
    flex: 1;
}

.event-title {
    font-size: var(--a11y-font-size-base);
    font-weight: 600;
    margin: 0;
    margin-bottom: var(--a11y-spacing-xs);
}

.event-time {
    font-size: var(--a11y-font-size-small);
    font-style: italic;
    color: #595959; /* Contraste 7:1 - WCAG AAA */
}

.event-body {
    margin-bottom: var(--a11y-spacing-md);
}

.event-description {
    margin: 0;
    margin-bottom: var(--a11y-spacing-sm);
}

.event-details {
    display: flex;
    flex-wrap: wrap;
    gap: var(--a11y-spacing-md);
}

.detail-item {
    display: flex;
    gap: var(--a11y-spacing-xs);
    font-size: var(--a11y-font-size-small);
}

.detail-label {
    color: var(--a11y-text-secondary);
}

.detail-value {
    font-weight: 500;
}

.event-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--a11y-spacing-sm);
    padding-top: var(--a11y-spacing-md);
    border-top: 1px solid #e0e0e0;
}

.blockchain-ref {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
    font-size: var(--a11y-font-size-small);
}

.blockchain-label {
    color: var(--a11y-text-secondary);
}

.blockchain-link {
    font-family: monospace;
    color: var(--a11y-primary);
    text-decoration: none;
    word-break: break-all;
}

.blockchain-link:hover {
    text-decoration: underline;
}

.copy-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    font-size: 1rem;
}

.verification-status {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
    font-size: var(--a11y-font-size-small);
}

.verification-status.verified {
    color: var(--a11y-success);
}

.verification-status.pending {
    color: var(--a11y-warning);
}

/* Table View */
.events-table .description-cell {
    max-width: 300px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.table-time {
    font-style: italic;
    color: #595959; /* Contraste 7:1 - WCAG AAA */
    white-space: nowrap;
}

.event-type-cell {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
    white-space: nowrap;
}

.tx-link {
    display: inline-flex;
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

.verified-dot {
    color: var(--a11y-success);
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
}

.empty-title {
    font-size: var(--a11y-font-size-large);
    font-weight: 600;
    margin: 0;
    margin-bottom: var(--a11y-spacing-sm);
}

/* Pagination */
.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--a11y-spacing-md);
    margin-top: var(--a11y-spacing-lg);
    padding-top: var(--a11y-spacing-md);
    border-top: 1px solid #e0e0e0;
}

.page-info {
    font-size: var(--a11y-font-size-base);
}

/* Blockchain Info */
.blockchain-info {
    padding: var(--a11y-spacing-lg);
    background-color: #f8f9fa;
}

.blockchain-info h3 {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
}

.info-list {
    margin: var(--a11y-spacing-md) 0 0 var(--a11y-spacing-md);
    padding: 0;
}

.info-list li {
    margin-bottom: var(--a11y-spacing-sm);
}

/* Responsive */
@media (max-width: 1200px) {
    .stats-cards {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 1024px) {
    .filters-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .search-group {
        grid-column: span 2;
    }
}

@media (max-width: 768px) {
    .miciudad-actividad {
        padding: var(--a11y-spacing-md);
    }
    
    .page-header {
        flex-direction: column;
    }
    
    .stats-cards {
        grid-template-columns: 1fr;
    }
    
    .filters-grid {
        grid-template-columns: 1fr;
    }
    
    .search-group {
        grid-column: auto;
    }
    
    .section-header {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .event-footer {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .blockchain-ref {
        flex-wrap: wrap;
    }
}
</style>

