<template>
    <div class="page-content miciudad-dashboard" tabindex="-1">
        <!-- Skip link para accesibilidad -->
        <a href="#main-content" class="a11y-skip-link">
            {{ $t("Skip to main content") }}
        </a>

        <!-- Encabezado del Dashboard -->
        <header class="dashboard-header">
            <h1 class="a11y-heading-1">
                <i class="mdi mdi-view-dashboard" aria-hidden="true"></i>
                {{ $t("Control Panel") }}
            </h1>
            <p class="a11y-text-secondary">
                {{ $t("Welcome to MiCiudadID management panel") }}
            </p>
        </header>

        <main id="main-content">
            <!-- Alertas/Avisos importantes -->
            <div 
                v-if="showAlert && pendingValidations > 0" 
                class="alert-banner alert-warning" 
                role="alert"
                aria-live="polite"
            >
                <i class="mdi mdi-alert-circle alert-icon" aria-hidden="true"></i>
                <span class="alert-text">
                    <strong>{{ pendingValidations }}</strong> {{ $t("credentials waiting for validation") }}
                </span>
                <router-link 
                    to="/permissions" 
                    class="alert-action"
                    :aria-label="$t('Go to pending validations')"
                >
                    {{ $t("Review") }}
                </router-link>
                <button 
                    type="button" 
                    class="alert-close" 
                    @click="dismissAlert"
                    :aria-label="$t('Dismiss alert')"
                >
                    <i class="mdi mdi-close" aria-hidden="true"></i>
                </button>
            </div>

            <!-- Estadísticas principales -->
            <section aria-labelledby="stats-heading">
                <h2 id="stats-heading" class="a11y-visually-hidden">
                    {{ $t("Platform statistics") }}
                </h2>
                
                <div class="stats-grid">
                    <!-- Ciudadanos registrados -->
                    <article class="stat-card a11y-card" aria-labelledby="stat-citizens">
                        <i class="mdi mdi-account-group stat-icon" aria-hidden="true"></i>
                        <div class="stat-content">
                            <p class="stat-value">{{ formatNumber(stats.totalCitizens) }}</p>
                            <h3 id="stat-citizens" class="stat-label">
                                {{ $t("Registered citizens") }}
                            </h3>
                        </div>
                        <div class="stat-trend" :class="stats.citizensTrend > 0 ? 'trend-up' : 'trend-down'">
                            <i :class="stats.citizensTrend > 0 ? 'mdi mdi-trending-up' : 'mdi mdi-trending-down'" aria-hidden="true"></i>
                            <span class="a11y-visually-hidden">
                                {{ stats.citizensTrend > 0 ? $t('Increasing') : $t('Decreasing') }}
                            </span>
                            {{ Math.abs(stats.citizensTrend) }}%
                        </div>
                    </article>

                    <!-- Credenciales activas -->
                    <article class="stat-card a11y-card" aria-labelledby="stat-credentials">
                        <i class="mdi mdi-certificate stat-icon" aria-hidden="true"></i>
                        <div class="stat-content">
                            <p class="stat-value">{{ formatNumber(stats.activeCredentials) }}</p>
                            <h3 id="stat-credentials" class="stat-label">
                                {{ $t("Active credentials") }}
                            </h3>
                        </div>
                    </article>

                    <!-- Tokens emitidos (EcoPuntos + Parking) -->
                    <article class="stat-card a11y-card" aria-labelledby="stat-tokens">
                        <i class="mdi mdi-hand-coin stat-icon" aria-hidden="true"></i>
                        <div class="stat-content">
                            <p class="stat-value">{{ formatNumber(stats.tokensIssued) }}</p>
                            <h3 id="stat-tokens" class="stat-label">
                                {{ $t("Tokens issued") }}
                            </h3>
                        </div>
                    </article>

                    <!-- Servicios activos -->
                    <article class="stat-card a11y-card" aria-labelledby="stat-services">
                        <i class="mdi mdi-domain stat-icon" aria-hidden="true"></i>
                        <div class="stat-content">
                            <p class="stat-value">{{ stats.activeServices }}</p>
                            <h3 id="stat-services" class="stat-label">
                                {{ $t("Active services") }}
                            </h3>
                        </div>
                    </article>

                    <!-- Transacciones blockchain -->
                    <article class="stat-card a11y-card" aria-labelledby="stat-tx">
                        <i class="mdi mdi-link-variant stat-icon" aria-hidden="true"></i>
                        <div class="stat-content">
                            <p class="stat-value">{{ formatNumber(stats.blockchainTx) }}</p>
                            <h3 id="stat-tx" class="stat-label">
                                {{ $t("Blockchain transactions") }}
                            </h3>
                        </div>
                    </article>

                    <!-- Presentaciones verificadas -->
                    <article class="stat-card a11y-card" aria-labelledby="stat-verifications">
                        <i class="mdi mdi-check-decagram stat-icon" aria-hidden="true"></i>
                        <div class="stat-content">
                            <p class="stat-value">{{ formatNumber(stats.verificationsToday) }}</p>
                            <h3 id="stat-verifications" class="stat-label">
                                {{ $t("Verifications today") }}
                            </h3>
                        </div>
                    </article>
                </div>
            </section>

            <!-- Servicios destacados -->
            <section aria-labelledby="services-heading" class="a11y-mt-lg">
                <h2 id="services-heading" class="a11y-heading-2">
                    {{ $t("Featured services") }}
                </h2>
                
                <div class="services-grid a11y-grid a11y-grid-2">
                    <!-- Tarjeta Movilidad - Parking PMR -->
                    <article class="service-card a11y-card a11y-card-interactive" tabindex="0">
                        <div class="service-header">
                            <i class="mdi mdi-car service-icon" aria-hidden="true"></i>
                            <h3 class="service-title">{{ $t("Mobility") }}</h3>
                            <span class="a11y-badge a11y-badge-success">{{ $t("Active") }}</span>
                        </div>
                        <div class="service-body">
                            <p class="a11y-text">
                                {{ $t("PMR Parking - Accessible parking management for people with reduced mobility") }}
                            </p>
                            <div class="service-stats">
                                <div class="service-stat">
                                    <span class="stat-number">{{ serviceStats.parking.activeUsers }}</span>
                                    <span class="stat-desc">{{ $t("Active users") }}</span>
                                </div>
                                <div class="service-stat">
                                    <span class="stat-number">{{ serviceStats.parking.usesToday }}</span>
                                    <span class="stat-desc">{{ $t("Uses today") }}</span>
                                </div>
                            </div>
                        </div>
                        <footer class="service-footer">
                            <router-link 
                                to="/services?filter=mobility"
                                class="a11y-btn a11y-btn-primary"
                            >
                                {{ $t("Manage") }}
                            </router-link>
                        </footer>
                    </article>

                    <!-- Tarjeta Medio Ambiente - EcoPuntos -->
                    <article class="service-card a11y-card a11y-card-interactive" tabindex="0">
                        <div class="service-header">
                            <i class="mdi mdi-recycle service-icon" aria-hidden="true"></i>
                            <h3 class="service-title">{{ $t("Environment") }}</h3>
                            <span class="a11y-badge a11y-badge-success">{{ $t("Active") }}</span>
                        </div>
                        <div class="service-body">
                            <p class="a11y-text">
                                {{ $t("EcoPoints - Rewards system for recycling and sustainable actions") }}
                            </p>
                            <div class="service-stats">
                                <div class="service-stat">
                                    <span class="stat-number">{{ serviceStats.eco.participants }}</span>
                                    <span class="stat-desc">{{ $t("Participants") }}</span>
                                </div>
                                <div class="service-stat">
                                    <span class="stat-number">{{ formatNumber(serviceStats.eco.totalPoints) }}</span>
                                    <span class="stat-desc">{{ $t("Total points") }}</span>
                                </div>
                            </div>
                        </div>
                        <footer class="service-footer">
                            <router-link 
                                to="/services?filter=environment"
                                class="a11y-btn a11y-btn-primary"
                            >
                                {{ $t("Manage") }}
                            </router-link>
                        </footer>
                    </article>
                </div>
            </section>

            <!-- Actividad reciente -->
            <section aria-labelledby="activity-heading" class="a11y-mt-lg">
                <div class="section-header">
                    <h2 id="activity-heading" class="a11y-heading-2">
                        {{ $t("Recent activity") }}
                    </h2>
                    <router-link to="/activity" class="a11y-btn a11y-btn-secondary">
                        {{ $t("View all") }}
                    </router-link>
                </div>

                <div class="activity-list a11y-card">
                    <ul role="list" class="timeline" aria-label="Recent events timeline">
                        <li 
                            v-for="event in recentActivity" 
                            :key="event.id" 
                            class="timeline-item"
                        >
                            <i :class="'mdi ' + event.icon + ' timeline-icon'" aria-hidden="true"></i>
                            <div class="timeline-content">
                                <p class="timeline-title">{{ $t(event.title) }}</p>
                                <p class="timeline-desc">{{ event.description }}</p>
                            </div>
                            <div class="timeline-meta">
                                <time 
                                    class="timeline-time" 
                                    :datetime="event.timestamp"
                                >
                                    {{ formatTime(event.timestamp) }}
                                </time>
                                <a 
                                    v-if="event.txId" 
                                    :href="getBlockchainExplorerUrl(event.txId)" 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="timeline-link"
                                    :aria-label="$t('View transaction on blockchain explorer')"
                                >
                                    <i class="mdi mdi-open-in-new"></i>
                                </a>
                            </div>
                        </li>
                    </ul>
                </div>
            </section>
        </main>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { AuthController } from "@/control/auth";

export default defineComponent({
    components: {},
    name: "HomePage",
    data: function () {
        return {
            showAlert: true,
            pendingValidations: 5,
            stats: {
                totalCitizens: 12547,
                citizensTrend: 8.2,
                activeCredentials: 34892,
                tokensIssued: 156780,
                activeServices: 2,
                blockchainTx: 89234,
                verificationsToday: 1234,
            },
            serviceStats: {
                parking: {
                    activeUsers: 342,
                    usesToday: 89,
                },
                eco: {
                    participants: 8456,
                    totalPoints: 2345600,
                },
            },
            recentActivity: [
                {
                    id: 1,
                    icon: "mdi-certificate",
                    title: "Credential issued",
                    description: "Credencial de Discapacidad emitida a ciudadano ****4521",
                    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
                    txId: "abc123def456",
                },
                {
                    id: 2,
                    icon: "mdi-check-decagram",
                    title: "Credential verified",
                    description: "Presentación verificada en Parking PMR Centro",
                    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
                    txId: "xyz789ghi012",
                },
                {
                    id: 3,
                    icon: "mdi-hand-coin",
                    title: "Tokens credited",
                    description: "50 EcoPuntos acreditados por reciclaje",
                    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
                    txId: "jkl345mno678",
                },
                {
                    id: 4,
                    icon: "mdi-car",
                    title: "Parking use",
                    description: "Uso de plaza PMR registrado - Plaza Mayor",
                    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
                    txId: null,
                },
                {
                    id: 5,
                    icon: "mdi-account-plus",
                    title: "New citizen",
                    description: "Nuevo ciudadano registrado en el sistema",
                    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
                    txId: "pqr901stu234",
                },
            ],
        };
    },
    computed: {
        isAdmin(): boolean {
            return AuthController.Role === "admin" || AuthController.Role === "root";
        },
    },
    methods: {
        formatNumber(num: number): string {
            return new Intl.NumberFormat("es-ES").format(num);
        },
        formatTime(timestamp: string): string {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 1) return this.$t("Just now");
            if (diffMins < 60) return `${diffMins} ${this.$t("minutes ago")}`;
            
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours} ${this.$t("hours ago")}`;
            
            return date.toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
            });
        },
        getBlockchainExplorerUrl(txId: string): string {
            // TODO: Configurar URL del explorador BSV
            return `/block-explorer/transaction/${txId}`;
        },
        dismissAlert(): void {
            this.showAlert = false;
        },
    },
    mounted: function () {
        // TODO: Cargar datos reales del API
    },
    beforeUnmount: function () {},
});
</script>

<style scoped>

/* Alert Banner compacto */
.alert-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
}

.alert-warning {
    background-color: #fff8e6;
    border: 1px solid #f0c36d;
    color: #8a6d3b;
}

.alert-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
}

.alert-text {
    flex: 1;
}

.alert-text strong {
    font-weight: 600;
}

.alert-action {
    font-size: 0.85rem;
    font-weight: bold;
    color: #b8860b !important;
    text-decoration: none;
    padding: 0.25rem 0.75rem;
    border: 1px solid #b8860b;
    border-radius: 4px;
    background: transparent;
    transition: all 0.15s;
    white-space: nowrap;
}

.alert-action:hover {
    background: #b8860b;
    color: #fff !important;
}

.alert-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    background: transparent;
    color: #8a6d3b;
    cursor: pointer;
    border-radius: 4px;
    font-size: 1rem;
    transition: background 0.15s;
    flex-shrink: 0;
}

.alert-close:hover {
    background: rgba(0,0,0,0.1);
}

.dashboard-header {
    margin-bottom: var(--a11y-spacing-xl);
}

.dashboard-header h1 {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
}

/* Stats Grid - 2 filas de 3 */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: var(--a11y-spacing-lg);
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

.stat-trend {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    flex-shrink: 0;
}

.trend-up {
    color: var(--a11y-success);
    background-color: var(--a11y-success-bg);
}

.trend-down {
    color: var(--a11y-error);
    background-color: var(--a11y-error-bg);
}

/* Service Cards */
.service-card {
    display: flex;
    flex-direction: column;
}

.service-header {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-md);
}

.service-icon {
    font-size: 2rem;
}

.service-title {
    flex: 1;
    font-size: var(--a11y-font-size-large);
    font-weight: 600;
    margin: 0;
}

.service-body {
    flex: 1;
}

.service-stats {
    display: flex;
    gap: var(--a11y-spacing-lg);
    margin-top: var(--a11y-spacing-md);
    padding-top: var(--a11y-spacing-md);
    border-top: 1px solid #e0e0e0;
}

.service-stat {
    display: flex;
    flex-direction: column;
}

.service-stat .stat-number {
    font-size: var(--a11y-font-size-large);
    font-weight: 700;
    color: var(--a11y-primary);
}

.service-stat .stat-desc {
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
}

.service-footer {
    margin-top: var(--a11y-spacing-md);
    padding-top: var(--a11y-spacing-md);
    border-top: 1px solid #e0e0e0;
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

/* Timeline */
.timeline {
    list-style: none;
    padding: 0;
    margin: 0;
}

.timeline-item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: start;
    gap: var(--a11y-spacing-sm, 0.75rem);
    padding: var(--a11y-spacing-md, 1rem) 0;
    border-bottom: 1px solid #e0e0e0;
}

.timeline-item:last-child {
    border-bottom: none;
}

.timeline-icon {
    font-size: 1.5rem;
    color: var(--a11y-primary, #004d99);
}

.timeline-content {
    min-width: 0;
}

.timeline-title {
    font-weight: 600;
    margin: 0;
    margin-bottom: var(--a11y-spacing-xs, 0.25rem);
}

.timeline-desc {
    margin: 0;
    color: var(--a11y-text-secondary, #555);
}

.timeline-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
}

.timeline-time {
    font-size: var(--a11y-font-size-small, 0.875rem);
    color: #595959; /* Contraste 7:1 con blanco - cumple WCAG AAA */
    font-style: italic;
    white-space: nowrap;
}

.timeline-link {
    color: var(--a11y-primary, #004d99);
    font-size: 1.25rem;
    text-decoration: none;
    padding: 0.25rem;
    border-radius: 4px;
    transition: color 0.15s, background 0.15s;
}

.timeline-link:hover {
    background: rgba(0,77,153,0.1);
}

/* Quick Actions */
.quick-action-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--a11y-spacing-lg);
    text-decoration: none;
    color: var(--a11y-text-primary);
    text-align: center;
    min-height: 120px;
}

.quick-action-card:hover,
.quick-action-card:focus {
    background-color: var(--a11y-primary);
    color: var(--a11y-text-on-primary);
}

.action-icon {
    font-size: 2rem;
    margin-bottom: var(--a11y-spacing-sm);
}

.action-label {
    font-weight: 600;
    font-size: var(--a11y-font-size-base);
}

/* Responsive */
@media (max-width: 1024px) {
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .miciudad-dashboard {
        padding: var(--a11y-spacing-md);
    }
    
    .stats-grid {
        grid-template-columns: 1fr;
    }
    
    .stat-card {
        flex-direction: row;
        text-align: left;
    }
    
    .service-stats {
        flex-direction: column;
        gap: var(--a11y-spacing-sm);
    }
    
    .section-header {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>
