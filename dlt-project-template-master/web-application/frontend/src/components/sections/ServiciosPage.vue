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
                <button 
                    @click="showNewCredentialTypeModal = true"
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

            <!-- Lista de categorías de servicios -->
            <section aria-labelledby="services-heading" class="a11y-mt-lg">
                <h2 id="services-heading" class="a11y-heading-2">
                    {{ $t("Municipal Services") }} ({{ filteredCategories.length }})
                </h2>

                <div class="services-grid a11y-grid a11y-grid-2">
                    <article 
                        v-for="category in filteredCategories" 
                        :key="category.id"
                        class="service-card a11y-card"
                        :class="{ 'service-inactive': category.status !== 'active' }"
                    >
                        <header class="service-header">
                            <i :class="'mdi ' + category.icon + ' category-icon'" aria-hidden="true"></i>
                            <div class="service-title-group">
                                <h3 class="service-title">{{ $t(category.name) }}</h3>
                                <span 
                                    class="a11y-badge" 
                                    :class="getStatusBadgeClass(category.status)"
                                >
                                    {{ $t(getStatusLabel(category.status)) }}
                                </span>
                            </div>
                        </header>

                        <div class="service-body">
                            <p class="service-description a11y-text">
                                {{ $t(category.description) }}
                            </p>

                            <!-- Estadísticas - Solo admin -->
                            <div v-if="isAdmin && category.metrics" class="service-metrics">
                                <div class="metric">
                                    <span class="metric-value">{{ formatNumber(category.metrics.users) }}</span>
                                    <span class="metric-label">{{ $t("Citizens") }}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-value">{{ formatNumber(category.metrics.credentials) }}</span>
                                    <span class="metric-label">{{ $t("Credentials") }}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-value">{{ formatNumber(category.metrics.tokensUsed) }}</span>
                                    <span class="metric-label">{{ $t("Tokens used") }}</span>
                                </div>
                            </div>

                            <!-- Info para ciudadano: número de servicios -->
                            <div v-if="!isAdmin" class="category-services-count">
                                <i class="mdi mdi-view-grid" aria-hidden="true"></i>
                                <span>{{ category.servicesCount }} {{ $t("services available") }}</span>
                            </div>

                            <!-- Administrador - Solo admin -->
                            <div v-if="isAdmin && category.admin" class="service-admin">
                                <span class="admin-label">{{ $t("Department head") }}:</span>
                                <span class="admin-name">{{ category.admin.name }}</span>
                                <span class="admin-email a11y-text-secondary">{{ category.admin.email }}</span>
                            </div>

                            <!-- Credenciales requeridas -->
                            <div class="service-credentials">
                                <span class="credentials-label">{{ $t("Required credentials") }}:</span>
                                <ul class="credentials-list" role="list">
                                    <li 
                                        v-for="cred in category.requiredCredentials" 
                                        :key="cred"
                                        class="credential-tag"
                                    >
                                        {{ $t(cred) }}
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <footer class="service-footer">
                            <!-- Admin: Configurar categoría -->
                            <button 
                                v-if="isAdmin"
                                @click="editService(category)"
                                class="a11y-btn a11y-btn-primary"
                            >
                                {{ $t("Configure") }}
                            </button>
                            <!-- Ciudadano: Solicitar credencial, Obtener QR y Acceder al portal -->
                            <template v-if="!isAdmin">
                                <button 
                                    @click="requestService(category)"
                                    class="a11y-btn a11y-btn-primary"
                                >
                                    <i class="mdi mdi-plus" aria-hidden="true"></i>
                                    {{ $t("Request") }}
                                </button>
                                <button 
                                    v-if="!canAccessService"
                                    @click="openCredentialQR(category)"
                                    class="a11y-btn a11y-btn-secondary"
                                    :title="hasApprovedCredentials ? $t('Get your credential QR code') : $t('No approved credentials available')"
                                >
                                    <i class="mdi mdi-qrcode" aria-hidden="true"></i>
                                    {{ $t("My Credential") }}
                                </button>
                               <button 
    @click="openAccessQR(category)"
    class="a11y-btn"
    :class="isCredentialVerified(category.id) ? 'a11y-btn-success' : 'a11y-btn-secondary'"
    :title="!isCredentialVerified(category.id) ? $t('Verify your credential to access services') : $t('Access services portal')"
>
    <i class="mdi" :class="isCredentialVerified(category.id) ? 'mdi-arrow-right-circle' : 'mdi-lock'" aria-hidden="true"></i>
    {{ $t("Access") }}
</button>
                            </template>
                        </footer>
                    </article>
                </div>

                <!-- Estado vacío -->
                <div 
                    v-if="filteredCategories.length === 0" 
                    class="empty-state a11y-card"
                    role="status"
                >
                    <i class="mdi mdi-magnify empty-icon" aria-hidden="true"></i>
                    <p class="empty-title">{{ $t("No services found") }}</p>
                    <p class="empty-desc a11y-text-secondary">
                        {{ $t("Try adjusting your filters") }}
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

        <!-- Modal para solicitar servicio -->
        <div 
            v-if="showRequestServiceModal && selectedService" 
            class="modal-overlay"
            @click.self="closeRequestModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-service-title"
        >
            <div class="modal-content a11y-card">
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
                
                <form @submit.prevent="submitServiceRequest" class="modal-body">
                    <!-- Información del servicio seleccionado -->
                    <fieldset class="form-fieldset" :disabled="uploading">
                        <legend class="form-legend">
                            {{ $t(selectedService.name) }}
                        </legend>
                        <p class="fieldset-description a11y-text-secondary">
                            {{ $t(selectedService.description) }}
                        </p>
                    </fieldset>

                    <!-- Tipo de credencial -->
                    <fieldset class="form-fieldset" :disabled="uploading">
                        <legend class="form-legend">
                            {{ $t("Credential type") }}
                        </legend>
                        
                        <div class="a11y-form-group">
                            <div class="credential-types-list">
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
                                        class="a11y-radio"
                                        name="request-credential-type"
                                        required
                                    />
                                    <i :class="'mdi ' + credType.icon" aria-hidden="true"></i>
                                    <span class="option-label">
                                        <strong>{{ $t(credType.name) }}</strong>
                                        <span class="a11y-text-secondary">{{ $t(credType.description) }}</span>
                                    </span>
                                </label>
                            </div>
                        </div>
                    </fieldset>

                    <!-- Campos dinámicos según tipo de credencial -->
                    <fieldset v-if="serviceRequest.credentialType" class="form-fieldset" :disabled="uploading">
                        <legend class="form-legend">
                            {{ $t("Credential data") }}
                        </legend>
                        
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
                    </fieldset>

                    <!-- Documento de identificación -->
                    <fieldset class="form-fieldset" :disabled="uploading">
                        <legend class="form-legend">
                            {{ $t("Documentation") }}
                        </legend>
                        
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
                            
                            <!-- Upload Result Info -->
                            <div v-if="uploadedFileData" class="upload-result-info">
                                <div class="result-row">
                                    <span class="result-label">{{ $t("Hash") }}:</span>
                                    <code class="result-value hash">{{ uploadedFileData.hash.substring(0, 20) }}...</code>
                                    <button type="button" class="btn-icon-small" @click="copyToClipboard(uploadedFileData.hash)" :title="$t('Copy Hash')">
                                        <i class="mdi mdi-fingerprint"></i>
                                    </button>
                                </div>
                                
                                <div class="result-row" v-if="txid">
                                    <span class="result-label">BSV TX:</span>
                                    <a :href="'https://whatsonchain.com/tx/' + txid" target="_blank" class="tx-link">
                                        <i class="mdi mdi-cube-outline"></i> {{ txid.substring(0, 8) }}...
                                    </a>
                                </div>
                                
                                <div class="result-row" v-if="uploadedFileData.url">
                                    <button type="button" class="btn-text-link" @click="openFile(uploadedFileData.url)">
                                        <i class="mdi mdi-open-in-new"></i> {{ $t("Open File") }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    <!-- Mensaje de error -->
                    <div v-if="uploadError" class="error-banner" role="alert">
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

        <!-- Modal para mostrar QR de credencial -->
        <div 
            v-if="showCredentialQRModal && selectedCategoryForQR" 
            class="modal-overlay"
            @click.self="closeCredentialQRModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="credential-qr-title"
        >
            <div class="modal-content a11y-card qr-modal">
                <header class="modal-header">
                    <h2 id="credential-qr-title" class="a11y-heading-2">
                        {{ $t("My Credential") }}
                    </h2>
                    <button 
                        @click="closeCredentialQRModal"
                        class="a11y-btn a11y-btn-icon"
                        :aria-label="$t('Close')"
                    >
                        ✕
                    </button>
                </header>
                
                <div class="modal-body qr-modal-body">
                    <!-- Información del servicio -->
                    <div class="qr-service-info">
                        <i :class="'mdi ' + selectedCategoryForQR.icon" aria-hidden="true"></i>
                        <div>
                            <h3>{{ $t(selectedCategoryForQR.name) }}</h3>
                            <p class="a11y-text-secondary">{{ $t(selectedCategoryForQR.description) }}</p>
                        </div>
                    </div>

                    <!-- QR Code -->
                    <div class="qr-code-container">
                        <div v-if="generatingQR" class="qr-loading">
                            <i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i>
                            <p>{{ $t("Generating credential...") }}</p>
                        </div>
                        <div v-else-if="credentialQRData" class="qr-code-wrapper">
                            <img 
                                :src="credentialQRData" 
                                :alt="$t('Credential QR Code')" 
                                class="qr-code-image"
                            />
                            <p class="qr-instruction">{{ $t("Show this QR code to verify your credential") }}</p>
                        </div>
                        <div v-else class="qr-error">
                            <i class="mdi mdi-alert-circle" aria-hidden="true"></i>
                            <p>{{ $t("Could not generate credential") }}</p>
                        </div>
                    </div>

                    <!-- Información de la credencial -->
                    <div class="credential-details">
                        <div class="credential-detail-item">
                            <span class="detail-label">{{ $t("Credential ID") }}:</span>
                            <span class="detail-value">{{ credentialId || '---' }}</span>
                        </div>
                        <div class="credential-detail-item">
                            <span class="detail-label">{{ $t("Valid until") }}:</span>
                            <span class="detail-value">{{ credentialExpiry || '---' }}</span>
                        </div>
                        <div class="credential-detail-item">
                            <span class="detail-label">{{ $t("Status") }}:</span>
                            <span class="a11y-badge a11y-badge-success">{{ $t("Active") }}</span>
                        </div>
                    </div>
                </div>

                <footer class="modal-footer">
                    <button 
                        @click="downloadCredentialQR"
                        class="a11y-btn a11y-btn-secondary"
                        :disabled="!credentialQRData"
                    >
                        <i class="mdi mdi-download" aria-hidden="true"></i>
                        {{ $t("Download QR") }}
                    </button>
                    <button 
                        @click="closeCredentialQRModal"
                        class="a11y-btn a11y-btn-primary"
                    >
                        {{ $t("Close") }}
                    </button>
                </footer>
            </div>
        </div>

        <!-- Modal para mostrar QR de Access -->
        <div 
            v-if="showAccessQRModal && selectedCategoryForAccess" 
            class="modal-overlay"
            @click.self="closeAccessQRModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="access-qr-title"
        >
            <div class="modal-content a11y-card qr-modal">
                <header class="modal-header">
                    <h2 id="access-qr-title" class="a11y-heading-2">
                        {{ $t("Access") }}
                    </h2>
                    <button 
                        @click="closeAccessQRModal"
                        class="a11y-btn a11y-btn-icon"
                        :aria-label="$t('Close')"
                    >
                        ✕
                    </button>
                </header>
                
                <div class="modal-body qr-modal-body">
                    <!-- Información del servicio -->
                    <div class="qr-service-info">
                        <i :class="'mdi ' + selectedCategoryForAccess.icon" aria-hidden="true"></i>
                        <div>
                            <h3>{{ $t(selectedCategoryForAccess.name) }}</h3>
                            <p class="a11y-text-secondary">{{ $t(selectedCategoryForAccess.description) }}</p>
                        </div>
                    </div>

                    <!-- QR Code -->
                    <div class="qr-code-container">
                        <div v-if="accessQRData" class="qr-code-wrapper">
                            <img 
                                :src="accessQRData" 
                                :alt="$t('Access QR Code')" 
                                class="qr-code-image"
                            />
                            <p class="qr-instruction">{{ $t("Scan this QR code to access the service") }}</p>
                        </div>
                    </div>
                </div>

                <footer class="modal-footer">
                    <button 
                        @click="closeAccessQRModal"
                        class="a11y-btn a11y-btn-primary"
                    >
                        {{ $t("Close") }}
                    </button>
                </footer>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { AuthController } from "@/control/auth";
import { useWallet } from "@/composables/useWallet";
import { getApiUrl } from "@/api/utils";
import { Request } from "@asanrom/request-browser";
import { ApiCredentials } from "@/api/api-group-credentials";
import { ApiFiles } from "@/api/api-group-files";
import { RequestCredentialRequest } from "@/api/definitions";

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

interface ServiceCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    status: "active" | "inactive" | "maintenance";
    servicesCount: number;
    disabled: boolean;
    requiredCredentials: string[];
    // Solo para admin
    metrics?: ServiceMetrics;
    admin?: ServiceAdmin;
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
        const router = useRouter();
        const canAccessService = ref(false);
        const txid = ref<string | null>(null);
        const uploadedFileData = ref<{
            hash: string;
            url: string;
            fileName: string;
        } | null>(null);

        // Wallet composable
        const { wallet, identityKey, isConnected, isConnecting, connect } = useWallet();
        
        // Estado del formulario
        const showNewServiceModal = ref(false);
        const showNewCredentialTypeModal = ref(false);
        const showRequestServiceModal = ref(false);
        const selectedService = ref<Service | null>(null);
        const isCreating = ref(false);
        const currentStep = ref(0);
        const errorMessage = ref("");
        
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

        // Estado para modal de QR de credencial
        const showCredentialQRModal = ref(false);
        const selectedCategoryForQR = ref<ServiceCategory | null>(null);
        const generatingQR = ref(false);
        const credentialQRData = ref<string | null>(null);
        const credentialId = ref<string | null>(null);
        const credentialExpiry = ref<string | null>(null);
        
        // Estado para modal de Access QR
        const showAccessQRModal = ref(false);
        const selectedCategoryForAccess = ref<ServiceCategory | null>(null);
        const accessQRData = ref<string | null>(null);
        
        // Estado para conteo de requests aprobados
        const approvedCount = ref(0);
        const loadingApprovedCount = ref(false);

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

        // Categorías de servicios municipales
        const serviceCategories = ref<ServiceCategory[]>([
            {
                id: "cat-mobility",
                name: "Mobility",
                description: "Services related to urban mobility, accessible parking, public transport and sustainable movement in the city.",
                icon: "mdi-wheelchair-accessibility",
                category: "mobility",
                status: "active",
                servicesCount: 3,
                requiredCredentials: ["Disability Credential", "Large Family Credential", "Census Credential"],
                disabled: false,
                metrics: {
                    users: 1250,
                    credentials: 1580,
                    tokensUsed: 12500,
                },
                admin: {
                    id: "admin1",
                    name: "María García",
                    email: "m.garcia@ciudad.es",
                },
            },
            {
                id: "cat-environment",
                name: "Environment",
                description: "Sustainability initiatives, recycling programs, green spaces and environmental actions with rewards for citizens.",
                icon: "mdi-leaf",
                category: "environment",
                status: "active",
                servicesCount: 4,
                requiredCredentials: ["Census Credential"],
                disabled: true,
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
            },
        ]);

        // Mantener services para compatibilidad con admin
        const services = ref<Service[]>([]);

        // Computed
        const isAdmin = computed(() => {
            return AuthController.Role === "admin" || AuthController.Role === "root";
        });

        const filteredCategories = computed(() => {
            return serviceCategories.value.filter((cat) => {
                if (filters.value.status && cat.status !== filters.value.status) {
                    return false;
                }
                if (filters.value.category && cat.category !== filters.value.category) {
                    return false;
                }
                if (filters.value.search) {
                    const search = filters.value.search.toLowerCase();
                    return (
                        cat.name.toLowerCase().includes(search) ||
                        cat.description.toLowerCase().includes(search)
                    );
                }
                return true;
            });
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

        const copyToClipboard = (text: string) => {
            navigator.clipboard.writeText(text);
        };

        const openFile = (url: string) => {
            window.open(url, '_blank');
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

        const viewServiceDetails = (service: any) => {
            console.log("View service:", service.id);
        };

        const editService = (service: any) => {
            console.log("Edit service:", service.id);
        };

        // Funciones para ciudadanos
        const enrolledServices = ref<string[]>([]);
        
        // Servicios con credencial verificada (tras escanear QR)
        const verifiedServices = ref<string[]>([]);

        const isEnrolled = (serviceId: string): boolean => {
            return enrolledServices.value.includes(serviceId);
        };
        
        const isCredentialVerified = (serviceId: string): boolean => {
            return verifiedServices.value.includes(serviceId);
        };
        
        const getCategoryLabel = (category: string): string => {
            const labels: Record<string, string> = {
                mobility: "Mobility",
                environment: "Environment",
                social: "Social Services",
                culture: "Culture",
            };
            return labels[category] || category;
        };
        
        const accessService = (service: any) => {
            if (!isCredentialVerified(service.id)) {
                return;
            }
            // Navegar a la página de detalle de servicios
            router.push({ name: 'services-details' });
        };

        const requestService = (service: any) => {
            // TODO: Implementar logica de solicitud de servicio
            console.log("Request service:", service.id);
            selectedService.value = service;
            showRequestServiceModal.value = true;
        };

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
            if (!selectedService.value || !serviceRequest.value.credentialType || !serviceRequest.value.document) {
                uploadError.value = "Por favor, complete todos los campos requeridos";
                return;
            }

            uploading.value = true;
            uploadError.value = "";
            uploadSuccess.value = false;

            // Paso 1: Subir el documento
            Request.Do(ApiFiles.PostFilesUpload({
                file: serviceRequest.value.document,
                bucket: "documents",
                isPublic: false,
            }))
                .onSuccess((uploadResult: any) => {
                    const documentId = uploadResult.documentId;

                    if (!documentId) {
                        uploading.value = false;
                        uploadError.value = "No se recibió el ID del documento";
                        return;
                    }

                    // Paso 2: Hacer la petición de credencial
                    const credentialRequest: RequestCredentialRequest = {
                        credentialId: serviceRequest.value.credentialType,
                        serviceId: selectedService.value.id,
                        documentId: documentId,
                    };

                    Request.Do(ApiCredentials.RequestCredential(credentialRequest))
                        .onSuccess((credentialResult: any) => {
                            txid.value = credentialResult.txid;
                            // Éxito
                            uploading.value = false;
                            uploadSuccess.value = true;
                            uploadError.value = "";
                            
                            console.log("Solicitud de credencial creada:", credentialResult);

                            // Cerrar el modal después de un breve delay
                            setTimeout(() => {
                                closeRequestModal();
                            }, 2000);
                        })
                        .onRequestError((err: any, handleErr: any) => {
                            uploading.value = false;
                            handleErr(err, {
                                badRequest: () => {
                                    uploadError.value = "Error en los datos de la solicitud";
                                },
                                serverError: () => {
                                    uploadError.value = "Error del servidor al procesar la solicitud";
                                },
                                temporalError: () => {
                                    uploadError.value = "Error temporal. Por favor, intente nuevamente";
                                },
                                networkError: () => {
                                    uploadError.value = "Error de conexión. Verifique su internet";
                                },
                            });
                        })
                        .onUnexpectedError((err) => {
                            console.error("Error inesperado al solicitar credencial:", err);
                            uploading.value = false;
                            uploadError.value = "Error inesperado al procesar la solicitud";
                        });
                })
                .onRequestError((err: any, handleErr: any) => {
                    uploading.value = false;
                    handleErr(err, {
                        serverError: () => {
                            uploadError.value = "Error del servidor al subir el documento";
                        },
                        temporalError: () => {
                            uploadError.value = "Error temporal al subir el documento. Por favor, intente nuevamente";
                        },
                        networkError: () => {
                            uploadError.value = "Error de conexión al subir el documento. Verifique su internet";
                        },
                    });
                })
                .onUnexpectedError((err) => {
                    console.error("Error inesperado al subir documento:", err);
                    uploading.value = false;
                    uploadError.value = "Error inesperado al subir el documento";
                });
        };

        const createCredentialType = () => {
            // TODO: Implementar creación de tipo de credencial
            console.log("Create credential type:", newCredentialType.value);
        };

        // Funciones para modal de QR de credencial
        const openCredentialQR = async (category: ServiceCategory) => {
            selectedCategoryForQR.value = category;
            showCredentialQRModal.value = true;
            generatingQR.value = true;
            credentialQRData.value = null;
            
            try {
                // Simular generación de QR
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Generar datos de credencial simulados
                const credId = `CRED-${category.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
                credentialId.value = credId;
                
                // Fecha de expiración (1 año desde ahora)
                const expiry = new Date();
                expiry.setFullYear(expiry.getFullYear() + 1);
                credentialExpiry.value = expiry.toLocaleDateString();
                
                // URL que irá codificada en el QR - apunta al endpoint de acceso
                const apiBaseUrl = getApiUrl('/credentials/access');
                const qrUrl = "http://localhost:3000/api/credentials"
                
                // Generar imagen QR usando API de qrserver.com
                credentialQRData.value = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`;
                
            } catch (error) {
                console.error("Error generating credential QR:", error);
                credentialQRData.value = null;
            } finally {
                generatingQR.value = false;
            }
        };

        const closeCredentialQRModal = () => {
            showCredentialQRModal.value = false;
            selectedCategoryForQR.value = null;
            credentialQRData.value = null;
            credentialId.value = null;
            credentialExpiry.value = null;
        };

        const downloadCredentialQR = () => {
            if (!credentialQRData.value) return;
            
            const link = document.createElement('a');
            link.href = credentialQRData.value;
            link.download = `credential-${selectedCategoryForQR.value?.id || 'qr'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        // Funciones para modal de Access QR
        const openAccessQR = (category: ServiceCategory) => {
            selectedCategoryForAccess.value = category;
            showAccessQRModal.value = true;
            
            // Generar QR con el link http://hola.com
            const qrUrl = "http://localhost:3000/api/presentation";
            accessQRData.value = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`;
            
            // Redirigir a /services-details después de 5 segundos
            setTimeout(() => {
                closeAccessQRModal();
                router.push({ name: 'services-details' });
            }, 8000);
        };

        const closeAccessQRModal = () => {
            showAccessQRModal.value = false;
            selectedCategoryForAccess.value = null;
            accessQRData.value = null;
        };

        // Función para cargar el conteo de requests aprobados
        const loadApprovedCount = () => {
            if (!AuthController.isAuthenticated()) {
                approvedCount.value = 0;
                return;
            }
            
            loadingApprovedCount.value = true;
            Request.Do(ApiCredentials.GetApprovedCount())
                .onSuccess((response) => {
                    approvedCount.value = response.count || 0;
                    loadingApprovedCount.value = false;
                })
                .onRequestError((err: any, handleErr: any) => {
                    handleErr(err, {
                        unauthorized: () => {
                            approvedCount.value = 0;
                            loadingApprovedCount.value = false;
                        },
                        serverError: () => {
                            console.error("Error al obtener conteo de requests aprobados");
                            approvedCount.value = 0;
                            loadingApprovedCount.value = false;
                        },
                        networkError: () => {
                            console.error("Error de red al obtener conteo de requests aprobados");
                            approvedCount.value = 0;
                            loadingApprovedCount.value = false;
                        },
                        temporalError: () => {
                            approvedCount.value = 0;
                            loadingApprovedCount.value = false;
                        },
                    });
                })
                .onUnexpectedError((err) => {
                    console.error("Error inesperado al obtener conteo:", err);
                    approvedCount.value = 0;
                    loadingApprovedCount.value = false;
                });
        };

        // Computed para saber si hay requests aprobados
        const hasApprovedCredentials = computed(() => {
            return approvedCount.value > 0;
        });

        const checkCredentialStatus = () => {
            Request.Do(ApiCredentials.CheckCredentialStatus())
                .onSuccess((response) => {
                    if(response.status === "ACTIVE") {
                        canAccessService.value = true;
                    } else {
                        canAccessService.value = false;
                    }
                })
                .onRequestError((err: any) => {
                    console.error("Error checking credential status:", err);
                });
        };

        // WebSocket connection para recibir eventos en tiempo real
        let websocket: WebSocket | null = null;

        const connectWebSocket = () => {
            if (!AuthController.isAuthenticated()) {
                return;
            }

            try {
                // Construir URL del WebSocket
                // El WebSocket está en /websocket según la configuración del backend
                const apiBaseUrl = getApiUrl('');
                const wsProtocol = apiBaseUrl.startsWith('https') ? 'wss' : 'ws';
                const wsHost = apiBaseUrl.replace(/^https?:\/\//, '').replace(/\/api\/v1.*$/, '');
                const wsUrl = `${wsProtocol}://${wsHost}/websocket`;
                
                console.log('[WebSocket] Conectando a:', wsUrl);
                websocket = new WebSocket(wsUrl);

                websocket.onopen = () => {
                    console.log('[WebSocket] Conectado');
                    // El backend obtendrá automáticamente el DID del usuario desde la sesión
                    // No necesitamos enviarlo manualmente
                };

                websocket.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        console.log('[WebSocket] Mensaje recibido:', message);

                        if (message.event === 'credential_status_updated') {
                            console.log('[WebSocket] Credencial actualizada:', message);
                            // Cerrar el modal del QR si está abierto
                            if (showCredentialQRModal.value) {
                                closeCredentialQRModal();
                            }
                            // Redirigir a ServiceDetailsPage si se indica en el mensaje
                            if (message.redirect && message.redirectTo === 'services-details') {
                                console.log('[WebSocket] Redirigiendo a ServiceDetailsPage');
                                router.push({ name: 'services-details' });
                            }
                        } else if (message.event === 'hello') {
                            console.log('[WebSocket] Servidor conectado');
                        }
                    } catch (error) {
                        console.error('[WebSocket] Error al parsear mensaje:', error);
                    }
                };

                websocket.onerror = (error) => {
                    console.error('[WebSocket] Error:', error);
                };

                websocket.onclose = () => {
                    console.log('[WebSocket] Desconectado');
                    // Intentar reconectar después de 5 segundos
                    setTimeout(() => {
                        if (AuthController.isAuthenticated()) {
                            connectWebSocket();
                        }
                    }, 5000);
                };

            } catch (error) {
                console.error('[WebSocket] Error al conectar:', error);
            }
        };

        const disconnectWebSocket = () => {
            if (websocket) {
                websocket.close();
                websocket = null;
            }
        };

        // Cargar el conteo cuando se monta el componente
        onMounted(() => {
            if (AuthController.isAuthenticated()) {
                loadApprovedCount();
                checkCredentialStatus();
                connectWebSocket();
            }
        });

        // Limpiar WebSocket al desmontar
        onUnmounted(() => {
            disconnectWebSocket();
        });

        return {
            // State
            filters,
            showNewServiceModal,
            showNewCredentialTypeModal,
            showRequestServiceModal,
            selectedService,
            newService,
            availableAdmins,
            services,
            serviceCategories,
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
            showCredentialQRModal,
            selectedCategoryForQR,
            generatingQR,
            credentialQRData,
            credentialId,
            credentialExpiry,
            approvedCount,
            hasApprovedCredentials,
            canAccessService,
            txid,
            uploadedFileData,
            showAccessQRModal,
            selectedCategoryForAccess,
            accessQRData,
            
            // Wallet
            wallet,
            identityKey,
            isConnected,
            isConnecting,
            
            // Computed
            isAdmin,
            filteredServices,
            filteredCategories,
            
            // Methods
            copyToClipboard,
            openFile,
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
            isCredentialVerified,
            getCategoryLabel,
            accessService,
            requestService,
            closeRequestModal,
            handleFileUpload,
            submitServiceRequest,
            createCredentialType,
            openCredentialQR,
            closeCredentialQRModal,
            downloadCredentialQR,
            openAccessQR,
            closeAccessQRModal,
        };
    },
});
</script>

<style scoped>

/* Spin animation for loading icons */
.mdi-spin {
    animation: mdi-spin 1s infinite linear;
}

@keyframes mdi-spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

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
.filters-section.a11y-card {
    padding: 0.75rem 1rem;
}

.filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
    align-items: flex-start;
    gap: var(--a11y-spacing-md);
    margin-bottom: var(--a11y-spacing-md);
    padding-right: 5rem; /* Espacio para el badge */
}

.category-icon {
    font-size: 2.5rem;
    color: var(--a11y-primary);
    flex-shrink: 0;
    line-height: 1;
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

/* Category Services Count */
.category-services-count {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-sm) var(--a11y-spacing-md);
    background-color: var(--a11y-info-bg, #e3f2fd);
    color: var(--a11y-info, #1976d2);
    border-radius: var(--a11y-border-radius);
    margin-bottom: var(--a11y-spacing-md);
    font-weight: 500;
}

.category-services-count i {
    font-size: 1.25rem;
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

/* Access Button States */
.a11y-btn-success {
    background-color: var(--a11y-success, #28a745);
    color: white;
    border-color: var(--a11y-success, #28a745);
}

.a11y-btn-success:hover:not(:disabled) {
    background-color: #218838;
    border-color: #1e7e34;
}

.service-footer .a11y-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.service-footer .a11y-btn .mdi-lock {
    font-size: 1rem;
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

/* Credential Types List - Request Service Modal */
.credential-types-list {
    display: flex;
    flex-direction: column;
    gap: var(--a11y-spacing-sm);
}

.credential-type-option {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-md);
    padding: var(--a11y-spacing-md);
    border: 2px solid #e0e0e0;
    border-radius: var(--a11y-border-radius);
    cursor: pointer;
    transition: all 0.2s ease;
}

.credential-type-option:hover {
    border-color: var(--a11y-primary);
    background-color: rgba(var(--a11y-primary-rgb, 0, 86, 179), 0.05);
}

.credential-type-option.option-selected {
    border-color: var(--a11y-primary);
    background-color: rgba(var(--a11y-primary-rgb, 0, 86, 179), 0.1);
}

.credential-type-option i {
    font-size: 1.5rem;
    color: var(--a11y-primary);
}

.credential-type-option .a11y-radio {
    flex-shrink: 0;
}

.option-label {
    display: flex;
    flex-direction: column;
    flex: 1;
}

.option-label strong {
    font-size: var(--a11y-font-size-base);
}

.option-label .a11y-text-secondary {
    font-size: var(--a11y-font-size-small);
}

/* File Upload Area */
.file-upload-area {
    position: relative;
    border: 2px dashed #ccc;
    border-radius: var(--a11y-border-radius);
    padding: var(--a11y-spacing-lg);
    text-align: center;
    transition: all 0.2s ease;
    cursor: pointer;
}

.file-upload-area:hover {
    border-color: var(--a11y-primary);
    background-color: rgba(var(--a11y-primary-rgb, 0, 86, 179), 0.05);
}

.file-upload-area.has-file {
    border-color: var(--a11y-success);
    border-style: solid;
    background-color: rgba(40, 167, 69, 0.05);
}

.file-upload-area .file-input {
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
    font-size: 2.5rem;
    color: #999;
    margin-bottom: var(--a11y-spacing-sm);
}

.file-upload-area:hover .file-upload-icon {
    color: var(--a11y-primary);
}

.file-upload-area.has-file .file-upload-icon {
    color: var(--a11y-success);
}

.file-upload-text {
    margin: 0;
    color: var(--a11y-primary);
    font-weight: 500;
}

.file-upload-text.file-selected {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--a11y-spacing-xs);
    color: var(--a11y-success);
}

.file-upload-hint {
    margin: var(--a11y-spacing-xs) 0 0 0;
    font-size: var(--a11y-font-size-small);
}

/* Upload Messages */
.upload-message {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-md);
    border-radius: var(--a11y-border-radius);
    margin-bottom: var(--a11y-spacing-md);
}

.upload-message.upload-success {
    background-color: #d4edda;
    border: 1px solid #28a745;
    color: #155724;
}

/* Checkbox wrapper */
.checkbox-wrapper {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-sm);
}

.checkbox-wrapper input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
}

.checkbox-wrapper label {
    margin: 0;
    cursor: pointer;
}

/* QR Modal */
.qr-modal {
    max-width: 480px;
}

.qr-modal-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--a11y-spacing-lg);
}

.qr-service-info {
    display: flex;
    align-items: center;
    gap: var(--a11y-spacing-md);
    width: 100%;
    padding: var(--a11y-spacing-md);
    background-color: var(--a11y-info-bg, #e3f2fd);
    border-radius: var(--a11y-border-radius);
}

.qr-service-info i {
    font-size: 2.5rem;
    color: var(--a11y-primary);
}

.qr-service-info h3 {
    margin: 0;
    font-size: var(--a11y-font-size-large);
}

.qr-service-info p {
    margin: 0.25rem 0 0 0;
    font-size: var(--a11y-font-size-small);
}

.qr-code-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 280px;
    width: 100%;
}

.qr-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    color: var(--a11y-text-secondary);
}

.qr-loading i {
    font-size: 3rem;
    color: var(--a11y-primary);
}

.qr-code-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--a11y-spacing-md);
}

.qr-code-image {
    width: 250px;
    height: 250px;
    padding: var(--a11y-spacing-md);
    background: white;
    border: 2px solid var(--a11y-primary);
    border-radius: var(--a11y-border-radius);
}

.qr-instruction {
    margin: 0;
    text-align: center;
    color: var(--a11y-text-secondary);
    font-size: var(--a11y-font-size-small);
}

.qr-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--a11y-spacing-sm);
    color: var(--a11y-error, #dc3545);
}

.qr-error i {
    font-size: 3rem;
}

.credential-details {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--a11y-spacing-sm);
    padding: var(--a11y-spacing-md);
    background-color: #f8f9fa;
    border-radius: var(--a11y-border-radius);
}

.credential-detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.detail-label {
    font-weight: 500;
    color: var(--a11y-text-secondary);
}

.detail-value {
    font-family: monospace;
    font-size: var(--a11y-font-size-small);
}
</style>

