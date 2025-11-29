<template>
    <div class="page-content miciudad-personas" tabindex="-1">
        <!-- Skip link para accesibilidad -->
        <a href="#main-content" class="a11y-skip-link">
            {{ $t("Skip to main content") }}
        </a>

        <!-- Encabezado -->
        <header class="page-header">
            <div class="header-content">
                <h1 class="a11y-heading-1">
                    <i class="mdi mdi-account-group" aria-hidden="true"></i>
                    {{ $t("Citizens") }}
                </h1>
                <p class="a11y-text-secondary">
                    {{ $t("Citizen management and their digital identities") }}
                </p>
            </div>
            <div class="header-actions">
                <button 
                    @click="exportData"
                    class="a11y-btn a11y-btn-secondary"
                    :aria-label="$t('Export data')"
                >
                    <i class="mdi mdi-download" aria-hidden="true"></i>
                    {{ $t("Export") }}
                </button>
                <button 
                    v-if="isAdmin"
                    @click="showNewCitizenModal = true"
                    class="a11y-btn a11y-btn-primary a11y-btn-large"
                    :aria-label="$t('Register new citizen')"
                >
                    <i class="mdi mdi-account-plus" aria-hidden="true"></i>
                    {{ $t("Register citizen") }}
                </button>
            </div>
        </header>

        <main id="main-content">
            <!-- Estadísticas rápidas -->
            <section aria-labelledby="quick-stats-heading" class="quick-stats">
                <h2 id="quick-stats-heading" class="a11y-visually-hidden">
                    {{ $t("Quick statistics") }}
                </h2>
                <div class="stats-row">
                    <div class="quick-stat">
                        <span class="stat-value">{{ formatNumber(stats.total) }}</span>
                        <span class="stat-label">{{ $t("Total") }}</span>
                    </div>
                    <div class="quick-stat">
                        <span class="stat-value stat-success">{{ formatNumber(stats.withCredentials) }}</span>
                        <span class="stat-label">{{ $t("With credentials") }}</span>
                    </div>
                    <div class="quick-stat">
                        <span class="stat-value stat-warning">{{ formatNumber(stats.pending) }}</span>
                        <span class="stat-label">{{ $t("Pending") }}</span>
                    </div>
                    <div class="quick-stat">
                        <span class="stat-value stat-info">{{ formatNumber(stats.activeToday) }}</span>
                        <span class="stat-label">{{ $t("Active today") }}</span>
                    </div>
                </div>
            </section>

            <!-- Filtros y búsqueda -->
            <section class="filters-section a11y-card" aria-labelledby="filters-heading">
                <h2 id="filters-heading" class="a11y-visually-hidden">{{ $t("Filters") }}</h2>
                
                <div class="filters-grid">
                    <div class="a11y-form-group search-group">
                        <label for="filter-search" class="a11y-label">
                            {{ $t("Search citizen") }}
                        </label>
                        <input 
                            id="filter-search"
                            type="search"
                            v-model="filters.search"
                            class="a11y-input"
                            :placeholder="$t('Name, ID, or DID...')"
                            @input="debounceSearch"
                        />
                    </div>
                    
                    <div class="a11y-form-group">
                        <label for="filter-status" class="a11y-label">
                            {{ $t("Status") }}
                        </label>
                        <select 
                            id="filter-status" 
                            v-model="filters.status"
                            class="a11y-select"
                        >
                            <option value="">{{ $t("All") }}</option>
                            <option value="active">{{ $t("Active") }}</option>
                            <option value="pending">{{ $t("Pending validation") }}</option>
                            <option value="suspended">{{ $t("Suspended") }}</option>
                        </select>
                    </div>
                    
                    <div class="a11y-form-group">
                        <label for="filter-credential" class="a11y-label">
                            {{ $t("Has credential") }}
                        </label>
                        <select 
                            id="filter-credential" 
                            v-model="filters.credential"
                            class="a11y-select"
                        >
                            <option value="">{{ $t("All") }}</option>
                            <option value="disability">{{ $t("Disability") }}</option>
                            <option value="census">{{ $t("Census") }}</option>
                            <option value="none">{{ $t("No credentials") }}</option>
                        </select>
                    </div>
                </div>
            </section>

            <!-- Tabla de ciudadanos -->
            <section aria-labelledby="citizens-table-heading" class="a11y-mt-lg">
                <h2 id="citizens-table-heading" class="a11y-heading-2">
                    {{ $t("Registered citizens") }} 
                    <span class="results-count">({{ filteredCitizens.length }})</span>
                </h2>

                <div class="a11y-table-responsive">
                    <table class="a11y-table citizens-table" role="table">
                        <thead>
                            <tr>
                                <th scope="col">{{ $t("Citizen") }}</th>
                                <th scope="col">{{ $t("DID") }}</th>
                                <th scope="col">{{ $t("Credentials") }}</th>
                                <th scope="col">{{ $t("Tokens") }}</th>
                                <th scope="col">{{ $t("Status") }}</th>
                                <th scope="col">{{ $t("Actions") }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr 
                                v-for="citizen in paginatedCitizens" 
                                :key="citizen.id"
                            >
                                <td>
                                    <div class="citizen-info">
                                        <span class="citizen-avatar" aria-hidden="true">
                                            {{ getInitials(citizen.name) }}
                                        </span>
                                        <div class="citizen-details">
                                            <span class="citizen-name">{{ citizen.name }}</span>
                                            <span class="citizen-id a11y-text-secondary">
                                                {{ maskId(citizen.nationalId) }}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <code class="did-code" :title="citizen.did">
                                        {{ truncateDid(citizen.did) }}
                                    </code>
                                    <button 
                                        @click="copyDid(citizen.did)"
                                        class="copy-btn"
                                        :aria-label="$t('Copy DID')"
                                    >
                                        <i class="mdi mdi-content-copy"></i>
                                    </button>
                                </td>
                                <td>
                                    <div class="credentials-badges">
                                        <span 
                                            v-for="cred in citizen.credentials" 
                                            :key="cred.type"
                                            class="credential-badge"
                                            :class="getCredentialClass(cred.status)"
                                            :title="$t(cred.type)"
                                        >
                                            <i :class="'mdi ' + getCredentialIcon(cred.type)" class="credential-icon"></i>
                                        </span>
                                        <span 
                                            v-if="citizen.credentials.length === 0"
                                            class="no-credentials"
                                        >
                                            {{ $t("None") }}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div class="tokens-info">
                                        <div v-if="citizen.tokens.parking > 0" class="token-item">
                                            <i class="mdi mdi-car" aria-hidden="true"></i>
                                            {{ citizen.tokens.parking }}/30
                                        </div>
                                        <div v-if="citizen.tokens.eco > 0" class="token-item">
                                            <i class="mdi mdi-recycle" aria-hidden="true"></i>
                                            {{ formatNumber(citizen.tokens.eco) }}
                                        </div>
                                        <span 
                                            v-if="citizen.tokens.parking === 0 && citizen.tokens.eco === 0"
                                            class="no-tokens"
                                        >
                                            -
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <span 
                                        class="a11y-badge"
                                        :class="getStatusBadgeClass(citizen.status)"
                                    >
                                        {{ $t(citizen.status) }}
                                    </span>
                                </td>
                                <td>
                                    <div class="actions-cell">
                                        <button 
                                            @click="viewCitizen(citizen)"
                                            class="a11y-btn a11y-btn-secondary a11y-btn-icon"
                                            :aria-label="$t('View details of') + ' ' + citizen.name"
                                        >
                                            <i class="mdi mdi-eye"></i>
                                        </button>
                                        <button 
                                            v-if="canIssueCredential(citizen)"
                                            @click="issueCredential(citizen)"
                                            class="a11y-btn a11y-btn-primary a11y-btn-icon"
                                            :aria-label="$t('Issue credential to') + ' ' + citizen.name"
                                        >
                                            <i class="mdi mdi-certificate"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Estado vacío -->
                <div 
                    v-if="filteredCitizens.length === 0" 
                    class="empty-state a11y-card"
                    role="status"
                >
                    <i class="mdi mdi-magnify empty-icon" aria-hidden="true"></i>
                    <p class="empty-title">{{ $t("No citizens found") }}</p>
                    <p class="empty-desc a11y-text-secondary">
                        {{ $t("Try adjusting your search or filters") }}
                    </p>
                </div>

                <!-- Paginación -->
                <nav 
                    v-if="totalPages > 1"
                    class="pagination" 
                    aria-label="Table pagination"
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
        </main>

        <!-- Modal detalles ciudadano -->
        <div 
            v-if="selectedCitizen" 
            class="modal-overlay"
            @click.self="selectedCitizen = null"
            role="dialog"
            aria-modal="true"
            aria-labelledby="citizen-detail-title"
        >
            <div class="modal-content a11y-card modal-large">
                <header class="modal-header">
                    <h2 id="citizen-detail-title" class="a11y-heading-2">
                        {{ $t("Citizen details") }}
                    </h2>
                    <button 
                        @click="selectedCitizen = null"
                        class="a11y-btn a11y-btn-icon"
                        :aria-label="$t('Close')"
                    >
                        ✕
                    </button>
                </header>
                
                <div class="modal-body citizen-detail">
                    <!-- Info básica -->
                    <section class="detail-section">
                        <h3 class="a11y-heading-3">{{ $t("Basic information") }}</h3>
                        <dl class="detail-list">
                            <div class="detail-item">
                                <dt>{{ $t("Full name") }}</dt>
                                <dd>{{ selectedCitizen.name }}</dd>
                            </div>
                            <div class="detail-item">
                                <dt>{{ $t("National ID") }}</dt>
                                <dd>{{ maskId(selectedCitizen.nationalId) }}</dd>
                            </div>
                            <div class="detail-item">
                                <dt>{{ $t("DID") }}</dt>
                                <dd>
                                    <code class="did-full">{{ selectedCitizen.did }}</code>
                                </dd>
                            </div>
                            <div class="detail-item">
                                <dt>{{ $t("Registration date") }}</dt>
                                <dd>{{ formatDate(selectedCitizen.registeredAt) }}</dd>
                            </div>
                        </dl>
                    </section>

                    <!-- Credenciales -->
                    <section class="detail-section">
                        <h3 class="a11y-heading-3">{{ $t("Verifiable credentials") }}</h3>
                        <div v-if="selectedCitizen.credentials.length > 0">
                            <article 
                                v-for="cred in selectedCitizen.credentials"
                                :key="cred.id"
                                class="credential-card a11y-card"
                            >
                                <div class="cred-header">
                                    <i :class="'mdi ' + getCredentialIcon(cred.type) + ' cred-icon'" aria-hidden="true"></i>
                                    <div class="cred-info">
                                        <h4 class="cred-type">{{ $t(cred.type) }}</h4>
                                        <span 
                                            class="a11y-badge"
                                            :class="getCredentialClass(cred.status)"
                                        >
                                            {{ $t(cred.status) }}
                                        </span>
                                    </div>
                                </div>
                                <div class="cred-details">
                                    <p><strong>{{ $t("Issuer") }}:</strong> {{ cred.issuer }}</p>
                                    <p><strong>{{ $t("Issued") }}:</strong> {{ formatDate(cred.issuedAt) }}</p>
                                    <p><strong>{{ $t("Expires") }}:</strong> {{ formatDate(cred.expiresAt) }}</p>
                                    <p v-if="cred.txId">
                                        <strong>{{ $t("Blockchain anchor") }}:</strong>
                                        <a 
                                            :href="getBlockchainUrl(cred.txId)"
                                            target="_blank"
                                            rel="noopener"
                                        >
                                            {{ truncateTx(cred.txId) }} <i class="mdi mdi-link-variant"></i>
                                        </a>
                                    </p>
                                </div>
                                <div class="cred-actions" v-if="cred.status === 'active'">
                                    <button 
                                        @click="revokeCredential(cred)"
                                        class="a11y-btn a11y-btn-danger"
                                    >
                                        {{ $t("Revoke") }}
                                    </button>
                                </div>
                            </article>
                        </div>
                        <p v-else class="a11y-text-secondary">
                            {{ $t("This citizen has no credentials yet") }}
                        </p>
                    </section>

                    <!-- Tokens -->
                    <section class="detail-section">
                        <h3 class="a11y-heading-3">{{ $t("Token balances") }}</h3>
                        <div class="tokens-grid">
                            <div class="token-card">
                                <i class="mdi mdi-car token-icon" aria-hidden="true"></i>
                                <div class="token-info">
                                    <span class="token-name">Parking PMR</span>
                                    <span class="token-balance">
                                        {{ selectedCitizen.tokens.parking }} / 30 {{ $t("uses") }}
                                    </span>
                                </div>
                                <div class="token-progress">
                                    <div class="a11y-progress">
                                        <div 
                                            class="a11y-progress-bar"
                                            :style="{ width: (selectedCitizen.tokens.parking / 30 * 100) + '%' }"
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            <div class="token-card">
                                <i class="mdi mdi-recycle token-icon" aria-hidden="true"></i>
                                <div class="token-info">
                                    <span class="token-name">EcoPuntos</span>
                                    <span class="token-balance">
                                        {{ formatNumber(selectedCitizen.tokens.eco) }} {{ $t("points") }}
                                    </span>
                                </div>
                                <div class="token-level">
                                    <span 
                                        class="a11y-badge"
                                        :class="getEcoLevelClass(selectedCitizen.tokens.eco)"
                                    >
                                        {{ getEcoLevel(selectedCitizen.tokens.eco) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <footer class="modal-footer">
                    <button 
                        @click="selectedCitizen = null"
                        class="a11y-btn a11y-btn-secondary"
                    >
                        {{ $t("Close") }}
                    </button>
                    <button 
                        @click="issueCredential(selectedCitizen)"
                        class="a11y-btn a11y-btn-primary"
                    >
                        {{ $t("Issue credential") }}
                    </button>
                </footer>
            </div>
        </div>

        <!-- Modal nuevo ciudadano -->
        <div 
            v-if="showNewCitizenModal" 
            class="modal-overlay"
            @click.self="showNewCitizenModal = false"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-citizen-title"
        >
            <div class="modal-content a11y-card">
                <header class="modal-header">
                    <h2 id="new-citizen-title" class="a11y-heading-2">
                        {{ $t("Register new citizen") }}
                    </h2>
                    <button 
                        @click="showNewCitizenModal = false"
                        class="a11y-btn a11y-btn-icon"
                        :aria-label="$t('Close')"
                    >
                        ✕
                    </button>
                </header>
                
                <form @submit.prevent="createCitizen" class="modal-body">
                    <div class="a11y-form-group">
                        <label for="citizen-name" class="a11y-label a11y-label-required">
                            {{ $t("Full name") }}
                        </label>
                        <input 
                            id="citizen-name"
                            type="text"
                            v-model="newCitizen.name"
                            class="a11y-input"
                            required
                        />
                    </div>

                    <div class="a11y-form-group">
                        <label for="citizen-national-id" class="a11y-label a11y-label-required">
                            {{ $t("National ID (DNI/NIE)") }}
                        </label>
                        <input 
                            id="citizen-national-id"
                            type="text"
                            v-model="newCitizen.nationalId"
                            class="a11y-input"
                            required
                            pattern="[0-9]{8}[A-Za-z]|[XYZ][0-9]{7}[A-Za-z]"
                        />
                        <p class="a11y-help-text">
                            {{ $t("Enter DNI (8 digits + letter) or NIE (X/Y/Z + 7 digits + letter)") }}
                        </p>
                    </div>

                    <div class="a11y-form-group">
                        <label for="citizen-email" class="a11y-label a11y-label-required">
                            {{ $t("Email") }}
                        </label>
                        <input 
                            id="citizen-email"
                            type="email"
                            v-model="newCitizen.email"
                            class="a11y-input"
                            required
                        />
                    </div>

                    <div class="a11y-alert a11y-alert-info">
                        <i class="mdi mdi-information a11y-alert-icon" aria-hidden="true"></i>
                        <div class="a11y-alert-content">
                            <p>{{ $t("A unique DID (Decentralized Identifier) will be automatically generated for this citizen using BSV blockchain.") }}</p>
                        </div>
                    </div>

                    <footer class="modal-footer">
                        <button 
                            type="button"
                            @click="showNewCitizenModal = false"
                            class="a11y-btn a11y-btn-secondary"
                        >
                            {{ $t("Cancel") }}
                        </button>
                        <button 
                            type="submit"
                            class="a11y-btn a11y-btn-primary"
                        >
                            {{ $t("Register") }}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { AuthController } from "@/control/auth";

interface Credential {
    id: string;
    type: string;
    status: "active" | "pending" | "revoked" | "expired";
    issuer: string;
    issuedAt: string;
    expiresAt: string;
    txId?: string;
}

interface Citizen {
    id: string;
    name: string;
    nationalId: string;
    did: string;
    email: string;
    status: "active" | "pending" | "suspended";
    credentials: Credential[];
    tokens: {
        parking: number;
        eco: number;
    };
    registeredAt: string;
}

export default defineComponent({
    components: {},
    name: "PersonasPage",
    data: function () {
        return {
            filters: {
                search: "",
                status: "",
                credential: "",
            },
            currentPage: 1,
            pageSize: 10,
            searchTimeout: null as ReturnType<typeof setTimeout> | null,
            selectedCitizen: null as Citizen | null,
            showNewCitizenModal: false,
            newCitizen: {
                name: "",
                nationalId: "",
                email: "",
            },
            stats: {
                total: 12547,
                withCredentials: 9834,
                pending: 423,
                activeToday: 1234,
            },
            citizens: [
                {
                    id: "cit-001",
                    name: "María González Pérez",
                    nationalId: "12345678A",
                    did: "did:bsv:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
                    email: "maria.gonzalez@email.com",
                    status: "active" as const,
                    credentials: [
                        {
                            id: "cred-001",
                            type: "Disability Credential",
                            status: "active" as const,
                            issuer: "Ayuntamiento MiCiudad",
                            issuedAt: "2024-01-15T10:30:00Z",
                            expiresAt: "2029-01-15T10:30:00Z",
                            txId: "abc123def456789",
                        },
                        {
                            id: "cred-002",
                            type: "Census Credential",
                            status: "active" as const,
                            issuer: "Ayuntamiento MiCiudad",
                            issuedAt: "2024-02-20T14:00:00Z",
                            expiresAt: "2025-02-20T14:00:00Z",
                            txId: "xyz789ghi012345",
                        },
                    ],
                    tokens: {
                        parking: 22,
                        eco: 1540,
                    },
                    registeredAt: "2024-01-10T08:00:00Z",
                },
                {
                    id: "cit-002",
                    name: "Juan Carlos López Martín",
                    nationalId: "87654321B",
                    did: "did:bsv:3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
                    email: "jc.lopez@email.com",
                    status: "active" as const,
                    credentials: [
                        {
                            id: "cred-003",
                            type: "Census Credential",
                            status: "active" as const,
                            issuer: "Ayuntamiento MiCiudad",
                            issuedAt: "2024-03-01T09:00:00Z",
                            expiresAt: "2025-03-01T09:00:00Z",
                            txId: "pqr456stu789012",
                        },
                    ],
                    tokens: {
                        parking: 0,
                        eco: 3280,
                    },
                    registeredAt: "2024-02-28T11:30:00Z",
                },
                {
                    id: "cit-003",
                    name: "Ana Belén Sánchez Ruiz",
                    nationalId: "11223344C",
                    did: "did:bsv:1BoatSLRHtKNngkdXEeobR76b53LETtpyT",
                    email: "ana.sanchez@email.com",
                    status: "pending" as const,
                    credentials: [],
                    tokens: {
                        parking: 0,
                        eco: 0,
                    },
                    registeredAt: "2024-06-15T16:45:00Z",
                },
                {
                    id: "cit-004",
                    name: "Pedro Ramírez Torres",
                    nationalId: "55667788D",
                    did: "did:bsv:1AKDDsfTh8uY4X3ppy1m7jw8fFNNzzKWi6",
                    email: "p.ramirez@email.com",
                    status: "active" as const,
                    credentials: [
                        {
                            id: "cred-004",
                            type: "Disability Credential",
                            status: "active" as const,
                            issuer: "Ayuntamiento MiCiudad",
                            issuedAt: "2023-11-20T10:00:00Z",
                            expiresAt: "2028-11-20T10:00:00Z",
                            txId: "mno123pqr456789",
                        },
                    ],
                    tokens: {
                        parking: 8,
                        eco: 450,
                    },
                    registeredAt: "2023-11-15T14:20:00Z",
                },
            ] as Citizen[],
        };
    },
    computed: {
        isAdmin(): boolean {
            return AuthController.Role === "admin" || AuthController.Role === "root";
        },
        filteredCitizens(): Citizen[] {
            return this.citizens.filter((citizen) => {
                // Filtro por búsqueda
                if (this.filters.search) {
                    const search = this.filters.search.toLowerCase();
                    const matchesSearch =
                        citizen.name.toLowerCase().includes(search) ||
                        citizen.nationalId.toLowerCase().includes(search) ||
                        citizen.did.toLowerCase().includes(search);
                    if (!matchesSearch) return false;
                }
                
                // Filtro por estado
                if (this.filters.status && citizen.status !== this.filters.status) {
                    return false;
                }
                
                // Filtro por credencial
                if (this.filters.credential) {
                    if (this.filters.credential === "none") {
                        if (citizen.credentials.length > 0) return false;
                    } else {
                        const hasCredential = citizen.credentials.some(
                            (c) => c.type.toLowerCase().includes(this.filters.credential)
                        );
                        if (!hasCredential) return false;
                    }
                }
                
                return true;
            });
        },
        totalPages(): number {
            return Math.ceil(this.filteredCitizens.length / this.pageSize);
        },
        paginatedCitizens(): Citizen[] {
            const start = (this.currentPage - 1) * this.pageSize;
            return this.filteredCitizens.slice(start, start + this.pageSize);
        },
    },
    methods: {
        formatNumber(num: number): string {
            return new Intl.NumberFormat("es-ES").format(num);
        },
        formatDate(dateStr: string): string {
            return new Date(dateStr).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
            });
        },
        getInitials(name: string): string {
            return name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();
        },
        maskId(id: string): string {
            if (id.length < 4) return id;
            return "****" + id.slice(-4);
        },
        truncateDid(did: string): string {
            if (did.length <= 25) return did;
            return did.substring(0, 15) + "..." + did.slice(-8);
        },
        truncateTx(tx: string): string {
            if (tx.length <= 16) return tx;
            return tx.substring(0, 8) + "..." + tx.slice(-6);
        },
        getCredentialIcon(type: string): string {
            const icons: Record<string, string> = {
                "Disability Credential": "mdi-wheelchair-accessibility",
                "Census Credential": "mdi-clipboard-account",
            };
            return icons[type] || "mdi-certificate";
        },
        getCredentialClass(status: string): string {
            const classes: Record<string, string> = {
                active: "cred-active",
                pending: "cred-pending",
                revoked: "cred-revoked",
                expired: "cred-expired",
            };
            return classes[status] || "";
        },
        getStatusBadgeClass(status: string): string {
            const classes: Record<string, string> = {
                active: "a11y-badge-success",
                pending: "a11y-badge-warning",
                suspended: "a11y-badge-error",
            };
            return classes[status] || "a11y-badge-info";
        },
        getEcoLevel(points: number): string {
            if (points >= 5000) return "Platinum";
            if (points >= 2000) return "Gold";
            if (points >= 500) return "Silver";
            return "Bronze";
        },
        getEcoLevelClass(points: number): string {
            if (points >= 5000) return "a11y-badge-info";
            if (points >= 2000) return "a11y-badge-warning";
            if (points >= 500) return "a11y-badge-success";
            return "a11y-badge-info";
        },
        getBlockchainUrl(txId: string): string {
            return `/block-explorer/transaction/${txId}`;
        },
        debounceSearch() {
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
            }, 300);
        },
        copyDid(did: string) {
            navigator.clipboard.writeText(did);
            // TODO: Mostrar notificación de copiado
        },
        viewCitizen(citizen: Citizen) {
            this.selectedCitizen = citizen;
        },
        canIssueCredential(citizen: Citizen): boolean {
            return citizen.status === "active" && this.isAdmin;
        },
        issueCredential(citizen: Citizen) {
            // TODO: Navegar a la página de emisión de credenciales
            console.log("Issue credential to:", citizen.id);
            this.$router.push(`/permissions?tab=emit&citizen=${citizen.id}`);
        },
        revokeCredential(credential: Credential) {
            // TODO: Mostrar modal de confirmación y revocar
            console.log("Revoke credential:", credential.id);
        },
        exportData() {
            // TODO: Exportar datos en CSV
            console.log("Export data");
        },
        createCitizen() {
            // TODO: Enviar al API para crear ciudadano
            console.log("Create citizen:", this.newCitizen);
            this.showNewCitizenModal = false;
            this.newCitizen = {
                name: "",
                nationalId: "",
                email: "",
            };
        },
    },
    watch: {
        "filters.status"() {
            this.currentPage = 1;
        },
        "filters.credential"() {
            this.currentPage = 1;
        },
    },
    mounted: function () {
        // TODO: Cargar ciudadanos desde el API
    },
    beforeUnmount: function () {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    },
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

.header-actions {
    display: flex;
    gap: var(--a11y-spacing-sm);
}

/* Quick Stats */
.quick-stats {
    margin-bottom: var(--a11y-spacing-lg);
}

.stats-row {
    display: flex;
    gap: var(--a11y-spacing-lg);
    flex-wrap: wrap;
}

.quick-stat {
    display: flex;
    flex-direction: column;
    padding: var(--a11y-spacing-md);
    background-color: #f8f9fa;
    border-radius: var(--a11y-border-radius);
    min-width: 120px;
}

.quick-stat .stat-value {
    font-size: var(--a11y-font-size-xlarge);
    font-weight: 700;
    color: var(--a11y-primary);
}

.quick-stat .stat-value.stat-success { color: var(--a11y-success); }
.quick-stat .stat-value.stat-warning { color: var(--a11y-warning); }
.quick-stat .stat-value.stat-info { color: var(--a11y-info); }

.quick-stat .stat-label {
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
}

/* Filters */
.filters-section {
    padding: var(--a11y-spacing-lg);
}

.filters-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: var(--a11y-spacing-md);
}

/* Results count */
.results-count {
    font-weight: 400;
    color: var(--a11y-text-secondary);
}

/* Table */
.citizens-table {
    font-size: var(--a11y-font-size-base);
}

.citizen-info {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
}

.citizen-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background-color: var(--a11y-primary);
    color: white;
    border-radius: 50%;
    font-weight: 600;
    font-size: var(--a11y-font-size-small);
}

.citizen-details {
    display: flex;
    flex-direction: column;
}

.citizen-name {
    font-weight: 600;
}

.citizen-id {
    font-size: var(--a11y-font-size-small);
}

/* DID Code */
.did-code {
    font-family: monospace;
    font-size: var(--a11y-font-size-small);
    background-color: #f0f0f0;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
}

.copy-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    margin-left: 0.25rem;
}

/* Credentials Badges */
.credentials-badges {
    display: flex;
    gap: var(--a11y-spacing-xs);
    width: 5rem;
}

.credential-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 1rem;
}

.credential-badge.cred-active {
    background-color: var(--a11y-success-bg);
}

.credential-badge.cred-pending {
    background-color: var(--a11y-warning-bg);
}

.credential-badge.cred-revoked,
.credential-badge.cred-expired {
    background-color: var(--a11y-error-bg);
    opacity: 0.6;
}

.no-credentials,
.no-tokens {
    color: var(--a11y-text-secondary);
}

/* Tokens Info */
.tokens-info {
    display: flex;
    flex-direction: column;
    gap: var(--a11y-spacing-xs);
}

.token-item {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
    font-size: var(--a11y-font-size-small);
}

/* Actions */
.actions-cell {
    display: flex;
    gap: var(--a11y-spacing-xs);
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

/* Modal */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--a11y-spacing-md);
    z-index: 1000;
}

.modal-content {
    width: 100%;
    max-width: 600px;
    max-height: calc(100% - var(--top-bar-size));
    margin-top: var(--top-bar-size);
    overflow-y: auto;
}

.modal-large {
    max-width: 800px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--a11y-spacing-lg);
}

.modal-header h2 {
    margin: 0;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--a11y-spacing-sm);
    padding-top: var(--a11y-spacing-md);
    border-top: 1px solid #e0e0e0;
}

/* Citizen Detail Modal */
.detail-section {
    margin-bottom: var(--a11y-spacing-lg);
}

.detail-list {
    display: grid;
    gap: var(--a11y-spacing-sm);
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: var(--a11y-spacing-xs);
}

.detail-item dt {
    font-weight: 600;
    color: var(--a11y-text-secondary);
    font-size: var(--a11y-font-size-small);
}

.detail-item dd {
    margin: 0;
}

.did-full {
    font-family: monospace;
    font-size: var(--a11y-font-size-small);
    word-break: break-all;
    background-color: #f0f0f0;
    padding: 0.5rem;
    border-radius: 4px;
    display: block;
}

/* Credential Card */
.credential-card {
    margin-bottom: var(--a11y-spacing-md);
}

.cred-header {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-sm);
}

.cred-icon {
    font-size: 2rem;
}

.cred-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
}

.cred-type {
    font-size: var(--a11y-font-size-base);
    font-weight: 600;
    margin: 0;
}

.cred-details p {
    margin: var(--a11y-spacing-xs) 0;
    font-size: var(--a11y-font-size-small);
}

.cred-actions {
    margin-top: var(--a11y-spacing-sm);
    padding-top: var(--a11y-spacing-sm);
    border-top: 1px solid #e0e0e0;
}

/* Tokens Grid */
.tokens-grid {
    display: grid;
    gap: var(--a11y-spacing-md);
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.token-card {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-md);
    background-color: #f8f9fa;
    border-radius: var(--a11y-border-radius);
}

.token-icon {
    font-size: 2rem;
}

.token-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.token-name {
    font-weight: 600;
}

.token-balance {
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
}

.token-progress {
    width: 100px;
}

/* Responsive */
@media (max-width: 1024px) {
    .filters-grid {
        grid-template-columns: 1fr 1fr;
    }
    
    .search-group {
        grid-column: span 2;
    }
}

@media (max-width: 768px) {
    .miciudad-personas {
        padding: var(--a11y-spacing-md);
    }
    
    .page-header {
        flex-direction: column;
    }
    
    .header-actions {
        width: 100%;
        flex-direction: column;
    }
    
    .filters-grid {
        grid-template-columns: 1fr;
    }
    
    .search-group {
        grid-column: auto;
    }
    
    .stats-row {
        flex-direction: column;
    }
    
    .quick-stat {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }
    
    /* Hide some columns on mobile */
    .citizens-table th:nth-child(2),
    .citizens-table td:nth-child(2),
    .citizens-table th:nth-child(4),
    .citizens-table td:nth-child(4) {
        display: none;
    }
}

.credential-icon {
    font-size: 25px;
}
</style>

