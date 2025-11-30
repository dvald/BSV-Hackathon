<template>
    <div class="page-content miciudad-servicios" tabindex="-1">
        <!-- Skip link para accesibilidad -->
        <a href="#main-content" class="a11y-skip-link">
            {{ $t("Skip to main content") }}
        </a>

        <!-- Encabezado -->
        <header class="page-header">
            <div class="header-content">
                <h1 class="a11y-heading-1">
                    <i class="mdi mdi-domain" aria-hidden="true"></i>
                    {{ $t("Municipal Services") }}
                </h1>
            <p class="a11y-text-secondary">
                {{ $t("Departments and services that issue or verify credentials") }}
            </p>
            </div>
            <div class="header-actions" v-if="isAdmin">
                <button 
                    @click="showNewServiceModal = true"
                    class="a11y-btn a11y-btn-primary a11y-btn-large"
                    :aria-label="$t('Create new service')"
                >
                    <i class="mdi mdi-plus" aria-hidden="true"></i>
                    {{ $t("New service") }}
                </button>
                <button 
                    @click="openNewCredentialTypeModal"
                    class="a11y-btn a11y-btn-secondary a11y-btn-large"
                    :aria-label="$t('Create new credential type')"
                >
                    <i class="mdi mdi-plus" aria-hidden="true"></i>
                    {{ $t("New credential") }}
                </button>
            </div>
        </header>

        <main id="main-content">
            <!-- Filtros -->
            <section class="filters-section a11y-card" aria-labelledby="filters-heading">
                <h2 id="filters-heading" class="a11y-visually-hidden">{{ $t("Filters") }}</h2>
                
                <div class="filters-grid">                    
                    <div class="a11y-form-group">
                        <label for="filter-category" class="a11y-label">
                            {{ $t("Category") }}
                        </label>
                        <select 
                            id="filter-category" 
                            v-model="filters.category"
                            class="a11y-select"
                        >
                            <option value="">{{ $t("All") }}</option>
                            <option value="mobility">{{ $t("Mobility") }}</option>
                            <option value="environment">{{ $t("Environment") }}</option>
                            <option value="social">{{ $t("Social Services") }}</option>
                            <option value="culture">{{ $t("Culture") }}</option>
                        </select>
                    </div>
                    
                    <div class="a11y-form-group">
                        <label for="filter-search" class="a11y-label">
                            {{ $t("Search") }}
                        </label>
                        <input 
                            id="filter-search"
                            type="search"
                            v-model="filters.search"
                            class="a11y-input"
                            :placeholder="$t('Search service...')"
                        />
                    </div>
                </div>
            </section>

            <!-- Lista de servicios -->
            <section aria-labelledby="services-heading" class="a11y-mt-lg">
                <h2 id="services-heading" class="a11y-heading-2">
                    {{ $t("Services") }} ({{ filteredServices.length }})
                </h2>

                <div class="services-grid a11y-grid a11y-grid-2">
                    <!-- Servicio de Movilidad - Parking PMR -->
                    <article 
                        v-for="service in filteredServices" 
                        :key="service.id"
                        class="service-card a11y-card"
                        :class="{ 'service-inactive': service.status !== 'active' }"
                    >
                        <header class="service-header">
                            <i :class="'mdi ' + service.icon + ' service-icon'" aria-hidden="true"></i>
                            <div class="service-title-group">
                                <h3 class="service-title">{{ $t(service.name) }}</h3>
                                <span 
                                    class="a11y-badge" 
                                    :class="getStatusBadgeClass(service.status)"
                                >
                                    {{ $t(getStatusLabel(service.status)) }}
                                </span>
                            </div>
                        </header>

                        <div class="service-body">
                            <p class="service-description a11y-text">
                                {{ $t(service.description) }}
                            </p>

                            <!-- Estadísticas del servicio -->
                            <div class="service-metrics">
                                <div class="metric">
                                    <span class="metric-value">{{ formatNumber(service.metrics.users) }}</span>
                                    <span class="metric-label">{{ $t("Citizens") }}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-value">{{ formatNumber(service.metrics.credentials) }}</span>
                                    <span class="metric-label">{{ $t("Credentials") }}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-value">{{ formatNumber(service.metrics.tokensUsed) }}</span>
                                    <span class="metric-label">{{ $t("Tokens used") }}</span>
                                </div>
                            </div>

                            <!-- Administrador del servicio -->
                            <div class="service-admin">
                                <span class="admin-label">{{ $t("Service administrator") }}:</span>
                                <span class="admin-name">{{ service.admin.name }}</span>
                                <span class="admin-email a11y-text-secondary">{{ service.admin.email }}</span>
                            </div>

                            <!-- Tipos de credenciales que acepta -->
                            <div class="service-credentials">
                                <span class="credentials-label">{{ $t("Required credentials") }}:</span>
                                <ul class="credentials-list" role="list">
                                    <li 
                                        v-for="cred in service.requiredCredentials" 
                                        :key="cred"
                                        class="credential-tag"
                                    >
                                        {{ $t(cred) }}
                                    </li>
                                </ul>
                            </div>

                            <!-- Token asociado -->
                            <div class="service-token">
                                <span class="token-label">{{ $t("Associated token") }}:</span>
                                <span class="token-name">
                                    <i class="mdi mdi-hand-coin" aria-hidden="true"></i>
                                    {{ service.token.name }}
                                </span>
                                <span class="token-type a11y-text-secondary">
                                    ({{ $t(service.token.type === 'uses' ? 'Uses' : 'Points') }})
                                </span>
                            </div>
                        </div>
                        <footer class="service-footer">
                            <button 
                            v-if="isAdmin"
                            @click="editService(service)"
                            class="a11y-btn a11y-btn-primary"
                            >
                            {{ $t("Configure") }}
                        </button>
                        <button v-else @click="requestService(service)" class="a11y-btn a11y-btn-primary">
                            {{ $t("Request service") }}
                        </button>
                        </footer>
                    </article>
                </div>

                <!-- Estado vacío -->
                <div 
                    v-if="filteredServices.length === 0" 
                    class="empty-state a11y-card"
                    role="status"
                >
                    <i class="mdi mdi-magnify empty-icon" aria-hidden="true"></i>
                    <p class="empty-title">{{ $t("No services found") }}</p>
                    <p class="empty-desc a11y-text-secondary">
                        {{ $t("Try adjusting your filters or create a new service") }}
                    </p>
                </div>
            </section>
        </main>

        <!-- Modal para nuevo servicio -->
        <div 
            v-if="showNewServiceModal" 
            class="modal-overlay"
            @click.self="showNewServiceModal = false"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-service-title"
        >
            <div class="modal-content a11y-card">
                <header class="modal-header">
                    <h2 id="new-service-title" class="a11y-heading-2">
                        {{ $t("Create new service") }}
                    </h2>
                    <button 
                        @click="showNewServiceModal = false"
                        class="a11y-btn a11y-btn-icon"
                        :aria-label="$t('Close')"
                    >
                        ✕
                    </button>
                </header>
                
                <form @submit.prevent="createService" class="modal-body">
                    <div class="a11y-form-group">
                        <label for="service-name" class="a11y-label a11y-label-required">
                            {{ $t("Service name") }}
                        </label>
                        <input 
                            id="service-name"
                            type="text"
                            v-model="newService.name"
                            class="a11y-input"
                            required
                        />
                    </div>

                    <div class="a11y-form-group">
                        <label for="service-category" class="a11y-label a11y-label-required">
                            {{ $t("Category") }}
                        </label>
                        <select 
                            id="service-category"
                            v-model="newService.category"
                            class="a11y-select"
                            required
                        >
                            <option value="">{{ $t("Select category") }}</option>
                            <option value="mobility">{{ $t("Mobility") }}</option>
                            <option value="environment">{{ $t("Environment") }}</option>
                            <option value="social">{{ $t("Social Services") }}</option>
                            <option value="culture">{{ $t("Culture") }}</option>
                        </select>
                    </div>

                    <div class="a11y-form-group">
                        <label for="service-description" class="a11y-label a11y-label-required">
                            {{ $t("Description") }}
                        </label>
                        <textarea 
                            id="service-description"
                            v-model="newService.description"
                            class="a11y-textarea"
                            rows="3"
                            required
                        ></textarea>
                        <p class="a11y-help-text">
                            {{ $t("Write a clear and simple description for all citizens") }}
                        </p>
                    </div>

                    <div class="a11y-form-group">
                        <label for="service-admin" class="a11y-label a11y-label-required">
                            {{ $t("Service administrator") }}
                        </label>
                        <select 
                            id="service-admin"
                            v-model="newService.adminId"
                            class="a11y-select"
                            required
                        >
                            <option value="">{{ $t("Select administrator") }}</option>
                            <option 
                                v-for="admin in availableAdmins" 
                                :key="admin.id"
                                :value="admin.id"
                            >
                                {{ admin.name }} ({{ admin.email }})
                            </option>
                        </select>
                    </div>

                    <footer class="modal-footer">
                        <button 
                            type="button"
                            @click="showNewServiceModal = false"
                            class="a11y-btn a11y-btn-secondary"
                        >
                            {{ $t("Cancel") }}
                        </button>
                        <button 
                            type="submit"
                            class="a11y-btn a11y-btn-primary"
                        >
                            {{ $t("Create service") }}
                        </button>
                    </footer>
                </form>
            </div>
        </div>

        <!-- Modal para solicitar servicio -->
        <div 
            v-if="showRequestServiceModal && selectedService" 
            class="modal-overlay"
            @click.self="closeRequestModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-service-title"
        >
            <div class="modal-content a11y-card request-service-modal">
                <header class="modal-header">
                    <h2 id="request-service-title" class="a11y-heading-2">
                        {{ $t("Request Service") }}
                    </h2>
                    <button 
                        @click="closeRequestModal"
                        class="a11y-btn a11y-btn-icon"
                        :aria-label="$t('Close')"
                    >
                        ✕
                    </button>
                </header>
                
                <div class="modal-body">
                    <!-- Información del servicio seleccionado -->
                    <div class="selected-service-info">
                        <div class="service-info-header">
                            <i :class="'mdi ' + selectedService.icon + ' service-info-icon'" aria-hidden="true"></i>
                            <div>
                                <h3 class="service-info-title">{{ $t(selectedService.name) }}</h3>
                                <p class="service-info-desc a11y-text-secondary">
                                    {{ $t(selectedService.description) }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Formulario de solicitud -->
                    <form @submit.prevent="submitServiceRequest" class="request-form">
                        <div class="a11y-form-group">
                            <label for="request-document" class="a11y-label a11y-label-required">
                                {{ $t("Upload Identification document") }}
                            </label>
                            <div class="file-upload-area" :class="{ 'has-file': serviceRequest.document }">
                                <input 
                                    id="request-document"
                                    type="file"
                                    @change="handleFileUpload"
                                    class="file-input"
                                    accept=".pdf,.doc,.docx"
                                    required
                                />
                                <div class="file-upload-content">
                                    <i class="mdi mdi-cloud-upload file-upload-icon" aria-hidden="true"></i>
                                    <p class="file-upload-text" v-if="!serviceRequest.document">
                                        {{ $t("Click or drag file here") }}
                                    </p>
                                    <p class="file-upload-text file-selected" v-else>
                                        <i class="mdi mdi-file-document" aria-hidden="true"></i>
                                        {{ serviceRequest.document.name }}
                                    </p>
                                    <p class="file-upload-hint a11y-text-secondary">
                                        {{ $t("PDF, DOC, DOCX(max 10MB)") }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Mensaje de error -->
                        <div v-if="uploadError" class="upload-message upload-error" role="alert">
                            <i class="mdi mdi-alert-circle" aria-hidden="true"></i>
                            {{ uploadError }}
                        </div>

                        <!-- Mensaje de éxito -->
                        <div v-if="uploadSuccess" class="upload-message upload-success" role="status">
                            <i class="mdi mdi-check-circle" aria-hidden="true"></i>
                            {{ $t("Document uploaded successfully!") }}
                        </div>

                        <footer class="modal-footer">
                            <button 
                                type="button"
                                @click="closeRequestModal"
                                class="a11y-btn a11y-btn-secondary"
                                :disabled="uploading"
                            >
                                {{ $t("Cancel") }}
                            </button>
                            <button 
                                type="submit"
                                class="a11y-btn a11y-btn-primary"
                                :disabled="!serviceRequest.document || uploading || uploadSuccess"
                            >
                                <i v-if="uploading" class="mdi mdi-loading mdi-spin" aria-hidden="true"></i>
                                <i v-else class="mdi mdi-send" aria-hidden="true"></i>
                                {{ uploading ? $t("Uploading...") : $t("Submit request") }}
                            </button>
                        </footer>
                    </form>
                </div>
            </div>
        </div>

        <!-- Modal para nuevo tipo de credencial -->
        <div 
            v-if="showNewCredentialTypeModal" 
            class="modal-overlay"
            @click.self="showNewCredentialTypeModal = false"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-credential-type-title"
        >
            <div class="modal-content a11y-card">
                <header class="modal-header">
                    <h2 id="new-credential-type-title" class="a11y-heading-2">
                        {{ $t("Create new credential type") }}
                    </h2>
                    <button 
                        @click="showNewCredentialTypeModal = false"
                        class="a11y-btn a11y-btn-icon"
                        :aria-label="$t('Close')"
                    >
                        ✕
                    </button>
                </header>
                
                <form @submit.prevent="createCredentialType" class="modal-body">
                    <div class="a11y-form-group">
                        <label for="credential-type-name" class="a11y-label a11y-label-required">
                            {{ $t("Credential type name") }}
                        </label>
                        <input 
                            id="credential-type-name"
                            type="text"
                            v-model="newCredentialType.name"
                            class="a11y-input"
                            :placeholder="$t('e.g. Disability Certificate')"
                            required
                        />
                    </div>

                    <div class="a11y-form-group">
                        <label for="credential-type-description" class="a11y-label">
                            {{ $t("Description") }}
                        </label>
                        <textarea 
                            id="credential-type-description"
                            v-model="newCredentialType.description"
                            class="a11y-textarea"
                            rows="3"
                            :placeholder="$t('Describe what this credential type is used for...')"
                        ></textarea>
                    </div>

                    <div class="a11y-form-group">
                        <label for="credential-type-service" class="a11y-label">
                            {{ $t("Associated service") }}
                        </label>
                        <div class="select-with-loading">
                            <select 
                                id="credential-type-service"
                                v-model="newCredentialType.serviceId"
                                class="a11y-select"
                                :disabled="loadingServicesForModal || (!loadingServicesForModal && availableServicesFromApi.length === 0)"
                            >
                                <option value="" v-if="loadingServicesForModal">{{ $t("Loading services...") }}</option>
                                <option value="" v-else-if="availableServicesFromApi.length === 0">{{ $t("No services available") }}</option>
                                <option value="" v-else>{{ $t("No service (general credential)") }}</option>
                                <option 
                                    v-for="service in availableServicesFromApi" 
                                    :key="service.id"
                                    :value="service.id"
                                >
                                    {{ service.name }}
                                </option>
                            </select>
                            <i v-if="loadingServicesForModal" class="mdi mdi-loading mdi-spin loading-indicator" aria-hidden="true"></i>
                        </div>
                    </div>

                    <!-- Mensaje de error -->
                    <div v-if="credentialTypeError" class="upload-message upload-error" role="alert">
                        <i class="mdi mdi-alert-circle" aria-hidden="true"></i>
                        {{ credentialTypeError }}
                    </div>

                    <!-- Mensaje de éxito -->
                    <div v-if="credentialTypeSuccess" class="upload-message upload-success" role="status">
                        <i class="mdi mdi-check-circle" aria-hidden="true"></i>
                        {{ $t("Credential type created successfully!") }}
                    </div>

                    <footer class="modal-footer">
                        <button 
                            type="button"
                            @click="showNewCredentialTypeModal = false"
                            class="a11y-btn a11y-btn-secondary"
                            :disabled="creatingCredentialType"
                        >
                            {{ $t("Cancel") }}
                        </button>
                        <button 
                            type="submit"
                            class="a11y-btn a11y-btn-primary"
                            :disabled="creatingCredentialType || credentialTypeSuccess"
                        >
                            <i v-if="creatingCredentialType" class="mdi mdi-loading mdi-spin" aria-hidden="true"></i>
                            <i v-else class="mdi mdi-certificate" aria-hidden="true"></i>
                            {{ creatingCredentialType ? $t("Creating...") : $t("Create credential type") }}
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
import { Request } from "@asanrom/request-browser";
import { ApiFiles } from "@/api/api-group-files";
import { ApiCredential } from "@/api/api-group-credential";
import { ApiService } from "@/api/api-group-service";
import { getUniqueStringId } from "@/utils/unique-id";
import { Timeouts } from "@/utils/timeout";

interface ServiceMetrics {
    users: number;
    credentials: number;
    tokensUsed: number;
}

interface ServiceAdmin {
    id: string;
    name: string;
    email: string;
}

interface ServiceToken {
    name: string;
    type: "uses" | "points";
}

interface Service {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    status: "active" | "inactive" | "maintenance";
    metrics: ServiceMetrics;
    admin: ServiceAdmin;
    requiredCredentials: string[];
    token: ServiceToken;
}

export default defineComponent({
    components: {},
    name: "ServiciosPage",
    data: function () {
        return {
            filters: {
                status: "",
                category: "",
                search: "",
            },
            showNewServiceModal: false,
            showNewCredentialTypeModal: false,
            showRequestServiceModal: false,
            selectedService: null as Service | null,
            newCredentialType: {
                name: "",
                description: "",
                serviceId: "",
            },
            credentialTypeRequestId: getUniqueStringId(),
            servicesListRequestId: getUniqueStringId(),
            creatingCredentialType: false,
            credentialTypeError: "",
            credentialTypeSuccess: false,
            availableServicesFromApi: [] as { id: string; name: string }[],
            loadingServicesForModal: false,
            serviceRequest: {
                document: null as File | null,
            },
            uploadRequestId: getUniqueStringId(),
            uploading: false,
            uploadError: "",
            uploadSuccess: false,
            newService: {
                name: "",
                category: "",
                description: "",
                adminId: "",
            },
            availableAdmins: [
                { id: "admin1", name: "María García", email: "m.garcia@ciudad.es" },
                { id: "admin2", name: "Carlos López", email: "c.lopez@ciudad.es" },
                { id: "admin3", name: "Ana Martínez", email: "a.martinez@ciudad.es" },
            ],
            services: [
                {
                    id: "srv-mobility-pmr",
                    name: "PMR Parking",
                    description: "Accessible parking management for people with reduced mobility. Allows use of reserved spaces with disability credential.",
                    icon: "mdi-car",
                    category: "mobility",
                    status: "active" as const,
                    metrics: {
                        users: 342,
                        credentials: 412,
                        tokensUsed: 2847,
                    },
                    admin: {
                        id: "admin1",
                        name: "María García",
                        email: "m.garcia@ciudad.es",
                    },
                    requiredCredentials: ["Disability Credential"],
                    token: {
                        name: "parking_pmr",
                        type: "uses" as const,
                    },
                },
                {
                    id: "srv-env-ecopuntos",
                    name: "EcoPoints Recycling",
                    description: "Rewards system for sustainable actions. Earn points for recycling at authorized points that can be redeemed for discounts.",
                    icon: "mdi-recycle",
                    category: "environment",
                    status: "active" as const,
                    metrics: {
                        users: 8456,
                        credentials: 8456,
                        tokensUsed: 156780,
                    },
                    admin: {
                        id: "admin2",
                        name: "Carlos López",
                        email: "c.lopez@ciudad.es",
                    },
                    requiredCredentials: ["Census Credential"],
                    token: {
                        name: "eco_puntos",
                        type: "points" as const,
                    },
                },
            ] as Service[],
        };
    },
    computed: {
        isAdmin(): boolean {
            return AuthController.Role === "admin" || AuthController.Role === "root";
        },
        filteredServices(): Service[] {
            return this.services.filter((service) => {
                if (this.filters.status && service.status !== this.filters.status) {
                    return false;
                }
                if (this.filters.category && service.category !== this.filters.category) {
                    return false;
                }
                if (this.filters.search) {
                    const search = this.filters.search.toLowerCase();
                    return (
                        service.name.toLowerCase().includes(search) ||
                        service.description.toLowerCase().includes(search)
                    );
                }
                return true;
            });
        },
    },
    methods: {
        formatNumber(num: number): string {
            return new Intl.NumberFormat("es-ES").format(num);
        },
        getStatusBadgeClass(status: string): string {
            const classes: Record<string, string> = {
                active: "a11y-badge-success",
                inactive: "a11y-badge-error",
                maintenance: "a11y-badge-warning",
            };
            return classes[status] || "a11y-badge-info";
        },
        getStatusLabel(status: string): string {
            const labels: Record<string, string> = {
                active: "Active",
                inactive: "Inactive",
                maintenance: "Maintenance",
            };
            return labels[status] || status;
        },
        isServiceAdmin(_serviceId: string): boolean {
            // TODO: Verificar si el usuario actual es admin de este servicio
            return false;
        },
        viewServiceDetails(service: Service) {
            // TODO: Navegar a la página de detalles del servicio
            console.log("View service:", service.id);
        },
        editService(service: Service) {
            // TODO: Abrir modal de edición
            console.log("Edit service:", service.id);
        },
        createService() {
            // TODO: Enviar al API para crear servicio
            console.log("Create service:", this.newService);
            this.showNewServiceModal = false;
            this.newService = {
                name: "",
                category: "",
                description: "",
                adminId: "",
            };
        },
        requestService(service: Service) {
            this.selectedService = service;
            this.serviceRequest = {
                document: null,
            };
            this.uploading = false;
            this.uploadError = "";
            this.uploadSuccess = false;
            this.showRequestServiceModal = true;
        },
        handleFileUpload(event: Event) {
            const target = event.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
                this.serviceRequest.document = target.files[0];
            }
        },
        submitServiceRequest() {
            if (!this.selectedService || !this.serviceRequest.document) return;
            
            this.uploading = true;
            this.uploadError = "";
            this.uploadSuccess = false;

            Request.Abort(this.uploadRequestId);

            Request.Pending(this.uploadRequestId, ApiFiles.PostFilesUpload({
                file: this.serviceRequest.document,
                bucket: `service-requests/${this.selectedService.id}`,
                isPublic: false,
            }))
                .onSuccess(() => {
                    this.uploading = false;
                    this.uploadSuccess = true;
                    
                    // Cerrar modal después de éxito
                    setTimeout(() => {
                        this.showRequestServiceModal = false;
                        this.selectedService = null;
                        this.uploadSuccess = false;
                    }, 1500);
                })
                .onRequestError((err, handleErr) => {
                    this.uploading = false;
                    handleErr(err, {
                        temporalError: () => {
                            this.uploadError = this.$t("Error uploading file. Please try again.");
                        },
                    });
                })
                .onUnexpectedError((err) => {
                    console.error(err);
                    this.uploading = false;
                    this.uploadError = this.$t("Unexpected error occurred.");
                });
        },
        closeRequestModal() {
            Request.Abort(this.uploadRequestId);
            this.showRequestServiceModal = false;
            this.selectedService = null;
            this.uploading = false;
            this.uploadError = "";
            this.uploadSuccess = false;
        },
        openNewCredentialTypeModal() {
            this.showNewCredentialTypeModal = true;
            this.loadServicesForCredentialType();
        },
        loadServicesForCredentialType() {
            this.loadingServicesForModal = true;
            
            Request.Abort(this.servicesListRequestId);
            
            Request.Pending(this.servicesListRequestId, ApiService.ListServices())
                .onSuccess((response) => {
                    this.loadingServicesForModal = false;
                    this.availableServicesFromApi = response.services.map(s => ({
                        id: s.id,
                        name: s.name
                    }));
                })
                .onRequestError((err, handleErr) => {
                    this.loadingServicesForModal = false;
                    handleErr(err, {
                        temporalError: () => {
                            console.error("Error loading services");
                        },
                    });
                })
                .onUnexpectedError((err) => {
                    console.error(err);
                    this.loadingServicesForModal = false;
                });
        },
        createCredentialType() {
            if (!this.newCredentialType.name) return;
            
            this.creatingCredentialType = true;
            this.credentialTypeError = "";
            this.credentialTypeSuccess = false;

            Request.Abort(this.credentialTypeRequestId);

            Request.Pending(this.credentialTypeRequestId, ApiCredential.CreateCredentialType({
                name: this.newCredentialType.name,
                description: this.newCredentialType.description,
                serviceId: this.newCredentialType.serviceId || undefined,
            }))
                .onSuccess((response) => {
                    this.creatingCredentialType = false;
                    this.credentialTypeSuccess = true;
                    console.log("Credential type created:", response);
                    
                    // Cerrar modal después de éxito
                    setTimeout(() => {
                        this.showNewCredentialTypeModal = false;
                        this.credentialTypeSuccess = false;
                        this.newCredentialType = {
                            name: "",
                            description: "",
                            serviceId: "",
                        };
                    }, 1500);
                })
                .onRequestError((err, handleErr) => {
                    this.creatingCredentialType = false;
                    handleErr(err, {
                        badRequest: () => {
                            this.credentialTypeError = this.$t("Invalid request. Please check the data entered.");
                        },
                        temporalError: () => {
                            this.credentialTypeError = this.$t("Error creating credential type. Please try again.");
                        },
                    });
                })
                .onUnexpectedError((err) => {
                    console.error(err);
                    this.creatingCredentialType = false;
                    this.credentialTypeError = this.$t("Unexpected error occurred.");
                });
        },
    },
    mounted: function () {
        // TODO: Cargar servicios desde el API
    },
    beforeUnmount: function () {
        Timeouts.Abort(this.uploadRequestId);
        Request.Abort(this.uploadRequestId);
        Request.Abort(this.credentialTypeRequestId);
        Request.Abort(this.servicesListRequestId);
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
    flex-wrap: wrap;
}

/* Filters */
.filters-section {
    padding: var(--a11y-spacing-lg);
}

.filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--a11y-spacing-md);
}

/* Services Grid */
.services-grid {
    gap: var(--a11y-spacing-lg);
}

/* Service Card */
.service-card {
    display: flex;
    flex-direction: column;
    position: relative;
}

.service-inactive {
    opacity: 0.7;
}

.service-header {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    margin-bottom: var(--a11y-spacing-md);
    padding-right: 5rem; /* Espacio para el badge */
}

.service-icon {
    font-size: 1.75rem;
    flex-shrink: 0;
    line-height: 1;
}

.service-title-group {
    flex: 1;
}

.service-title {
    font-size: var(--a11y-font-size-large);
    font-weight: 600;
    margin: 0;
}

/* Badge de estado en esquina superior derecha */
.service-title-group .a11y-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
}

.service-body {
    flex: 1;
}

.service-description {
    margin-bottom: var(--a11y-spacing-md);
}

/* Metrics */
.service-metrics {
    display: flex;
    gap: var(--a11y-spacing-lg);
    padding: var(--a11y-spacing-md);
    background-color: #f8f9fa;
    border-radius: var(--a11y-border-radius);
    margin-bottom: var(--a11y-spacing-md);
}

.metric {
    display: flex;
    flex-direction: column;
    text-align: center;
}

.metric-value {
    font-size: var(--a11y-font-size-large);
    font-weight: 700;
    color: var(--a11y-primary);
}

.metric-label {
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
}

/* Admin Info */
.service-admin,
.service-credentials,
.service-token {
    margin-bottom: var(--a11y-spacing-sm);
    font-size: var(--a11y-font-size-base);
}

.admin-label,
.credentials-label,
.token-label {
    font-weight: 600;
    margin-right: var(--a11y-spacing-xs);
}

.admin-email {
    display: block;
    margin-left: 0;
}

/* Credentials List */
.credentials-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--a11y-spacing-xs);
    list-style: none;
    padding: 0;
    margin: var(--a11y-spacing-xs) 0 0 0;
}

.credential-tag {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background-color: var(--a11y-info-bg);
    color: var(--a11y-info);
    border-radius: 9999px;
    font-size: var(--a11y-font-size-small);
}

/* Token Info */
.token-name {
    display: inline-flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
    font-weight: 500;
}

/* Footer */
.service-footer {
    display: flex;
    gap: var(--a11y-spacing-sm);
    padding-top: var(--a11y-spacing-md);
    margin-top: auto;
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

/* Request Service Modal */
.request-service-modal {
    max-width: 500px;
}

.selected-service-info {
    background-color: #f8f9fa;
    border-radius: var(--a11y-border-radius);
    padding: var(--a11y-spacing-md);
    margin-bottom: var(--a11y-spacing-lg);
}

.service-info-header {
    display: flex;
    align-items: flex-start;
    gap: var(--a11y-spacing-md);
}

.service-info-icon {
    font-size: 2rem;
    color: var(--a11y-primary);
    flex-shrink: 0;
}

.service-info-title {
    margin: 0 0 var(--a11y-spacing-xs) 0;
    font-size: var(--a11y-font-size-large);
}

.service-info-desc {
    margin: 0;
    font-size: var(--a11y-font-size-small);
}

/* File Upload Area */
.file-upload-area {
    position: relative;
    border: 2px dashed #ccc;
    border-radius: var(--a11y-border-radius);
    padding: var(--a11y-spacing-xl);
    text-align: center;
    transition: all 0.2s ease;
    cursor: pointer;
}

.file-upload-area:hover {
    border-color: var(--a11y-primary);
    background-color: rgba(var(--a11y-primary-rgb), 0.05);
}

.file-upload-area.has-file {
    border-color: var(--a11y-success);
    background-color: rgba(var(--a11y-success-rgb), 0.05);
}

.file-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
}

.file-upload-content {
    pointer-events: none;
}

.file-upload-icon {
    font-size: 3rem;
    color: var(--a11y-primary);
    margin-bottom: var(--a11y-spacing-sm);
}

.file-upload-text {
    margin: 0 0 var(--a11y-spacing-xs) 0;
    font-weight: 500;
}

.file-upload-text.file-selected {
    color: var(--a11y-success);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-xs);
}

.file-upload-hint {
    margin: 0;
    font-size: var(--a11y-font-size-small);
}

/* Upload Messages */
.upload-message {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-md);
    border-radius: var(--a11y-border-radius);
    margin-top: var(--a11y-spacing-md);
    font-weight: 500;
}

.upload-error {
    background-color: var(--a11y-error-bg, #fdecea);
    color: var(--a11y-error, #d32f2f);
    border: 1px solid var(--a11y-error, #d32f2f);
}

.upload-success {
    background-color: var(--a11y-success-bg, #e8f5e9);
    color: var(--a11y-success, #2e7d32);
    border: 1px solid var(--a11y-success, #2e7d32);
}

.upload-message i {
    font-size: 1.25rem;
}

/* Loading spinner */
.mdi-spin {
    animation: mdi-spin 1s infinite linear;
}

/* Select with loading indicator */
.select-with-loading {
    position: relative;
    display: flex;
    align-items: center;
}

.select-with-loading .a11y-select {
    flex: 1;
}

.select-with-loading .loading-indicator {
    position: absolute;
    right: 2.5rem;
    color: var(--a11y-primary);
    font-size: 1.25rem;
}

/* Disabled select styles */
.a11y-select:disabled {
    background-color: #f5f5f5;
    color: #999;
    cursor: not-allowed;
    opacity: 0.7;
    border-color: #ddd;
}

@keyframes mdi-spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

/* Responsive */
@media (max-width: 768px) {
    .miciudad-servicios {
        padding: var(--a11y-spacing-md);
    }
    
    .page-header {
        flex-direction: column;
    }
    
    .service-metrics {
        flex-direction: column;
        gap: var(--a11y-spacing-sm);
    }
    
    .service-footer {
        flex-direction: column;
    }
}
</style>

