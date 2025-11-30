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
                    {{ isAdmin ? $t("Municipal Services") : $t("Available Services") }}
                </h1>
            <p class="a11y-text-secondary">
                {{ isAdmin ? $t("Departments and services that issue or verify credentials") : $t("Explore municipal services and request credentials") }}
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

                            <!-- Estadísticas del servicio - Solo admin -->
                            <div v-if="isAdmin" class="service-metrics">
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

                            <!-- Informacion para ciudadano -->
                            <div v-if="!isAdmin" class="service-citizen-info">
                                <div class="citizen-info-item">
                                    <i class="mdi mdi-clock-outline" aria-hidden="true"></i>
                                    <span>{{ $t("Processing time") }}: {{ service.processingTime || '24-48h' }}</span>
                                </div>
                                <div class="citizen-info-item">
                                    <i class="mdi mdi-currency-eur" aria-hidden="true"></i>
                                    <span>{{ service.price === 0 ? $t("Free") : service.price + ' EUR' }}</span>
                                </div>
                            </div>

                            <!-- Administrador del servicio - Solo admin -->
                            <div v-if="isAdmin" class="service-admin">
                                <span class="admin-label">{{ $t("Service administrator") }}:</span>
                                <span class="admin-name">{{ service.admin.name }}</span>
                                <span class="admin-email a11y-text-secondary">{{ service.admin.email }}</span>
                            </div>

                            <!-- Tipos de credenciales que acepta -->
                            <div class="service-credentials">
                                <span class="credentials-label">{{ isAdmin ? $t("Required credentials") : $t("You will need") }}:</span>
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

                            <!-- Token asociado - Solo admin -->
                            <div v-if="isAdmin" class="service-token">
                                <span class="token-label">{{ $t("Associated token") }}:</span>
                                <span class="token-name">
                                    <i class="mdi mdi-hand-coin" aria-hidden="true"></i>
                                    {{ service.token.name }}
                                </span>
                                <span class="token-type a11y-text-secondary">
                                    ({{ $t(service.token.type === 'uses' ? 'Uses' : 'Points') }})
                                </span>
                            </div>

                            <!-- Beneficio para ciudadano -->
                            <div v-if="!isAdmin && service.citizenBenefit" class="service-benefit">
                                <i class="mdi mdi-gift-outline" aria-hidden="true"></i>
                                <span>{{ $t(service.citizenBenefit) }}</span>
                            </div>
                        </div>
                        <footer class="service-footer">
                            <!-- Admin: Configurar servicio -->
                            <button 
                                v-if="isAdmin || isServiceAdmin(service.id)"
                                @click="editService(service)"
                                class="a11y-btn a11y-btn-primary"
                            >
                                {{ $t("Configure") }}
                            </button>
                            <!-- Ciudadano: Solicitar/Inscribirse -->
                            <template v-if="!isAdmin">
                                <button 
                                    v-if="!isEnrolled(service.id)"
                                    @click="requestService(service)"
                                    class="a11y-btn a11y-btn-primary"
                                >
                                    <i class="mdi mdi-plus" aria-hidden="true"></i>
                                    {{ $t("Request") }}
                                </button>
                                <button 
                                    v-else
                                    class="a11y-btn a11y-btn-secondary"
                                    disabled
                                >
                                    <i class="mdi mdi-check" aria-hidden="true"></i>
                                    {{ $t("Enrolled") }}
                                </button>
                            </template>
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

        <!-- Modal para nuevo servicio con Token BSV -->
        <div 
            v-if="showNewServiceModal" 
            class="modal-overlay"
            @click.self="closeModal"
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
                        @click="closeModal"
                        class="a11y-btn a11y-btn-icon"
                        :aria-label="$t('Close')"
                        :disabled="isCreating"
                    >
                        ✕
                    </button>
                </header>
                
                <form @submit.prevent="createService" class="modal-body">
                    <!-- Indicador de progreso -->
                    <div v-if="isCreating" class="creation-progress">
                        <div class="progress-steps">
                            <div 
                                v-for="(step, index) in creationSteps" 
                                :key="index"
                                class="progress-step"
                                :class="{ 
                                    'step-active': currentStep === index,
                                    'step-completed': currentStep > index,
                                    'step-pending': currentStep < index
                                }"
                            >
                                <div class="step-indicator">
                                    <i v-if="currentStep > index" class="mdi mdi-check" aria-hidden="true"></i>
                                    <span v-else>{{ index + 1 }}</span>
                                </div>
                                <span class="step-label">{{ $t(step) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Error message -->
                    <div v-if="errorMessage" class="error-banner" role="alert">
                        <i class="mdi mdi-alert-circle" aria-hidden="true"></i>
                        {{ errorMessage }}
                    </div>

                    <!-- Información del Servicio -->
                    <fieldset class="form-fieldset" :disabled="isCreating">
                        <legend class="form-legend">{{ $t("Service Information") }}</legend>
                        
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
                                :placeholder="$t('e.g., PMR Parking')"
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
                                :placeholder="$t('Describe the service for citizens...')"
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
                    </fieldset>

                    <!-- Información del Token BSV -->
                    <fieldset class="form-fieldset" :disabled="isCreating">
                        <legend class="form-legend">
                            <i class="mdi mdi-hand-coin" aria-hidden="true"></i>
                            {{ $t("Associated Token (BRC-92)") }}
                        </legend>
                        
                        <p class="fieldset-description a11y-text-secondary">
                            {{ $t("Each service has an associated token on BSV blockchain for tracking usage") }}
                        </p>

                        <div class="a11y-form-group">
                            <label for="token-name" class="a11y-label a11y-label-required">
                                {{ $t("Token Name") }}
                            </label>
                            <input 
                                id="token-name"
                                type="text"
                                v-model="newService.tokenName"
                                class="a11y-input"
                                required
                                :placeholder="$t('e.g., Parking Token')"
                            />
                        </div>

                        <div class="a11y-form-group">
                            <label for="token-symbol" class="a11y-label a11y-label-required">
                                {{ $t("Token Symbol") }}
                            </label>
                            <input 
                                id="token-symbol"
                                type="text"
                                v-model="newService.tokenSymbol"
                                class="a11y-input token-symbol-input"
                                required
                                maxlength="10"
                                :placeholder="$t('e.g., PARK')"
                            />
                            <p class="a11y-help-text">
                                {{ $t("Max 10 characters") }}
                            </p>
                        </div>
                    </fieldset>

                    <footer class="modal-footer">
                        <button 
                            type="button"
                            @click="closeModal"
                            class="a11y-btn a11y-btn-secondary"
                            :disabled="isCreating"
                        >
                            {{ $t("Cancel") }}
                        </button>
                        <button 
                            type="submit"
                            class="a11y-btn a11y-btn-primary"
                            :disabled="!isConnected || isCreating"
                        >
                            <i v-if="isCreating" class="mdi mdi-loading mdi-spin" aria-hidden="true"></i>
                            {{ isCreating ? $t("Creating...") : $t("Create service") }}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { AuthController } from "@/control/auth";
import { useWallet } from "@/composables/useWallet";
import { getApiUrl } from "@/api/utils";

// Configuración fija para tokens de servicios municipales
const TOKEN_FIXED_CONFIG = {
    decimals: 2,           // 2 decimales para permitir fracciones (ej: 0.50 usos)
    maxSupply: 1000000000, // 1 billón de tokens
};

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
    symbol: string;
    type: "uses" | "points";
    tokenId?: string;
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
    // Campos para vista de ciudadano
    processingTime?: string;
    price?: number;
    citizenBenefit?: string;
}

interface NewServiceForm {
    name: string;
    category: string;
    description: string;
    adminId: string;
    tokenName: string;
    tokenSymbol: string;
}

export default defineComponent({
    components: {},
    name: "ServiciosPage",
    setup() {
        // Wallet composable
        const { wallet, identityKey, isConnected, isConnecting, connect } = useWallet();
        
        // Estado del formulario
        const showNewServiceModal = ref(false);
        const isCreating = ref(false);
        const currentStep = ref(0);
        const errorMessage = ref("");
        
        const creationSteps = [
            "Preparing",
            "Creating token",
            "Confirming",
            "Finishing"
        ];

        const newService = ref<NewServiceForm>({
            name: "",
            category: "",
            description: "",
            adminId: "",
            tokenName: "",
            tokenSymbol: "",
        });

        const filters = ref({
            status: "",
            category: "",
            search: "",
        });

        const availableAdmins = ref([
            { id: "admin1", name: "María García", email: "m.garcia@ciudad.es" },
            { id: "admin2", name: "Carlos López", email: "c.lopez@ciudad.es" },
            { id: "admin3", name: "Ana Martínez", email: "a.martinez@ciudad.es" },
        ]);

        const services = ref<Service[]>([
            {
                id: "srv-mobility-pmr",
                name: "PMR Parking",
                description: "Accessible parking management for people with reduced mobility. Allows use of reserved spaces with disability credential.",
                icon: "mdi-car",
                category: "mobility",
                status: "active",
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
                    symbol: "PARK",
                    type: "uses",
                },
                processingTime: "Immediate",
                price: 0,
                citizenBenefit: "Free access to reserved PMR parking spaces throughout the city",
            },
            {
                id: "srv-env-ecopuntos",
                name: "EcoPoints Recycling",
                description: "Rewards system for sustainable actions. Earn points for recycling at authorized points that can be redeemed for discounts.",
                icon: "mdi-recycle",
                category: "environment",
                status: "active",
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
                    symbol: "ECO",
                    type: "points",
                },
                processingTime: "24-48h",
                price: 0,
                citizenBenefit: "Earn points redeemable for discounts at local shops and services",
            },
        ]);

        // Computed
        const isAdmin = computed(() => {
            return AuthController.Role === "admin" || AuthController.Role === "root";
        });

        const filteredServices = computed(() => {
            return services.value.filter((service) => {
                if (filters.value.status && service.status !== filters.value.status) {
                    return false;
                }
                if (filters.value.category && service.category !== filters.value.category) {
                    return false;
                }
                if (filters.value.search) {
                    const search = filters.value.search.toLowerCase();
                    return (
                        service.name.toLowerCase().includes(search) ||
                        service.description.toLowerCase().includes(search)
                    );
                }
                return true;
            });
        });

        // Methods
        const connectWallet = async () => {
            try {
                await connect();
            } catch (error) {
                console.error("Error connecting wallet:", error);
                errorMessage.value = "Error al conectar la wallet";
            }
        };

        const resetForm = () => {
            newService.value = {
                name: "",
                category: "",
                description: "",
                adminId: "",
                tokenName: "",
                tokenSymbol: "",
            };
            currentStep.value = 0;
            errorMessage.value = "";
        };

        const closeModal = () => {
            if (!isCreating.value) {
                showNewServiceModal.value = false;
                resetForm();
            }
        };

        const createService = async () => {
            isCreating.value = true;
            errorMessage.value = "";

            try {
                // Step 1: Preparar
                currentStep.value = 0;
                console.log("Step 1: Preparing token creation...");
                
                // Step 2: Crear token desde backend (el backend firma con su wallet)
                currentStep.value = 1;
                console.log("Step 2: Creating token from backend wallet...");
                
                const createResponse = await fetch(getApiUrl("/api/v1/tokens/create-service-token"), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include", // Para enviar cookies de sesión
                    body: JSON.stringify({
                        name: newService.value.tokenName,
                        symbol: newService.value.tokenSymbol.toUpperCase(),
                        decimals: TOKEN_FIXED_CONFIG.decimals,
                        maxSupply: TOKEN_FIXED_CONFIG.maxSupply,
                        metadata: {
                            description: newService.value.description,
                            serviceType: newService.value.category,
                            serviceName: newService.value.name,
                        }
                    })
                });

                if (!createResponse.ok) {
                    const errorData = await createResponse.json().catch(() => ({}));
                    throw new Error(errorData.message || "Error al crear el token");
                }

                // Step 3: Confirmar genesis
                currentStep.value = 2;
                console.log("Step 3: Token genesis confirmed by backend...");

                const { tokenId, txid } = await createResponse.json();
                console.log("Token created with ID:", tokenId, "txid:", txid);

                // Step 4: Crear servicio
                currentStep.value = 3;
                console.log("Step 4: Creating service...");

                // Por ahora, agregar a la lista local (TODO: llamar API de servicios)
                const selectedAdmin = availableAdmins.value.find(a => a.id === newService.value.adminId);
                const categoryIcons: Record<string, string> = {
                    mobility: "mdi-car",
                    environment: "mdi-recycle",
                    social: "mdi-account-group",
                    culture: "mdi-palette",
                };

                const newServiceData: Service = {
                    id: `srv-${Date.now()}`,
                    name: newService.value.name,
                    description: newService.value.description,
                    icon: categoryIcons[newService.value.category] || "mdi-domain",
                    category: newService.value.category,
                    status: "active",
                    metrics: {
                        users: 0,
                        credentials: 0,
                        tokensUsed: 0,
                    },
                    admin: selectedAdmin || {
                        id: newService.value.adminId,
                        name: "Admin",
                        email: "admin@ciudad.es",
                    },
                    requiredCredentials: ["Census Credential"],
                    token: {
                        name: newService.value.tokenName,
                        symbol: newService.value.tokenSymbol.toUpperCase(),
                        type: "uses",
                        tokenId: tokenId,
                    },
                };

                services.value.unshift(newServiceData);
                
                console.log("Service created successfully!");
                showNewServiceModal.value = false;
                resetForm();

            } catch (error: any) {
                console.error("Error creating service:", error);
                errorMessage.value = error.message || "Error al crear el servicio";
            } finally {
                isCreating.value = false;
            }
        };

        const formatNumber = (num: number): string => {
            return new Intl.NumberFormat("es-ES").format(num);
        };

        const getStatusBadgeClass = (status: string): string => {
            const classes: Record<string, string> = {
                active: "a11y-badge-success",
                inactive: "a11y-badge-error",
                maintenance: "a11y-badge-warning",
            };
            return classes[status] || "a11y-badge-info";
        };

        const getStatusLabel = (status: string): string => {
            const labels: Record<string, string> = {
                active: "Active",
                inactive: "Inactive",
                maintenance: "Maintenance",
            };
            return labels[status] || status;
        };

        const isServiceAdmin = (_serviceId: string): boolean => {
            return false;
        };

        const viewServiceDetails = (service: Service) => {
            console.log("View service:", service.id);
        };

        const editService = (service: Service) => {
            console.log("Edit service:", service.id);
        };

        // Funciones para ciudadanos
        const enrolledServices = ref<string[]>([]);

        const isEnrolled = (serviceId: string): boolean => {
            return enrolledServices.value.includes(serviceId);
        };

        const requestService = (service: Service) => {
            // TODO: Implementar logica de solicitud de servicio
            console.log("Request service:", service.id);
            // Por ahora, simular inscripcion
            enrolledServices.value.push(service.id);
        };

        return {
            // State
            filters,
            showNewServiceModal,
            newService,
            availableAdmins,
            services,
            isCreating,
            currentStep,
            creationSteps,
            errorMessage,
            
            // Wallet
            wallet,
            identityKey,
            isConnected,
            isConnecting,
            
            // Computed
            isAdmin,
            filteredServices,
            
            // Methods
            connectWallet,
            closeModal,
            createService,
            formatNumber,
            getStatusBadgeClass,
            getStatusLabel,
            isServiceAdmin,
            viewServiceDetails,
            editService,
            isEnrolled,
            requestService,
        };
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

.modal-content {
    width: 100%;
    max-width: 700px;
    max-height: calc(100% - var(--top-bar-size));
    margin-top: var(--top-bar-size);
    overflow-y: auto;
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

.modal-body {
    margin-bottom: 0;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--a11y-spacing-sm);
    padding-top: var(--a11y-spacing-md);
    border-top: 1px solid #e0e0e0;
}

/* Wallet Status */
.wallet-status {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-md);
    background-color: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: var(--a11y-border-radius);
    margin-bottom: var(--a11y-spacing-lg);
    color: #856404;
}

.wallet-status.wallet-connected {
    background-color: #d4edda;
    border-color: #28a745;
    color: #155724;
}

.wallet-status i {
    font-size: 1.25rem;
}

/* Creation Progress */
.creation-progress {
    margin-bottom: var(--a11y-spacing-lg);
}

.progress-steps {
    display: flex;
    justify-content: space-between;
}

.progress-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    position: relative;
}

.progress-step:not(:last-child)::after {
    content: "";
    position: absolute;
    top: 1rem;
    left: 50%;
    width: 100%;
    height: 2px;
    background-color: #e0e0e0;
}

.progress-step.step-completed:not(:last-child)::after {
    background-color: var(--a11y-success);
}

.step-indicator {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
    background-color: #e0e0e0;
    color: #666;
    position: relative;
    z-index: 1;
}

.step-active .step-indicator {
    background-color: var(--a11y-primary);
    color: white;
    animation: pulse 1.5s infinite;
}

.step-completed .step-indicator {
    background-color: var(--a11y-success);
    color: white;
}

.step-label {
    font-size: var(--a11y-font-size-small);
    margin-top: var(--a11y-spacing-xs);
    text-align: center;
    color: var(--a11y-text-secondary);
}

.step-active .step-label {
    color: var(--a11y-primary);
    font-weight: 600;
}

.step-completed .step-label {
    color: var(--a11y-success);
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

/* Error Banner */
.error-banner {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-md);
    background-color: var(--a11y-error-bg, #f8d7da);
    border: 1px solid var(--a11y-error, #dc3545);
    border-radius: var(--a11y-border-radius);
    margin-bottom: var(--a11y-spacing-lg);
    color: var(--a11y-error, #dc3545);
}

.error-banner i {
    font-size: 1.25rem;
}

/* Form Fieldset */
.form-fieldset {
    border: none;
    padding: 0;
}

.form-fieldset:disabled {
    opacity: 0.6;
}

.form-legend {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
    font-weight: 600;
    font-size: var(--a11y-font-size-large);
    padding: 0;
    margin-bottom: var(--a11y-spacing-md);
}

.fieldset-description {
    margin-top: 0;
    margin-bottom: var(--a11y-spacing-md);
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--a11y-spacing-md);
}

/* Token Config Info */
.token-config-info {
    display: flex;
    gap: var(--a11y-spacing-lg);
    padding: var(--a11y-spacing-md);
    background-color: #f8f9fa;
    border-radius: var(--a11y-border-radius);
    margin-top: var(--a11y-spacing-md);
}

.config-item {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
}

.config-label {
    font-weight: 600;
}

.config-value {
    font-family: monospace;
    background-color: #e9ecef;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
}

.config-hint {
    font-size: var(--a11y-font-size-small);
    color: var(--a11y-text-secondary);
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
    
    .progress-steps {
        flex-direction: column;
        gap: var(--a11y-spacing-md);
    }
    
    .progress-step:not(:last-child)::after {
        display: none;
    }
    
    .form-row {
        grid-template-columns: 1fr;
    }
    
    .token-config-info {
        flex-direction: column;
        gap: var(--a11y-spacing-sm);
    }
}

/* Estilos para vista de ciudadano */
.service-citizen-info {
    display: flex;
    flex-wrap: wrap;
    gap: var(--a11y-spacing-md);
    padding: var(--a11y-spacing-md);
    background-color: var(--mci-gray-100, #f8f9fa);
    border-radius: var(--a11y-border-radius);
    margin-bottom: var(--a11y-spacing-md);
}

.citizen-info-item {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-xs);
    font-size: var(--a11y-font-size-base);
}

.citizen-info-item i {
    color: var(--mci-primary, var(--a11y-primary));
}

.service-benefit {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-sm) var(--a11y-spacing-md);
    background-color: var(--mci-success-light, #d4edda);
    color: var(--mci-success-dark, #155724);
    border-radius: var(--a11y-border-radius);
    margin-top: var(--a11y-spacing-sm);
    font-size: var(--a11y-font-size-small);
}

.service-benefit i {
    font-size: 1.25rem;
}

/* Token symbol input */
.token-symbol-input {
    text-transform: uppercase;
}
</style>

