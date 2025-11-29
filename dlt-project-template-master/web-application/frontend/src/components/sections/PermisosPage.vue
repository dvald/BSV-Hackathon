<template>
    <div class="page-content miciudad-gestion" tabindex="-1">
        <!-- Skip link para accesibilidad -->
        <a href="#main-content" class="a11y-skip-link">
            {{ $t("Skip to main content") }}
        </a>

        <!-- Encabezado -->
        <header class="page-header">
            <div class="header-content">
                <h1 class="a11y-heading-1">
                    <i class="mdi mdi-certificate" aria-hidden="true"></i>
                    {{ $t("SSI Management") }}
                </h1>
                <p class="a11y-text-secondary">
                    {{ $t("Issue, validate and revoke verifiable credentials") }}
                </p>
            </div>
        </header>

        <main id="main-content">
            <!-- Pestañas de navegación -->
            <nav class="tabs-nav" aria-label="Management sections">
                <button 
                    v-for="tab in tabs" 
                    :key="tab.id"
                    @click="activeTab = tab.id"
                    class="tab-btn"
                    :class="{ 'tab-active': activeTab === tab.id }"
                    :aria-selected="activeTab === tab.id"
                    :aria-controls="`panel-${tab.id}`"
                    role="tab"
                >
                    <i :class="'mdi ' + tab.icon" aria-hidden="true"></i>
                    {{ $t(tab.label) }}
                    <span v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</span>
                </button>
            </nav>

            <!-- Panel: Emitir Credencial -->
            <section 
                v-if="activeTab === 'emit'"
                id="panel-emit"
                class="tab-panel"
                role="tabpanel"
                aria-labelledby="emit-tab"
            >
                <div class="panel-header">
                    <h2 class="a11y-heading-2">{{ $t("Issue new credential") }}</h2>
                    <p class="a11y-text-secondary">
                        {{ $t("Create a new verifiable credential for a citizen") }}
                    </p>
                </div>

                <form @submit.prevent="issueCredential" class="emit-form a11y-card">
                    <!-- Paso 1: Seleccionar ciudadano -->
                    <fieldset class="form-section">
                        <legend class="section-title">
                            <span class="step-number">1</span>
                            {{ $t("Select citizen") }}
                        </legend>
                        
                        <div class="a11y-form-group">
                            <label for="citizen-search" class="a11y-label a11y-label-required">
                                {{ $t("Search citizen") }}
                            </label>
                            <input 
                                id="citizen-search"
                                type="search"
                                v-model="emitForm.citizenSearch"
                                class="a11y-input"
                                :placeholder="$t('Enter name, DNI or DID...')"
                                @input="searchCitizens"
                            />
                        </div>

                        <!-- Resultados de búsqueda -->
                        <div v-if="citizenSearchResults.length > 0" class="search-results">
                            <button
                                v-for="citizen in citizenSearchResults"
                                :key="citizen.id"
                                type="button"
                                @click="selectCitizen(citizen)"
                                class="search-result-item"
                                :class="{ 'selected': emitForm.selectedCitizen?.id === citizen.id }"
                            >
                                <span class="result-avatar">{{ getInitials(citizen.name) }}</span>
                                <div class="result-info">
                                    <span class="result-name">{{ citizen.name }}</span>
                                    <span class="result-id">{{ maskId(citizen.nationalId) }}</span>
                                </div>
                                <span v-if="emitForm.selectedCitizen?.id === citizen.id" class="check-mark">
                                    <i class="mdi mdi-check"></i>
                                </span>
                            </button>
                        </div>

                        <!-- Ciudadano seleccionado -->
                        <div v-if="emitForm.selectedCitizen" class="selected-citizen a11y-alert a11y-alert-success">
                            <i class="mdi mdi-check-circle a11y-alert-icon" aria-hidden="true"></i>
                            <div class="a11y-alert-content">
                                <p class="a11y-alert-title">{{ $t("Selected citizen") }}</p>
                                <p>{{ emitForm.selectedCitizen.name }}</p>
                                <p class="a11y-text-secondary">DID: {{ truncateDid(emitForm.selectedCitizen.did) }}</p>
                            </div>
                        </div>
                    </fieldset>

                    <!-- Paso 2: Tipo de credencial -->
                    <fieldset class="form-section">
                        <legend class="section-title">
                            <span class="step-number">2</span>
                            {{ $t("Credential type") }}
                        </legend>
                        
                        <div class="credential-types">
                            <label 
                                v-for="credType in credentialTypes" 
                                :key="credType.id"
                                class="credential-type-option"
                                :class="{ 'option-selected': emitForm.credentialType === credType.id }"
                            >
                                <input 
                                    type="radio"
                                    :value="credType.id"
                                    v-model="emitForm.credentialType"
                                    class="a11y-visually-hidden"
                                />
                                <i :class="'mdi ' + credType.icon + ' option-icon'" aria-hidden="true"></i>
                                <div class="option-content">
                                    <span class="option-title">{{ $t(credType.name) }}</span>
                                    <span class="option-desc">{{ $t(credType.description) }}</span>
                                </div>
                                <span v-if="emitForm.credentialType === credType.id" class="option-check">
                                    <i class="mdi mdi-check-circle"></i>
                                </span>
                            </label>
                        </div>
                    </fieldset>

                    <!-- Paso 3: Datos específicos de la credencial -->
                    <fieldset v-if="emitForm.credentialType" class="form-section">
                        <legend class="section-title">
                            <span class="step-number">3</span>
                            {{ $t("Credential data") }}
                        </legend>
                        
                        <!-- Campos para Credencial de Discapacidad -->
                        <template v-if="emitForm.credentialType === 'disability'">
                            <div class="a11y-form-group">
                                <label for="disability-grade" class="a11y-label a11y-label-required">
                                    {{ $t("Disability grade") }}
                                </label>
                                <select 
                                    id="disability-grade"
                                    v-model="emitForm.credentialData.disabilityGrade"
                                    class="a11y-select"
                                    required
                                >
                                    <option value="">{{ $t("Select grade") }}</option>
                                    <option value="33-64">33% - 64%</option>
                                    <option value="65-74">65% - 74%</option>
                                    <option value="75+">75% {{ $t("or more") }}</option>
                                </select>
                            </div>
                            
                            <div class="a11y-form-group">
                                <label for="mobility-reduced" class="a11y-label">
                                    {{ $t("Reduced mobility") }}
                                </label>
                                <div class="checkbox-wrapper">
                                    <input 
                                        id="mobility-reduced"
                                        type="checkbox"
                                        v-model="emitForm.credentialData.mobilityReduced"
                                    />
                                    <label for="mobility-reduced">
                                        {{ $t("Has officially recognized reduced mobility") }}
                                    </label>
                                </div>
                            </div>

                            <div class="a11y-form-group">
                                <label for="official-doc" class="a11y-label a11y-label-required">
                                    {{ $t("Official document number") }}
                                </label>
                                <input 
                                    id="official-doc"
                                    type="text"
                                    v-model="emitForm.credentialData.officialDocNumber"
                                    class="a11y-input"
                                    required
                                    :placeholder="$t('Certificate number from autonomous community')"
                                />
                            </div>
                        </template>

                        <!-- Campos para Credencial de Empadronamiento -->
                        <template v-if="emitForm.credentialType === 'census'">
                            <div class="a11y-form-group">
                                <label for="census-address" class="a11y-label a11y-label-required">
                                    {{ $t("Registered address") }}
                                </label>
                                <input 
                                    id="census-address"
                                    type="text"
                                    v-model="emitForm.credentialData.address"
                                    class="a11y-input"
                                    required
                                />
                            </div>

                            <div class="a11y-form-group">
                                <label for="census-since" class="a11y-label a11y-label-required">
                                    {{ $t("Registered since") }}
                                </label>
                                <input 
                                    id="census-since"
                                    type="date"
                                    v-model="emitForm.credentialData.censusSince"
                                    class="a11y-input"
                                    required
                                />
                            </div>

                            <div class="a11y-form-group">
                                <label for="census-district" class="a11y-label">
                                    {{ $t("District") }}
                                </label>
                                <select 
                                    id="census-district"
                                    v-model="emitForm.credentialData.district"
                                    class="a11y-select"
                                >
                                    <option value="">{{ $t("Select district") }}</option>
                                    <option value="centro">Centro</option>
                                    <option value="norte">Norte</option>
                                    <option value="sur">Sur</option>
                                    <option value="este">Este</option>
                                    <option value="oeste">Oeste</option>
                                </select>
                            </div>
                        </template>

                        <!-- Validez -->
                        <div class="a11y-form-group">
                            <label for="validity-years" class="a11y-label a11y-label-required">
                                {{ $t("Validity period") }}
                            </label>
                            <select 
                                id="validity-years"
                                v-model="emitForm.validityYears"
                                class="a11y-select"
                                required
                            >
                                <option value="1">1 {{ $t("year") }}</option>
                                <option value="2">2 {{ $t("years") }}</option>
                                <option value="5">5 {{ $t("years") }}</option>
                                <option value="10">10 {{ $t("years") }}</option>
                            </select>
                        </div>
                    </fieldset>

                    <!-- Resumen y confirmación -->
                    <fieldset v-if="canSubmit" class="form-section summary-section">
                        <legend class="section-title">
                            <span class="step-number">4</span>
                            {{ $t("Confirm and issue") }}
                        </legend>
                        
                        <div class="a11y-alert a11y-alert-info">
                            <i class="mdi mdi-information a11y-alert-icon" aria-hidden="true"></i>
                            <div class="a11y-alert-content">
                                <p class="a11y-alert-title">{{ $t("What will happen") }}</p>
                                <ol class="process-steps">
                                    <li>{{ $t("A W3C Verifiable Credential will be created") }}</li>
                                    <li>{{ $t("The credential hash will be anchored to BSV blockchain") }}</li>
                                    <li>{{ $t("The citizen will receive their credential in their wallet") }}</li>
                                    <li v-if="getAssociatedToken">
                                        {{ $t("Associated tokens will be issued") }}: 
                                        <strong>{{ getAssociatedToken }}</strong>
                                    </li>
                                </ol>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button 
                                type="button"
                                @click="resetForm"
                                class="a11y-btn a11y-btn-secondary"
                            >
                                {{ $t("Cancel") }}
                            </button>
                            <button 
                                type="submit"
                                class="a11y-btn a11y-btn-primary a11y-btn-large"
                                :disabled="isSubmitting"
                            >
                                <span v-if="isSubmitting">{{ $t("Issuing...") }}</span>
                                <span v-else>
                                    <i class="mdi mdi-certificate" aria-hidden="true"></i>
                                    {{ $t("Issue credential") }}
                                </span>
                            </button>
                        </div>
                    </fieldset>
                </form>
            </section>

            <!-- Panel: Validaciones Pendientes -->
            <section 
                v-if="activeTab === 'pending'"
                id="panel-pending"
                class="tab-panel"
                role="tabpanel"
                aria-labelledby="pending-tab"
            >
                <div class="panel-header">
                    <h2 class="a11y-heading-2">{{ $t("Pending validations") }}</h2>
                    <p class="a11y-text-secondary">
                        {{ $t("Credential requests waiting for your approval") }}
                    </p>
                </div>

                <div class="pending-list">
                    <article 
                        v-for="request in pendingRequests"
                        :key="request.id"
                        class="pending-card a11y-card"
                    >
                        <div class="pending-header">
                            <i class="mdi mdi-clipboard-clock pending-icon" aria-hidden="true"></i>
                            <div class="pending-info">
                                <h3 class="pending-title">{{ $t(request.credentialType) }}</h3>
                                <span class="pending-citizen">{{ request.citizenName }}</span>
                            </div>
                            <span class="a11y-badge a11y-badge-warning">{{ $t("Pending") }}</span>
                        </div>
                        
                        <div class="pending-body">
                            <p class="pending-desc">{{ request.reason }}</p>
                            <div class="pending-meta">
                                <span>
                                    <strong>{{ $t("Requested") }}:</strong> 
                                    {{ formatDate(request.requestedAt) }}
                                </span>
                                <span>
                                    <strong>{{ $t("Documents") }}:</strong>
                                    {{ request.documentsCount }} {{ $t("attached") }}
                                </span>
                            </div>
                        </div>
                        
                        <footer class="pending-footer">
                            <button 
                                @click="viewRequestDetails(request)"
                                class="a11y-btn a11y-btn-secondary"
                            >
                                {{ $t("View details") }}
                            </button>
                            <button 
                                @click="rejectRequest(request)"
                                class="a11y-btn a11y-btn-danger"
                            >
                                {{ $t("Reject") }}
                            </button>
                            <button 
                                @click="approveRequest(request)"
                                class="a11y-btn a11y-btn-success"
                            >
                                {{ $t("Approve") }}
                            </button>
                        </footer>
                    </article>
                </div>

                <div v-if="pendingRequests.length === 0" class="empty-state a11y-card">
                    <i class="mdi mdi-check-circle empty-icon" aria-hidden="true"></i>
                    <p class="empty-title">{{ $t("No pending requests") }}</p>
                    <p class="empty-desc a11y-text-secondary">
                        {{ $t("All credential requests have been processed") }}
                    </p>
                </div>
            </section>

            <!-- Panel: Revocaciones -->
            <section 
                v-if="activeTab === 'revocations'"
                id="panel-revocations"
                class="tab-panel"
                role="tabpanel"
                aria-labelledby="revocations-tab"
            >
                <div class="panel-header">
                    <h2 class="a11y-heading-2">{{ $t("Credential revocations") }}</h2>
                    <p class="a11y-text-secondary">
                        {{ $t("Manage and review revoked credentials") }}
                    </p>
                </div>

                <!-- Búsqueda para revocar -->
                <div class="revoke-search a11y-card">
                    <h3 class="a11y-heading-3">{{ $t("Revoke a credential") }}</h3>
                    <div class="a11y-form-group">
                        <label for="revoke-search" class="a11y-label">
                            {{ $t("Search credential by citizen or ID") }}
                        </label>
                        <div class="search-with-btn">
                            <input 
                                id="revoke-search"
                                type="search"
                                v-model="revokeSearch"
                                class="a11y-input"
                                :placeholder="$t('Enter citizen name, DNI or credential ID...')"
                            />
                            <button type="button" class="a11y-btn a11y-btn-primary">
                                {{ $t("Search") }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Historial de revocaciones -->
                <div class="revocations-history a11y-mt-lg">
                    <h3 class="a11y-heading-3">{{ $t("Revocation history") }}</h3>
                    
                    <div class="a11y-table-responsive">
                        <table class="a11y-table">
                            <thead>
                                <tr>
                                    <th>{{ $t("Credential") }}</th>
                                    <th>{{ $t("Citizen") }}</th>
                                    <th>{{ $t("Revoked on") }}</th>
                                    <th>{{ $t("Reason") }}</th>
                                    <th>{{ $t("Blockchain") }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="rev in revocationHistory" :key="rev.id">
                                    <td>
                                        <span class="cred-type-badge">
                                            <i :class="'mdi ' + getCredentialIcon(rev.credentialType)"></i>
                                            {{ $t(rev.credentialType) }}
                                        </span>
                                    </td>
                                    <td>{{ rev.citizenName }}</td>
                                    <td>{{ formatDate(rev.revokedAt) }}</td>
                                    <td>{{ $t(rev.reason) }}</td>
                                    <td>
                                        <a 
                                            :href="getBlockchainUrl(rev.txId)"
                                            target="_blank"
                                            rel="noopener"
                                            class="blockchain-link"
                                        >
                                            {{ truncateTx(rev.txId) }} <i class="mdi mdi-link-variant"></i>
                                        </a>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </main>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { AuthController } from "@/control/auth";

interface Citizen {
    id: string;
    name: string;
    nationalId: string;
    did: string;
}

interface PendingRequest {
    id: string;
    citizenId: string;
    citizenName: string;
    credentialType: string;
    reason: string;
    documentsCount: number;
    requestedAt: string;
}

interface Revocation {
    id: string;
    credentialId: string;
    credentialType: string;
    citizenName: string;
    revokedAt: string;
    reason: string;
    txId: string;
}

export default defineComponent({
    components: {},
    name: "PermisosPage",
    data: function () {
        return {
            activeTab: "emit",
            tabs: [
                { id: "emit", label: "Issue", icon: "mdi-file-document-edit", count: 0 },
                { id: "pending", label: "Pending", icon: "mdi-clock-outline", count: 5 },
                { id: "revocations", label: "Revocations", icon: "mdi-cancel", count: 0 },
            ],
            // Emit form
            emitForm: {
                citizenSearch: "",
                selectedCitizen: null as Citizen | null,
                credentialType: "",
                credentialData: {
                    // Disability
                    disabilityGrade: "",
                    mobilityReduced: false,
                    officialDocNumber: "",
                    // Census
                    address: "",
                    censusSince: "",
                    district: "",
                },
                validityYears: "1",
            },
            citizenSearchResults: [] as Citizen[],
            isSubmitting: false,
            credentialTypes: [
                {
                    id: "disability",
                    name: "Disability Credential",
                    description: "For citizens with official disability recognition",
                    icon: "mdi-wheelchair-accessibility",
                },
                {
                    id: "census",
                    name: "Census Credential",
                    description: "Proof of registration in the municipal census",
                    icon: "mdi-clipboard-account",
                },
            ],
            // Mock citizens for search
            allCitizens: [
                { id: "cit-001", name: "María González Pérez", nationalId: "12345678A", did: "did:bsv:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2" },
                { id: "cit-002", name: "Juan Carlos López Martín", nationalId: "87654321B", did: "did:bsv:3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy" },
                { id: "cit-003", name: "Ana Belén Sánchez Ruiz", nationalId: "11223344C", did: "did:bsv:1BoatSLRHtKNngkdXEeobR76b53LETtpyT" },
            ] as Citizen[],
            // Pending requests
            pendingRequests: [
                {
                    id: "req-001",
                    citizenId: "cit-003",
                    citizenName: "Ana Belén Sánchez Ruiz",
                    credentialType: "Disability Credential",
                    reason: "Solicita credencial de discapacidad para acceso a servicios PMR",
                    documentsCount: 3,
                    requestedAt: "2024-06-20T10:30:00Z",
                },
                {
                    id: "req-002",
                    citizenId: "cit-004",
                    citizenName: "Pedro Ramírez Torres",
                    credentialType: "Census Credential",
                    reason: "Renovación de empadronamiento para acceso a EcoPuntos",
                    documentsCount: 1,
                    requestedAt: "2024-06-19T14:45:00Z",
                },
            ] as PendingRequest[],
            // Revocations
            revokeSearch: "",
            revocationHistory: [
                {
                    id: "rev-001",
                    credentialId: "cred-old-001",
                    credentialType: "Disability Credential",
                    citizenName: "Carlos Martín Díaz",
                    revokedAt: "2024-05-15T09:00:00Z",
                    reason: "Certificate expired",
                    txId: "abc123revoke456",
                },
                {
                    id: "rev-002",
                    credentialId: "cred-old-002",
                    credentialType: "Census Credential",
                    citizenName: "Laura Fernández Gil",
                    revokedAt: "2024-04-28T11:30:00Z",
                    reason: "Address change",
                    txId: "xyz789revoke012",
                },
            ] as Revocation[],
        };
    },
    computed: {
        isAdmin(): boolean {
            return AuthController.Role === "admin" || AuthController.Role === "root";
        },
        canSubmit(): boolean {
            if (!this.emitForm.selectedCitizen) return false;
            if (!this.emitForm.credentialType) return false;
            if (!this.emitForm.validityYears) return false;
            
            if (this.emitForm.credentialType === "disability") {
                return !!(
                    this.emitForm.credentialData.disabilityGrade &&
                    this.emitForm.credentialData.officialDocNumber
                );
            }
            
            if (this.emitForm.credentialType === "census") {
                return !!(
                    this.emitForm.credentialData.address &&
                    this.emitForm.credentialData.censusSince
                );
            }
            
            return true;
        },
        getAssociatedToken(): string | null {
            if (this.emitForm.credentialType === "disability") {
                return "parking_pmr (30 usos/mes)";
            }
            if (this.emitForm.credentialType === "census") {
                return "eco_puntos (sistema de puntos)";
            }
            return null;
        },
    },
    methods: {
        formatDate(dateStr: string): string {
            return new Date(dateStr).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
            });
        },
        getInitials(name: string): string {
            return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
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
        getBlockchainUrl(txId: string): string {
            return `/block-explorer/transaction/${txId}`;
        },
        searchCitizens() {
            if (this.emitForm.citizenSearch.length < 2) {
                this.citizenSearchResults = [];
                return;
            }
            
            const search = this.emitForm.citizenSearch.toLowerCase();
            this.citizenSearchResults = this.allCitizens.filter(c =>
                c.name.toLowerCase().includes(search) ||
                c.nationalId.toLowerCase().includes(search) ||
                c.did.toLowerCase().includes(search)
            );
        },
        selectCitizen(citizen: Citizen) {
            this.emitForm.selectedCitizen = citizen;
            this.emitForm.citizenSearch = citizen.name;
            this.citizenSearchResults = [];
        },
        resetForm() {
            this.emitForm = {
                citizenSearch: "",
                selectedCitizen: null,
                credentialType: "",
                credentialData: {
                    disabilityGrade: "",
                    mobilityReduced: false,
                    officialDocNumber: "",
                    address: "",
                    censusSince: "",
                    district: "",
                },
                validityYears: "1",
            };
            this.citizenSearchResults = [];
        },
        async issueCredential() {
            if (!this.canSubmit) return;
            
            this.isSubmitting = true;
            
            try {
                // TODO: Llamar al API para emitir credencial
                // 1. Crear VC según W3C standard
                // 2. Anclar hash en BSV blockchain
                // 3. Emitir tokens asociados
                // 4. Enviar credencial al wallet del ciudadano
                
                console.log("Issuing credential:", {
                    citizen: this.emitForm.selectedCitizen,
                    type: this.emitForm.credentialType,
                    data: this.emitForm.credentialData,
                    validity: this.emitForm.validityYears,
                });
                
                // Simular delay
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Mostrar éxito y resetear
                alert(this.$t("Credential issued successfully!"));
                this.resetForm();
            } catch (error) {
                console.error("Error issuing credential:", error);
                alert(this.$t("Error issuing credential. Please try again."));
            } finally {
                this.isSubmitting = false;
            }
        },
        viewRequestDetails(request: PendingRequest) {
            // TODO: Abrir modal con detalles
            console.log("View request:", request.id);
        },
        approveRequest(request: PendingRequest) {
            // TODO: Aprobar solicitud y emitir credencial
            console.log("Approve request:", request.id);
            this.pendingRequests = this.pendingRequests.filter(r => r.id !== request.id);
            this.tabs[1].count--;
        },
        rejectRequest(request: PendingRequest) {
            // TODO: Rechazar solicitud con razón
            console.log("Reject request:", request.id);
            this.pendingRequests = this.pendingRequests.filter(r => r.id !== request.id);
            this.tabs[1].count--;
        },
    },
    mounted: function () {
        // Check URL params for tab
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get("tab");
        if (tab && ["emit", "pending", "revocations"].includes(tab)) {
            this.activeTab = tab;
        }
        
        // TODO: Cargar datos desde el API
    },
    beforeUnmount: function () {},
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

/* Tabs Navigation */
.tabs-nav {
    display: flex;
    gap: var(--a11y-spacing-xs);
    border-bottom: 2px solid #e0e0e0;
    margin-bottom: var(--a11y-spacing-lg);
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
    padding: var(--a11y-spacing-sm) var(--a11y-spacing-md);
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    margin-bottom: -2px;
    cursor: pointer;
    font-size: var(--a11y-font-size-base);
    font-weight: 500;
    color: var(--a11y-text-secondary);
    transition: all var(--a11y-transition);
}

.tab-btn:hover {
    color: var(--a11y-primary);
    background-color: rgba(0, 86, 179, 0.05);
}

.tab-btn.tab-active {
    color: var(--a11y-primary);
    border-bottom-color: var(--a11y-primary);
    font-weight: 600;
}

.tab-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    background-color: var(--a11y-error);
    color: white;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
}

/* Tab Panel */
.tab-panel {
    animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.panel-header {
    margin-bottom: var(--a11y-spacing-lg);
}

/* Emit Form */
.emit-form {
    padding: var(--a11y-spacing-lg);
}

.form-section {
    border: none;
    padding: 0;
    margin: 0;
    margin-bottom: var(--a11y-spacing-xl);
}

.section-title {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    font-size: var(--a11y-font-size-large);
    font-weight: 600;
    margin-bottom: var(--a11y-spacing-md);
}

.step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background-color: var(--a11y-primary);
    color: white;
    border-radius: 50%;
    font-size: var(--a11y-font-size-base);
}

/* Search Results */
.search-results {
    display: flex;
    flex-direction: column;
    gap: var(--a11y-spacing-xs);
    margin-top: var(--a11y-spacing-sm);
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #e0e0e0;
    border-radius: var(--a11y-border-radius);
}

.search-result-item {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-sm);
    background: white;
    border: none;
    border-bottom: 1px solid #e0e0e0;
    cursor: pointer;
    text-align: left;
    width: 100%;
}

.search-result-item:last-child {
    border-bottom: none;
}

.search-result-item:hover {
    background-color: #f5f5f5;
}

.search-result-item.selected {
    background-color: var(--a11y-success-bg);
}

.result-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background-color: var(--a11y-primary);
    color: white;
    border-radius: 50%;
    font-size: 14px;
    font-weight: 600;
}

.result-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.result-name {
    font-weight: 500;
}

.result-id {
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
}

.check-mark {
    color: var(--a11y-success);
    font-size: 1.25rem;
}

/* Credential Types */
.credential-types {
    display: grid;
    gap: var(--a11y-spacing-md);
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.credential-type-option {
    display: flex;
    align-items: flex-start;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-md);
    border: 2px solid #e0e0e0;
    border-radius: var(--a11y-border-radius);
    cursor: pointer;
    transition: all var(--a11y-transition);
}

.credential-type-option:hover {
    border-color: var(--a11y-primary);
    background-color: rgba(0, 86, 179, 0.05);
}

.credential-type-option.option-selected {
    border-color: var(--a11y-primary);
    background-color: rgba(0, 86, 179, 0.1);
}

.option-icon {
    font-size: 2rem;
}

.option-content {
    flex: 1;
}

.option-title {
    display: block;
    font-weight: 600;
    margin-bottom: var(--a11y-spacing-xs);
}

.option-desc {
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
}

.option-check {
    color: var(--a11y-primary);
    font-size: 1.5rem;
}

/* Checkbox */
.checkbox-wrapper {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
}

.checkbox-wrapper input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
}

/* Process steps */
.process-steps {
    margin: var(--a11y-spacing-sm) 0 0 var(--a11y-spacing-md);
    padding: 0;
}

.process-steps li {
    margin-bottom: var(--a11y-spacing-xs);
}

/* Form Actions */
.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--a11y-spacing-sm);
    padding-top: var(--a11y-spacing-md);
    border-top: 1px solid #e0e0e0;
    margin-top: var(--a11y-spacing-md);
}

/* Pending Cards */
.pending-list {
    display: flex;
    flex-direction: column;
    gap: var(--a11y-spacing-md);
}

.pending-card {
    padding: var(--a11y-spacing-lg);
}

.pending-header {
    display: flex;
    align-items: flex-start;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-md);
}

.pending-icon {
    font-size: 2rem;
}

.pending-info {
    flex: 1;
}

.pending-title {
    font-size: var(--a11y-font-size-large);
    font-weight: 600;
    margin: 0;
}

.pending-citizen {
    color: var(--a11y-text-secondary);
}

.pending-body {
    margin-bottom: var(--a11y-spacing-md);
}

.pending-desc {
    margin-bottom: var(--a11y-spacing-sm);
}

.pending-meta {
    display: flex;
    gap: var(--a11y-spacing-lg);
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
}

.pending-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--a11y-spacing-sm);
    padding-top: var(--a11y-spacing-md);
    border-top: 1px solid #e0e0e0;
}

/* Revocation Search */
.revoke-search {
    padding: var(--a11y-spacing-lg);
}

.search-with-btn {
    display: flex;
    gap: var(--a11y-spacing-sm);
}

.search-with-btn input {
    flex: 1;
}

/* Revocation Table */
.cred-type-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
}

.blockchain-link {
    display: inline-flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
    color: var(--a11y-primary);
    text-decoration: none;
}

.blockchain-link:hover {
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
}

.empty-title {
    font-size: var(--a11y-font-size-large);
    font-weight: 600;
    margin: 0;
    margin-bottom: var(--a11y-spacing-sm);
}

/* Responsive */
@media (max-width: 768px) {
    .miciudad-gestion {
        padding: var(--a11y-spacing-md);
    }
    
    .tabs-nav {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }
    
    .tab-btn {
        white-space: nowrap;
    }
    
    .credential-types {
        grid-template-columns: 1fr;
    }
    
    .pending-meta {
        flex-direction: column;
        gap: var(--a11y-spacing-xs);
    }
    
    .pending-footer {
        flex-direction: column;
    }
    
    .form-actions {
        flex-direction: column;
    }
    
    .search-with-btn {
        flex-direction: column;
    }
}
</style>

