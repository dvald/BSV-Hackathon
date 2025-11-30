<template>
    <div class="page-content miciudad-beneficios" tabindex="-1">
        <!-- Skip link para accesibilidad -->
        <a href="#main-content" class="a11y-skip-link">
            {{ $t("Skip to main content") }}
        </a>

        <!-- Encabezado -->
        <header class="page-header">
            <div class="header-content">
                <h1 class="a11y-heading-1">
                    <i class="mdi mdi-trophy" aria-hidden="true"></i>
                    {{ $t("My Benefits") }}
                </h1>
                <p class="a11y-text-secondary">
                    {{ $t("Your rewards, bonuses and sustainable progress") }}
                </p>
            </div>
        </header>

        <main id="main-content">
            <!-- A. Nivel Ciudadano (Gamificación) -->
            <section aria-labelledby="citizen-level-heading" class="citizen-level-section a11y-card">
                <header class="section-header-inner">
                    <h2 id="citizen-level-heading" class="a11y-heading-2">
                        <i class="mdi mdi-trophy" aria-hidden="true"></i>
                        {{ $t("Citizen Level") }}
                    </h2>
                </header>

                <div class="level-content">
                    <!-- Indicador de Nivel -->
                    <div class="current-level">
                        <div class="level-badge" :class="'level-' + currentLevel.key">
                            <i class="mdi mdi-medal level-medal-icon" aria-hidden="true"></i>
                            <span class="level-name">{{ $t(currentLevel.name) }}</span>
                        </div>
                        <div class="level-points">
                            <span class="points-value">{{ formatNumber(totalPoints) }}</span>
                            <span class="points-label">{{ $t("points") }}</span>
                        </div>
                    </div>

                    <!-- Barra de Progreso entre niveles -->
                    <div class="progress-section">
                        <div class="progress-levels" role="img" :aria-label="progressAriaLabel">
                            <div 
                                v-for="(level, index) in levels" 
                                :key="level.key"
                                class="progress-level-marker"
                                :class="{ 
                                    'achieved': totalPoints >= level.minPoints,
                                    'current': currentLevel.key === level.key 
                                }"
                            >
                                <i 
                                    :class="level.icon" 
                                    class="marker-icon"
                                    aria-hidden="true"
                                ></i>
                                <span class="marker-label">{{ $t(level.name) }}</span>
                                <span class="marker-points">{{ formatNumber(level.minPoints) }}</span>
                            </div>
                        </div>
                        
                        <div class="progress-bar-container">
                            <div 
                                class="progress-bar-fill" 
                                :style="{ width: progressPercentage + '%' }"
                                role="progressbar"
                                :aria-valuenow="totalPoints"
                                :aria-valuemin="currentLevel.minPoints"
                                :aria-valuemax="nextLevel ? nextLevel.minPoints : currentLevel.minPoints"
                            ></div>
                        </div>
                    </div>

                    <!-- Incentivo - Mensaje motivacional -->
                    <div v-if="nextLevel" class="incentive-message a11y-card-highlight">
                        <i class="mdi mdi-star incentive-icon" aria-hidden="true"></i>
                        <p class="incentive-text">
                            {{ $t("You're only") }} 
                            <strong>{{ formatNumber(pointsToNextLevel) }} {{ $t("points") }}</strong> 
                            {{ $t("away from reaching") }} 
                            <strong>{{ $t(nextLevel.name) }}</strong>!
                        </p>
                        <i class="mdi mdi-diamond-stone gem-icon" aria-hidden="true"></i>
                    </div>

                    <!-- Hitos alcanzados -->
                    <div class="milestones">
                        <h3 class="a11y-heading-3">
                            <i class="mdi mdi-flag-checkered" aria-hidden="true"></i>
                            {{ $t("Milestones Achieved") }}
                        </h3>
                        <ul class="milestones-list" role="list">
                            <li 
                                v-for="milestone in achievedMilestones" 
                                :key="milestone.id"
                                class="milestone-item"
                            >
                                <i class="mdi mdi-check-circle milestone-check" aria-hidden="true"></i>
                                <span>{{ $t(milestone.name) }}</span>
                                <span class="milestone-date">{{ formatDate(milestone.achievedAt) }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <!-- B. Bonos Activos -->
            <section aria-labelledby="active-bonuses-heading" class="bonuses-section a11y-mt-lg">
                <h2 id="active-bonuses-heading" class="a11y-heading-2">
                    <i class="mdi mdi-ticket-percent" aria-hidden="true"></i>
                    {{ $t("Active Bonuses") }}
                </h2>

                <div class="bonuses-grid a11y-grid a11y-grid-2">
                    <article 
                        v-for="bonus in activeBonuses" 
                        :key="bonus.id"
                        class="bonus-card a11y-card"
                    >
                        <header class="bonus-header">
                            <i :class="bonus.icon + ' bonus-icon'" aria-hidden="true"></i>
                            <h3 class="bonus-title">{{ $t(bonus.name) }}</h3>
                            <span class="a11y-badge a11y-badge-success">{{ $t("Active") }}</span>
                        </header>

                        <div class="bonus-body">
                            <p class="bonus-description a11y-text">
                                {{ $t(bonus.description) }}
                            </p>

                            <!-- Control de Consumo -->
                            <div class="usage-control">
                                <div class="usage-header">
                                    <span class="usage-label">{{ $t("Usage") }}</span>
                                    <span class="usage-value">
                                        {{ bonus.usedCount }} {{ $t("of") }} {{ bonus.totalLimit }} {{ $t("uses") }}
                                    </span>
                                </div>
                                <div class="usage-bar-container">
                                    <div 
                                        class="usage-bar-fill"
                                        :class="{ 
                                            'usage-warning': bonus.usedCount / bonus.totalLimit > 0.75,
                                            'usage-danger': bonus.usedCount / bonus.totalLimit > 0.9
                                        }"
                                        :style="{ width: (bonus.usedCount / bonus.totalLimit * 100) + '%' }"
                                        role="progressbar"
                                        :aria-valuenow="bonus.usedCount"
                                        :aria-valuemax="bonus.totalLimit"
                                        :aria-label="$t('Usage progress')"
                                    ></div>
                                </div>
                                <p class="usage-remaining a11y-text-secondary">
                                    {{ $t("Remaining") }}: <strong>{{ bonus.totalLimit - bonus.usedCount }}</strong> {{ $t("uses") }}
                                </p>
                            </div>

                            <!-- Información de Renovación -->
                            <div class="renewal-info">
                                <i class="mdi mdi-calendar-refresh" aria-hidden="true"></i>
                                <span>{{ $t("Renewal") }}: <strong>{{ bonus.renewalPeriod }}</strong></span>
                                <span class="next-renewal">
                                    {{ $t("Next") }}: {{ formatDate(bonus.nextRenewal) }}
                                </span>
                            </div>

                            <!-- Validación de Requisitos -->
                            <div class="requirements-validation">
                                <div 
                                    v-for="req in bonus.requirements" 
                                    :key="req.id"
                                    class="requirement-item"
                                    :class="{ 'requirement-valid': req.valid }"
                                >
                                    <i 
                                        :class="req.valid ? 'mdi mdi-check-decagram' : 'mdi mdi-alert-circle'" 
                                        class="requirement-icon"
                                        aria-hidden="true"
                                    ></i>
                                    <i :class="req.icon" class="requirement-doc-icon" aria-hidden="true"></i>
                                    <span class="requirement-name">{{ $t(req.name) }}</span>
                                    <span v-if="req.valid" class="requirement-status">{{ $t("Valid") }}</span>
                                    <span v-else class="requirement-status requirement-missing">{{ $t("Missing") }}</span>
                                </div>
                            </div>
                        </div>

                        <footer class="bonus-footer">
                            <button 
                                @click="useBonus(bonus)"
                                class="a11y-btn a11y-btn-primary a11y-btn-large"
                                :disabled="bonus.usedCount >= bonus.totalLimit"
                                :aria-label="$t('Use bonus') + ': ' + $t(bonus.name)"
                            >
                                <i :class="bonus.icon" aria-hidden="true"></i>
                                {{ $t("Use Now") }}
                            </button>
                        </footer>
                    </article>
                </div>

                <!-- Estado vacío para bonos -->
                <div 
                    v-if="activeBonuses.length === 0" 
                    class="empty-state a11y-card"
                    role="status"
                >
                    <i class="mdi mdi-ticket-outline empty-icon" aria-hidden="true"></i>
                    <p class="empty-title">{{ $t("No active bonuses") }}</p>
                    <p class="empty-desc a11y-text-secondary">
                        {{ $t("You don't have any active bonuses yet. Check the available services!") }}
                    </p>
                </div>
            </section>

            <!-- C. EcoPuntos -->
            <section aria-labelledby="ecopoints-heading" class="ecopoints-section a11y-mt-lg">
                <h2 id="ecopoints-heading" class="a11y-heading-2">
                    <i class="mdi mdi-sprout" aria-hidden="true"></i>
                    {{ $t("EcoPoints") }}
                </h2>

                <div class="ecopoints-content">
                    <!-- Resumen de Saldo -->
                    <div class="ecopoints-summary a11y-card">
                        <div class="ecopoints-balance">
                            <i class="mdi mdi-sprout balance-icon" aria-hidden="true"></i>
                            <div class="balance-info">
                                <span class="balance-value">{{ formatNumber(ecoPoints.balance) }}</span>
                                <span class="balance-label">{{ $t("EcoPoints available") }}</span>
                            </div>
                        </div>
                        <div class="ecopoints-level">
                            <i class="mdi mdi-medal" aria-hidden="true"></i>
                            <span class="eco-level-name">{{ $t(ecoPoints.level) }}</span>
                        </div>
                        <div class="ecopoints-stats">
                            <div class="eco-stat">
                                <span class="eco-stat-value">{{ formatNumber(ecoPoints.totalEarned) }}</span>
                                <span class="eco-stat-label">{{ $t("Total earned") }}</span>
                            </div>
                            <div class="eco-stat">
                                <span class="eco-stat-value">{{ formatNumber(ecoPoints.totalRedeemed) }}</span>
                                <span class="eco-stat-label">{{ $t("Redeemed") }}</span>
                            </div>
                            <div class="eco-stat">
                                <span class="eco-stat-value">{{ ecoPoints.actionsCount }}</span>
                                <span class="eco-stat-label">{{ $t("Actions") }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Historial de Transacciones -->
                    <div class="transactions-history a11y-card">
                        <h3 class="a11y-heading-3">
                            <i class="mdi mdi-history" aria-hidden="true"></i>
                            {{ $t("Transaction History") }}
                        </h3>

                        <ul class="transactions-list" role="list">
                            <li 
                                v-for="transaction in ecoTransactions" 
                                :key="transaction.id"
                                class="transaction-item"
                                :class="'transaction-' + transaction.type"
                            >
                                <div class="transaction-icon-container">
                                    <i :class="transaction.icon" class="transaction-icon" aria-hidden="true"></i>
                                </div>
                                <div class="transaction-details">
                                    <span class="transaction-name">{{ $t(transaction.description) }}</span>
                                    <span class="transaction-date">{{ formatRelativeDate(transaction.date) }}</span>
                                </div>
                                <div class="transaction-points" :class="transaction.type">
                                    <span v-if="transaction.type === 'earn'">+{{ formatNumber(transaction.points) }}</span>
                                    <span v-else>-{{ formatNumber(transaction.points) }}</span>
                                    <span class="points-unit">pts</span>
                                </div>
                            </li>
                        </ul>

                        <!-- Paginación simple -->
                        <div class="transactions-footer">
                            <button 
                                @click="loadMoreTransactions"
                                class="a11y-btn a11y-btn-secondary"
                                :disabled="!hasMoreTransactions"
                            >
                                <i class="mdi mdi-chevron-down" aria-hidden="true"></i>
                                {{ $t("Load more") }}
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

interface Level {
    key: string;
    name: string;
    minPoints: number;
    icon: string;
}

interface Milestone {
    id: string;
    name: string;
    achievedAt: string;
}

interface Requirement {
    id: string;
    name: string;
    icon: string;
    valid: boolean;
}

interface Bonus {
    id: string;
    name: string;
    description: string;
    icon: string;
    type: string;
    usedCount: number;
    totalLimit: number;
    renewalPeriod: string;
    nextRenewal: string;
    requirements: Requirement[];
}

interface EcoTransaction {
    id: string;
    description: string;
    icon: string;
    type: "earn" | "redeem";
    points: number;
    date: string;
}

export default defineComponent({
    components: {},
    name: "BeneficiosPage",
    data: function () {
        return {
            totalPoints: 2750,
            levels: [
                { key: "bronze", name: "Bronze Level", minPoints: 0, icon: "mdi mdi-medal" },
                { key: "silver", name: "Silver Level", minPoints: 1000, icon: "mdi mdi-medal" },
                { key: "gold", name: "Gold Level", minPoints: 3000, icon: "mdi mdi-medal" },
                { key: "platinum", name: "Platinum Level", minPoints: 5000, icon: "mdi mdi-diamond-stone" },
            ] as Level[],
            achievedMilestones: [
                { id: "m1", name: "First recycling action", achievedAt: "2025-11-15T10:30:00Z" },
                { id: "m2", name: "10 sustainable actions", achievedAt: "2025-11-20T14:00:00Z" },
                { id: "m3", name: "Reached Silver Level", achievedAt: "2025-11-25T09:15:00Z" },
            ] as Milestone[],
            activeBonuses: [
                {
                    id: "bonus-pmr-1",
                    name: "Reserved PMR Parking",
                    description: "Access to reserved parking spaces for people with reduced mobility in municipal areas.",
                    icon: "mdi mdi-parking",
                    type: "parking",
                    usedCount: 23,
                    totalLimit: 30,
                    renewalPeriod: "Monthly",
                    nextRenewal: "2025-12-01T00:00:00Z",
                    requirements: [
                        { id: "req1", name: "Disability Card", icon: "mdi mdi-card-account-details", valid: true },
                        { id: "req2", name: "Census Certificate", icon: "mdi mdi-file-document", valid: true },
                    ],
                },
                {
                    id: "bonus-transport-1",
                    name: "Public Transport Discount",
                    description: "50% discount on public transportation for senior citizens.",
                    icon: "mdi mdi-bus",
                    type: "transport",
                    usedCount: 8,
                    totalLimit: 40,
                    renewalPeriod: "Monthly",
                    nextRenewal: "2025-12-01T00:00:00Z",
                    requirements: [
                        { id: "req3", name: "Senior Citizen Card", icon: "mdi mdi-card-account-details", valid: true },
                    ],
                },
            ] as Bonus[],
            ecoPoints: {
                balance: 1250,
                level: "Eco Enthusiast",
                totalEarned: 2100,
                totalRedeemed: 850,
                actionsCount: 47,
            },
            ecoTransactions: [
                {
                    id: "tx1",
                    description: "Recycle at clean point",
                    icon: "mdi mdi-recycle",
                    type: "earn" as const,
                    points: 50,
                    date: new Date().toISOString(),
                },
                {
                    id: "tx2",
                    description: "Use recycling container",
                    icon: "mdi mdi-delete",
                    type: "earn" as const,
                    points: 10,
                    date: new Date(Date.now() - 86400000).toISOString(),
                },
                {
                    id: "tx3",
                    description: "Bike sharing usage",
                    icon: "mdi mdi-bicycle",
                    type: "earn" as const,
                    points: 25,
                    date: new Date(Date.now() - 86400000).toISOString(),
                },
                {
                    id: "tx4",
                    description: "Redeemed for store discount",
                    icon: "mdi mdi-store",
                    type: "redeem" as const,
                    points: 200,
                    date: new Date(Date.now() - 2 * 86400000).toISOString(),
                },
                {
                    id: "tx5",
                    description: "Glass recycling",
                    icon: "mdi mdi-bottle-wine",
                    type: "earn" as const,
                    points: 15,
                    date: new Date(Date.now() - 3 * 86400000).toISOString(),
                },
                {
                    id: "tx6",
                    description: "Organic waste deposit",
                    icon: "mdi mdi-leaf",
                    type: "earn" as const,
                    points: 20,
                    date: new Date(Date.now() - 4 * 86400000).toISOString(),
                },
            ] as EcoTransaction[],
            hasMoreTransactions: true,
            transactionsPage: 1,
        };
    },
    computed: {
        currentLevel(): Level {
            let current = this.levels[0];
            for (const level of this.levels) {
                if (this.totalPoints >= level.minPoints) {
                    current = level;
                }
            }
            return current;
        },
        nextLevel(): Level | null {
            const currentIndex = this.levels.findIndex(l => l.key === this.currentLevel.key);
            if (currentIndex < this.levels.length - 1) {
                return this.levels[currentIndex + 1];
            }
            return null;
        },
        pointsToNextLevel(): number {
            if (this.nextLevel) {
                return this.nextLevel.minPoints - this.totalPoints;
            }
            return 0;
        },
        progressPercentage(): number {
            // Calcular porcentaje global de 0 al nivel maximo (Platino = 5000)
            const maxPoints = this.levels[this.levels.length - 1].minPoints;
            return Math.min(100, Math.max(0, (this.totalPoints / maxPoints) * 100));
        },
        progressAriaLabel(): string {
            return `Progress: ${this.totalPoints} points. Current level: ${this.currentLevel.name}. ${this.nextLevel ? `Next level: ${this.nextLevel.name} at ${this.nextLevel.minPoints} points.` : 'Maximum level reached.'}`;
        },
    },
    methods: {
        formatNumber(num: number): string {
            return new Intl.NumberFormat("es-ES").format(num);
        },
        formatDate(dateString: string): string {
            return new Date(dateString).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        },
        formatRelativeDate(dateString: string): string {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                return this.$t("Today") as string;
            } else if (diffDays === 1) {
                return this.$t("Yesterday") as string;
            } else if (diffDays < 7) {
                return `${diffDays} ${this.$t("days ago")}`;
            } else {
                return this.formatDate(dateString);
            }
        },
        useBonus(bonus: Bonus) {
            // TODO: Implementar lógica para usar el bono
            console.log("Using bonus:", bonus.id);
            // Aquí se podría mostrar un modal de confirmación o QR
        },
        loadMoreTransactions() {
            // TODO: Cargar más transacciones desde el API
            this.transactionsPage++;
            console.log("Loading page:", this.transactionsPage);
            // Simular que no hay más transacciones después de la página 2
            if (this.transactionsPage >= 2) {
                this.hasMoreTransactions = false;
            }
        },
    },
    mounted: function () {
        // TODO: Cargar datos reales desde el API
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

.header-content h1 {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
}

/* Section Header Inner */
.section-header-inner {
    margin-bottom: var(--a11y-spacing-lg);
}

.section-header-inner h2 {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    margin: 0;
}

/* ========================================
   A. CITIZEN LEVEL (GAMIFICATION)
   ======================================== */
.citizen-level-section {
    padding: var(--a11y-spacing-lg);
}

.level-content {
    display: flex;
    flex-direction: column;
    gap: var(--a11y-spacing-lg);
}

/* Current Level Display */
.current-level {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--a11y-spacing-md);
    padding: var(--a11y-spacing-lg);
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: var(--a11y-border-radius);
}

.level-badge {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-md) var(--a11y-spacing-lg);
    border-radius: 9999px;
    font-weight: 700;
    font-size: var(--a11y-font-size-large);
}

.level-medal-icon {
    font-size: 2rem;
}

.level-bronze {
    background-color: #cd7f32;
    color: white;
}

.level-silver {
    background-color: #c0c0c0;
    color: #333;
}

.level-gold {
    background-color: #ffd700;
    color: #333;
}

.level-platinum {
    background: linear-gradient(135deg, #e5e4e2 0%, #a9a9a9 100%);
    color: #333;
}

.level-points {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.points-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--a11y-primary);
    line-height: 1;
}

.points-label {
    font-size: var(--a11y-font-size-base);
    color: var(--a11y-text-secondary);
}

/* Progress Section */
.progress-section {
    padding: var(--a11y-spacing-md) 0;
}

.progress-levels {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--a11y-spacing-sm);
    position: relative;
}

.progress-level-marker {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--a11y-spacing-xs);
    opacity: 0.5;
    transition: opacity 0.3s ease;
}

.progress-level-marker.achieved {
    opacity: 1;
}

.progress-level-marker.current .marker-icon {
    transform: scale(1.3);
    color: var(--a11y-primary);
}

.marker-icon {
    font-size: 1.5rem;
    transition: transform 0.3s ease;
}

.marker-label {
    font-size: var(--a11y-font-size-small);
    font-weight: 600;
}

.marker-points {
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
}

.progress-bar-container {
    height: 12px;
    background-color: #e0e0e0;
    border-radius: 6px;
    overflow: hidden;
}

.progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--a11y-primary) 0%, var(--a11y-success) 100%);
    border-radius: 6px;
    transition: width 0.5s ease;
}

/* Incentive Message */
.incentive-message {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-md);
    padding: var(--a11y-spacing-md) var(--a11y-spacing-lg);
    background-color: #fff8e1;
    border: 2px solid #ffc107;
    border-radius: var(--a11y-border-radius);
}

.incentive-icon {
    font-size: 1.5rem;
    color: #ffc107;
}

.gem-icon {
    font-size: 1.5rem;
    color: #9c27b0;
}

.incentive-text {
    flex: 1;
    margin: 0;
    font-size: var(--a11y-font-size-base);
}

/* Milestones */
.milestones h3 {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-md);
}

.milestones-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--a11y-spacing-sm);
}

.milestone-item {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-sm) var(--a11y-spacing-md);
    background-color: #f8f9fa;
    border-radius: var(--a11y-border-radius);
}

.milestone-check {
    color: var(--a11y-success);
    font-size: 1.25rem;
}

.milestone-date {
    margin-left: auto;
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
}

/* ========================================
   B. ACTIVE BONUSES
   ======================================== */
.bonuses-section h2 {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-lg);
}

.bonuses-grid {
    gap: var(--a11y-spacing-lg);
}

.bonus-card {
    display: flex;
    flex-direction: column;
}

.bonus-header {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-md);
}

.bonus-icon {
    font-size: 1.75rem;
    flex-shrink: 0;
    line-height: 1;
}

.bonus-title {
    flex: 1;
    font-size: var(--a11y-font-size-large);
    font-weight: 600;
    margin: 0;
}

.bonus-body {
    flex: 1;
}

.bonus-description {
    margin-bottom: var(--a11y-spacing-md);
}

/* Usage Control */
.usage-control {
    margin-bottom: var(--a11y-spacing-md);
    padding: var(--a11y-spacing-md);
    background-color: #f8f9fa;
    border-radius: var(--a11y-border-radius);
}

.usage-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--a11y-spacing-xs);
}

.usage-label {
    font-weight: 600;
}

.usage-value {
    font-weight: 500;
}

.usage-bar-container {
    height: 10px;
    background-color: #e0e0e0;
    border-radius: 5px;
    overflow: hidden;
    margin-bottom: var(--a11y-spacing-xs);
}

.usage-bar-fill {
    height: 100%;
    background-color: var(--a11y-primary, #004d99);
    border-radius: 5px;
    transition: width 0.3s ease;
}

.usage-bar-fill.usage-warning {
    background-color: var(--a11y-primary, #004d99);
}

.usage-bar-fill.usage-danger {
    background-color: var(--a11y-primary, #004d99);
}

.usage-remaining {
    margin: 0;
    font-size: var(--a11y-font-size-small);
}

/* Renewal Info */
.renewal-info {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    flex-wrap: wrap;
    margin-bottom: var(--a11y-spacing-md);
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
}

.next-renewal {
    margin-left: auto;
}

/* Requirements Validation */
.requirements-validation {
    display: flex;
    flex-direction: column;
    gap: var(--a11y-spacing-xs);
    margin-bottom: var(--a11y-spacing-md);
}

.requirement-item {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-xs) var(--a11y-spacing-sm);
    background-color: #ffebee;
    border-radius: var(--a11y-border-radius);
    font-size: var(--a11y-font-size-small);
}

.requirement-item.requirement-valid {
    background-color: #e8f5e9;
}

.requirement-icon {
    font-size: 1.25rem;
}

.requirement-valid .requirement-icon {
    color: var(--a11y-success);
}

.requirement-doc-icon {
    font-size: 1rem;
    color: var(--a11y-text-secondary);
}

.requirement-name {
    flex: 1;
}

.requirement-status {
    font-weight: 600;
    color: var(--a11y-success);
}

.requirement-status.requirement-missing {
    color: var(--a11y-error);
}

/* Bonus Footer */
.bonus-footer {
    padding-top: var(--a11y-spacing-md);
    margin-top: auto;
    border-top: 1px solid #e0e0e0;
}

.bonus-footer button {
    width: 100%;
}

/* ========================================
   C. ECOPOINTS
   ======================================== */
.ecopoints-section h2 {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-lg);
}

.ecopoints-content {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: var(--a11y-spacing-lg);
}

/* EcoPoints Summary */
.ecopoints-summary {
    padding: var(--a11y-spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--a11y-spacing-lg);
}

.ecopoints-balance {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-md);
}

.balance-icon {
    font-size: 3rem;
    color: var(--a11y-success);
}

.balance-info {
    display: flex;
    flex-direction: column;
}

.balance-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--a11y-success);
    line-height: 1;
}

.balance-label {
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
}

.ecopoints-level {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-sm) var(--a11y-spacing-md);
    background-color: #e8f5e9;
    border-radius: var(--a11y-border-radius);
}

.eco-level-name {
    font-weight: 600;
    color: var(--a11y-success);
}

.ecopoints-stats {
    display: flex;
    justify-content: space-between;
    gap: var(--a11y-spacing-sm);
}

.eco-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.eco-stat-value {
    font-size: var(--a11y-font-size-large);
    font-weight: 700;
    color: var(--a11y-primary);
}

.eco-stat-label {
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
}

/* Transactions History */
.transactions-history {
    padding: var(--a11y-spacing-lg);
}

.transactions-history h3 {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    margin: 0;
    margin-bottom: var(--a11y-spacing-md);
}

.transactions-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--a11y-spacing-sm);
}

.transaction-item {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-md);
    padding: var(--a11y-spacing-sm) var(--a11y-spacing-md);
    background-color: #f8f9fa;
    border-radius: var(--a11y-border-radius);
    border-left: 4px solid #e0e0e0;
}

.transaction-item.transaction-earn {
    border-left-color: var(--a11y-success);
}

.transaction-item.transaction-redeem {
    border-left-color: #ff9800;
}

.transaction-icon-container {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    border-radius: 50%;
    flex-shrink: 0;
}

.transaction-icon {
    font-size: 1.25rem;
}

.transaction-earn .transaction-icon {
    color: var(--a11y-success);
}

.transaction-redeem .transaction-icon {
    color: #ff9800;
}

.transaction-details {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.transaction-name {
    font-weight: 500;
}

.transaction-date {
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
}

.transaction-points {
    display: flex;
    align-items: baseline;
    gap: var(--a11y-spacing-xs);
    font-weight: 700;
    font-size: var(--a11y-font-size-large);
}

.transaction-points.earn {
    color: var(--a11y-success);
}

.transaction-points.redeem {
    color: #ff9800;
}

.points-unit {
    font-size: var(--a11y-font-size-small);
    font-weight: 400;
    color: var(--a11y-text-secondary);
}

.transactions-footer {
    margin-top: var(--a11y-spacing-md);
    text-align: center;
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

.empty-desc {
    margin: 0;
}

/* Responsive */
@media (max-width: 1024px) {
    .ecopoints-content {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .miciudad-beneficios {
        padding: var(--a11y-spacing-md);
    }
    
    .page-header {
        flex-direction: column;
    }
    
    .current-level {
        flex-direction: column;
        text-align: center;
    }
    
    .level-points {
        align-items: center;
    }
    
    .progress-levels {
        flex-wrap: wrap;
        justify-content: center;
        gap: var(--a11y-spacing-md);
    }
    
    .incentive-message {
        flex-direction: column;
        text-align: center;
    }
    
    .bonuses-grid {
        grid-template-columns: 1fr;
    }
    
    .ecopoints-stats {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .eco-stat {
        flex-direction: row;
        gap: var(--a11y-spacing-sm);
    }
    
    .renewal-info {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .next-renewal {
        margin-left: 0;
    }
}
</style>
