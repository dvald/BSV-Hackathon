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
                    <i class="mdi mdi-car-multiple" aria-hidden="true"></i>
                    {{ $t("Mobility Services") }}
                </h1>
            <p class="a11y-text-secondary">
                {{ $t("Services related to urban mobility, accessible parking, public transport and sustainable movement in the city") }}
            </p>
            </div>
            <!-- Buy Credits Button (always visible) -->
            <div class="header-actions">
                <button 
                    @click="showBuyCreditsModal = true"
                    class="a11y-btn a11y-btn-primary a11y-btn-large"
                    :aria-label="$t('Buy service credits')"
                >
                    <i class="mdi mdi-ticket-confirmation" aria-hidden="true"></i>
                    {{ $t("Buy Credits") }}
                </button>
            </div>
        </header>

        <main id="main-content">
            <!-- Lista de servicios -->
            <section aria-labelledby="services-heading" class="a11y-mt-lg">
                <h2 id="services-heading" class="a11y-heading-2">
                    {{ $t("Available Mobility Services") }} ({{ filteredServices.length }})
                </h2>

                <div class="services-grid a11y-grid a11y-grid-2">
                    <!-- Servicio de Movilidad - Parking Familia Numerosa -->
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
                            v-if="isAdmin"
                            @click="editService(service)"
                            class="a11y-btn a11y-btn-primary"
                            >
                                {{ $t("Configure") }}
                            </button>
                            <!-- Ciudadano: Solicitar/Inscribirse -->
                            <template v-if="!isAdmin">
                                <!-- Special button for Family Parking - Loyalty System -->
                                <button 
                                    v-if="service.id === 'srv-mobility-familia'"
                                    @click="openPaymentModal(service)"
                                    class="a11y-btn a11y-btn-primary"
                                >
                                    <i class="mdi mdi-car-brake-parking" aria-hidden="true"></i>
                                    {{ $t("Reserve Space") }} ({{ service.price }} Pts)
                                </button>
                                <!-- Accessible Parking - Free Service -->
                                <button 
                                    v-else-if="service.id === 'srv-mobility-disability'"
                                    @click="openPaymentModal(service)"
                                    class="a11y-btn a11y-btn-primary"
                                >
                                    <i class="mdi mdi-wheelchair-accessibility" aria-hidden="true"></i>
                                    {{ $t("Get Free Pass") }}
                                </button>
                                <!-- Public Transport Pass -->
                                <button 
                                    v-else-if="service.id === 'srv-mobility-transport'"
                                    @click="openPaymentModal(service)"
                                    class="a11y-btn a11y-btn-primary"
                                >
                                    <i class="mdi mdi-bus" aria-hidden="true"></i>
                                    {{ $t("Buy Monthly Pass") }} ({{ service.price }} Pts)
                                </button>
                                <!-- Regular request button for other services -->
                                <button 
                                    v-else-if="!isEnrolled(service.id)"
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
                                :placeholder="$t('e.g., Family Parking')"
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
                        <!-- Tipo de credencial -->
                        <div class="a11y-form-group">
                            <label for="request-credential-type" class="a11y-label a11y-label-required">
                                {{ $t("Credential type") }}
                            </label>
                            <div class="credential-types-grid">
                                <label 
                                    v-for="credType in credentialTypes" 
                                    :key="credType.id"
                                    class="credential-type-option"
                                    :class="{ 'option-selected': serviceRequest.credentialType === credType.id }"
                                >
                                    <input 
                                        type="radio"
                                        :value="credType.id"
                                        v-model="serviceRequest.credentialType"
                                        class="a11y-visually-hidden"
                                        name="request-credential-type"
                                    />
                                    <i :class="'mdi ' + credType.icon + ' option-icon'" aria-hidden="true"></i>
                                    <div class="option-content">
                                        <span class="option-title">{{ $t(credType.name) }}</span>
                                        <span class="option-desc">{{ $t(credType.description) }}</span>
                                    </div>
                                    <span v-if="serviceRequest.credentialType === credType.id" class="option-check">
                                        <i class="mdi mdi-check-circle"></i>
                                    </span>
                                </label>
                            </div>
                        </div>

                        <!-- Campos dinámicos según tipo de credencial -->
                        <div v-if="serviceRequest.credentialType" class="credential-data-section">
                            <!-- Campos para Credencial de Discapacidad -->
                            <template v-if="serviceRequest.credentialType === 'disability'">
                                <div class="a11y-form-group">
                                    <label for="request-disability-grade" class="a11y-label a11y-label-required">
                                        {{ $t("Disability grade") }}
                                    </label>
                                    <select 
                                        id="request-disability-grade"
                                        v-model="serviceRequest.credentialData.disabilityGrade"
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
                                    <label for="request-mobility-reduced" class="a11y-label">
                                        {{ $t("Reduced mobility") }}
                                    </label>
                                    <div class="checkbox-wrapper">
                                        <input 
                                            id="request-mobility-reduced"
                                            type="checkbox"
                                            v-model="serviceRequest.credentialData.mobilityReduced"
                                        />
                                        <label for="request-mobility-reduced">
                                            {{ $t("Has officially recognized reduced mobility") }}
                                        </label>
                                    </div>
                                </div>

                                <div class="a11y-form-group">
                                    <label for="request-official-doc" class="a11y-label a11y-label-required">
                                        {{ $t("Official document number") }}
                                    </label>
                                    <input 
                                        id="request-official-doc"
                                        type="text"
                                        v-model="serviceRequest.credentialData.officialDocNumber"
                                        class="a11y-input"
                                        required
                                        :placeholder="$t('Certificate number from autonomous community')"
                                    />
                                </div>
                            </template>

                            <!-- Campos para Credencial de Empadronamiento -->
                            <template v-if="serviceRequest.credentialType === 'census'">
                                <div class="a11y-form-group">
                                    <label for="request-census-address" class="a11y-label a11y-label-required">
                                        {{ $t("Registered address") }}
                                    </label>
                                    <input 
                                        id="request-census-address"
                                        type="text"
                                        v-model="serviceRequest.credentialData.address"
                                        class="a11y-input"
                                        required
                                    />
                                </div>

                                <div class="a11y-form-group">
                                    <label for="request-census-since" class="a11y-label a11y-label-required">
                                        {{ $t("Registered since") }}
                                    </label>
                                    <input 
                                        id="request-census-since"
                                        type="date"
                                        v-model="serviceRequest.credentialData.censusSince"
                                        class="a11y-input"
                                        required
                                    />
                                </div>

                                <div class="a11y-form-group">
                                    <label for="request-census-district" class="a11y-label">
                                        {{ $t("District") }}
                                    </label>
                                    <select 
                                        id="request-census-district"
                                        v-model="serviceRequest.credentialData.district"
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
                        </div>

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
                                :disabled="!serviceRequest.credentialType || !serviceRequest.document || uploading || uploadSuccess"
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

        <!-- Service Payment Modal (Loyalty System) -->
        <ServicePaymentModal
            v-model:display="showPaymentModal"
            :service-name="selectedPaymentService?.name || 'Service'"
            :service-id="selectedPaymentService?.id || 'generic'"
            :service-icon="getServiceIcon(selectedPaymentService?.id)"
            :service-emoji="getServiceEmoji(selectedPaymentService?.id)"
            :service-action-title="getServiceActionTitle(selectedPaymentService?.id)"
            :service-button-text="getServiceButtonText(selectedPaymentService?.id)"
            :service-success-message="getServiceSuccessMessage(selectedPaymentService?.id)"
            :service-type="getServiceType(selectedPaymentService?.id)"
            :service-description="getServiceDescription(selectedPaymentService?.id)"
            :cost="selectedPaymentService?.price || 0"
            :reward="getServiceReward(selectedPaymentService?.id)"
            :current-balance="userServiceTokenBalance"
            :user-id="identityKey || ''"
            @payment-success="onPaymentSuccess"
        />

        <!-- Buy Credits Modal -->
        <BuyCreditsModal
            v-model:display="showBuyCreditsModal"
            :current-balance="serviceTokenBalance"
            @purchase-success="onCreditsPurchased"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from "vue";
import { AuthController } from "@/control/auth";
import { useWallet } from "@/composables/useWallet";
import { getApiUrl } from "@/api/utils";
import ServicePaymentModal from "@/components/modals/ServicePaymentModal.vue";
import BuyCreditsModal from "@/components/modals/BuyCreditsModal.vue";

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
    components: {
        ServicePaymentModal,
        BuyCreditsModal
    },
    name: "ServiciosDetallePage",
    setup() {
        // Wallet composable
        const { wallet, identityKey, isConnected, isConnecting, connect } = useWallet();

        // Payment Modal State (Loyalty System)
        const showPaymentModal = ref(false);
        const selectedPaymentService = ref<Service | null>(null);
        const userServiceTokenBalance = ref(0);
        
        // Estado del formulario
        const showNewServiceModal = ref(false);
        const showNewCredentialTypeModal = ref(false);
        const showRequestServiceModal = ref(false);
        const showBuyCreditsModal = ref(false);
        const selectedService = ref<Service | null>(null);
        const isCreating = ref(false);
        const currentStep = ref(0);
        const errorMessage = ref("");
        
        // Token balances for display
        const serviceTokenBalance = ref(0);
        
        const creationSteps = [
            "Preparing",
            "Creating token",
            "Confirming",
            "Finishing"
        ];

        // Estado para solicitud de servicio
        const serviceRequest = ref({
            credentialType: "",
            credentialData: {
                disabilityGrade: "",
                mobilityReduced: false,
                officialDocNumber: "",
                address: "",
                censusSince: "",
                district: "",
            },
            document: null as File | null,
        });

        const credentialTypes = ref([
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
        ]);

        const uploading = ref(false);
        const uploadError = ref("");
        const uploadSuccess = ref(false);

        const newCredentialType = ref({
            name: "",
            description: "",
        });

        const creatingCredentialType = ref(false);
        const credentialTypeError = ref("");
        const credentialTypeSuccess = ref(false);

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
                id: "srv-mobility-familia",
                name: "Large Family Parking",
                description: "Reserved parking for large families. Use your Family Card credential to access exclusive spaces with discounted rates.",
                icon: "mdi-human-male-child",
                category: "mobility",
                status: "active",
                metrics: {
                    users: 1256,
                    credentials: 1489,
                    tokensUsed: 8721,
                },
                admin: {
                    id: "admin1",
                    name: "María García",
                    email: "m.garcia@ciudad.es",
                },
                requiredCredentials: ["Large Family Credential"],
                token: {
                    name: "parking_familia",
                    symbol: "PARK",
                    type: "uses",
                },
                processingTime: "Immediate",
                price: 50,
                citizenBenefit: "Discounted access to reserved family parking spaces throughout the city",
            },
            {
                id: "srv-mobility-disability",
                name: "Accessible Parking",
                description: "Reserved parking spaces for people with disabilities. Present your Disability Credential for priority access to designated accessible parking areas.",
                icon: "mdi-wheelchair-accessibility",
                category: "mobility",
                status: "active",
                metrics: {
                    users: 892,
                    credentials: 1023,
                    tokensUsed: 5432,
                },
                admin: {
                    id: "admin1",
                    name: "María García",
                    email: "m.garcia@ciudad.es",
                },
                requiredCredentials: ["Disability Credential"],
                token: {
                    name: "parking_accessible",
                    symbol: "APARK",
                    type: "uses",
                },
                processingTime: "Immediate",
                price: 0,
                citizenBenefit: "Free access to reserved accessible parking spaces citywide",
            },
            {
                id: "srv-mobility-transport",
                name: "Public Transport Pass",
                description: "Digital transport card for buses, metro and trams. Load credits and enjoy seamless travel across the entire city transport network.",
                icon: "mdi-bus-multiple",
                category: "mobility",
                status: "active",
                metrics: {
                    users: 15678,
                    credentials: 18234,
                    tokensUsed: 234567,
                },
                admin: {
                    id: "admin2",
                    name: "Carlos López",
                    email: "c.lopez@ciudad.es",
                },
                requiredCredentials: ["Census Credential"],
                token: {
                    name: "transport_pass",
                    symbol: "TPASS",
                    type: "uses",
                },
                processingTime: "24h",
                price: 30,
                citizenBenefit: "Unlimited monthly travel with 20% discount on standard fares",
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
            selectedService.value = service;
            showRequestServiceModal.value = true;
        };

        // ==========================================
        // LOYALTY SYSTEM FUNCTIONS
        // ==========================================

        const loadUserBalance = async () => {
            if (!identityKey.value) return;
            
            try {
                const response = await fetch(getApiUrl('/api/v1/gamification/status'), {
                    headers: {
                        'x-bsv-identity-key': identityKey.value
                    },
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const data = await response.json();
                    userServiceTokenBalance.value = data.balances?.serviceToken || 0;
                    console.log('[ServiciosPage] User balance loaded:', userServiceTokenBalance.value);
                }
            } catch (error) {
                console.error('[ServiciosPage] Error loading balance:', error);
            }
        };

        const openPaymentModal = async (service: Service) => {
            console.log('[ServiciosPage] Opening payment modal for:', service.id);
            selectedPaymentService.value = service;
            
            // Load user balance before showing modal
            await loadUserBalance();
            
            showPaymentModal.value = true;
        };

        // Helper functions for dynamic modal props
        const getServiceIcon = (serviceId?: string): string => {
            const icons: Record<string, string> = {
                'srv-mobility-familia': 'mdi-human-male-child',
                'srv-mobility-disability': 'mdi-wheelchair-accessibility',
                'srv-mobility-transport': 'mdi-bus-multiple',
            };
            return icons[serviceId || ''] || 'mdi-ticket-confirmation';
        };

        const getServiceEmoji = (serviceId?: string): string => {
            const emojis: Record<string, string> = {
                'srv-mobility-familia': '👨‍👩‍👧‍👦',
                'srv-mobility-disability': '♿',
                'srv-mobility-transport': '🚌',
            };
            return emojis[serviceId || ''] || '🎫';
        };

        const getServiceActionTitle = (serviceId?: string): string => {
            const titles: Record<string, string> = {
                'srv-mobility-familia': 'Reserve Family Parking',
                'srv-mobility-disability': 'Get Free Accessible Parking Pass',
                'srv-mobility-transport': 'Buy Monthly Transport Pass',
            };
            return titles[serviceId || ''] || 'Get Service';
        };

        const getServiceButtonText = (serviceId?: string): string => {
            const texts: Record<string, string> = {
                'srv-mobility-familia': 'Reserve with my Tokens',
                'srv-mobility-disability': 'Activate Free Pass',
                'srv-mobility-transport': 'Purchase Monthly Pass',
            };
            return texts[serviceId || ''] || 'Use my Tokens';
        };

        const getServiceSuccessMessage = (serviceId?: string): string => {
            const messages: Record<string, string> = {
                'srv-mobility-familia': 'Family Space Reserved!',
                'srv-mobility-disability': 'Accessible Parking Pass Activated!',
                'srv-mobility-transport': 'Monthly Pass Purchased!',
            };
            return messages[serviceId || ''] || 'Service Obtained!';
        };

        const getServiceReward = (serviceId?: string): number => {
            const rewards: Record<string, number> = {
                'srv-mobility-familia': 10,
                'srv-mobility-disability': 2,  // Minimal points for free service
                'srv-mobility-transport': 15,
            };
            return rewards[serviceId || ''] || 10;
        };

        const getServiceType = (serviceId?: string): 'paid' | 'free' | 'subscription' => {
            const types: Record<string, 'paid' | 'free' | 'subscription'> = {
                'srv-mobility-familia': 'paid',
                'srv-mobility-disability': 'free',
                'srv-mobility-transport': 'subscription',
            };
            return types[serviceId || ''] || 'paid';
        };

        const getServiceDescription = (serviceId?: string): string => {
            const descriptions: Record<string, string> = {
                'srv-mobility-familia': 'Reserve parking spaces for large families with discounted rates.',
                'srv-mobility-disability': 'Free access to reserved accessible parking spaces throughout the city. Valid with your Disability Credential.',
                'srv-mobility-transport': 'Get unlimited access to buses, metro and trams for a full month with 20% discount on standard fares.',
            };
            return descriptions[serviceId || ''] || '';
        };

        const onPaymentSuccess = (data: any) => {
            console.log('[ServiciosPage] Payment successful:', data);
            // Update local balance
            userServiceTokenBalance.value = data.balances?.serviceToken || 0;
            serviceTokenBalance.value = data.balances?.serviceToken || 0;
            // Could add notification or update UI here
        };

        const onCreditsPurchased = (data: any) => {
            console.log('[ServiciosPage] Credits purchased:', data);
            // Update local balance
            serviceTokenBalance.value = data.balance || 0;
            userServiceTokenBalance.value = data.balance || 0;
        };

        // Load service token balance
        const loadServiceTokenBalance = async () => {
            if (!identityKey.value) return;
            try {
                const response = await fetch(getApiUrl('/api/v1/gamification/status'), {
                    headers: {
                        'x-bsv-identity-key': identityKey.value
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    serviceTokenBalance.value = data.balances?.serviceToken || 0;
                }
            } catch (error) {
                console.error('Error loading balance:', error);
            }
        };

        // Load balance when identity changes
        onMounted(() => {
            if (identityKey.value) {
                loadUserBalance();
                loadServiceTokenBalance();
            }
        });

        const closeRequestModal = () => {
            showRequestServiceModal.value = false;
            selectedService.value = null;
            uploading.value = false;
            uploadError.value = "";
            uploadSuccess.value = false;
        };

        const handleFileUpload = (event: Event) => {
            const target = event.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
                serviceRequest.value.document = target.files[0];
            }
        };

        const submitServiceRequest = () => {
            // TODO: Implementar envío de solicitud
            console.log("Submit service request:", serviceRequest.value);
        };

        const createCredentialType = () => {
            // TODO: Implementar creación de tipo de credencial
            console.log("Create credential type:", newCredentialType.value);
        };

        return {
            // State
            filters,
            showNewServiceModal,
            showNewCredentialTypeModal,
            showRequestServiceModal,
            showBuyCreditsModal,
            serviceTokenBalance,
            selectedService,
            newService,
            availableAdmins,
            services,
            isCreating,
            currentStep,
            creationSteps,
            errorMessage,
            serviceRequest,
            credentialTypes,
            uploading,
            uploadError,
            uploadSuccess,
            newCredentialType,
            creatingCredentialType,
            credentialTypeError,
            credentialTypeSuccess,
            
            // Payment Modal State (Loyalty System)
            showPaymentModal,
            selectedPaymentService,
            userServiceTokenBalance,
            
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
            closeRequestModal,
            handleFileUpload,
            submitServiceRequest,
            createCredentialType,
            
            // Loyalty System Methods
            openPaymentModal,
            onPaymentSuccess,
            onCreditsPurchased,
            loadUserBalance,
            loadServiceTokenBalance,
            
            // Service Modal Helpers
            getServiceIcon,
            getServiceEmoji,
            getServiceActionTitle,
            getServiceButtonText,
            getServiceSuccessMessage,
            getServiceReward,
            getServiceType,
            getServiceDescription,
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

