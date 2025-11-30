<template>
    <div class="modal-container modal-container-login modal-container-opaque no-transition" tabindex="-1" role="dialog">
        <form class="modal-dialog modal-md a11y-card login-form" role="document">
            <!-- Logo Section -->
            <div class="login-logo-section">
                <img src="@/assets/logo.png" alt="MiCiudadID" class="login-logo" />
            </div>

            <!-- Header -->
            <div class="modal-header login-header">
                <div class="modal-title no-close">{{ $t("Login") }}</div>
                <div class="login-header-actions">
                    <button 
                        type="button" 
                        class="modal-close-btn login-action-btn" 
                        :title="$t('Select your language')" 
                        @click="selectLanguage"
                        :aria-label="$t('Select your language')"
                    >
                        <i class="fas fa-language"></i>
                    </button>
                    <!-- <button 
                        type="button" 
                        class="modal-close-btn login-action-btn" 
                        :title="$t('Change theme')" 
                        @click="invertTheme"
                        :aria-label="$t('Change theme')"
                    >
                        <i v-if="theme === 'dark'" class="fas fa-sun"></i>
                        <i v-else class="fas fa-moon"></i>
                    </button> -->
                </div>
            </div>

            <!-- Body -->
            <div class="modal-body login-body">
                <div class="login-welcome">
                    <h2 class="login-subtitle">{{ $t("Welcome to MiCiudadID") }}</h2>
                    <p class="login-description">{{ $t("Access your digital identity and municipal services securely") }}</p>
                </div>

                <form @submit.prevent="submit" class="login-form-inputs">
                    <div class="form-group">
                        <label for="login-username" class="form-label">{{ $t("Username") }}</label>
                        <input
                            id="login-username"
                            v-model="username"
                            type="text"
                            class="form-control form-control-full-width"
                            :class="{ 'form-control-error': errorCredentials }"
                            :placeholder="$t('Enter your username')"
                            :disabled="busy"
                            autocomplete="username"
                            autofocus
                        />
                    </div>

                    <div class="form-group">
                        <label for="login-password" class="form-label">{{ $t("Password") }}</label>
                        <input
                            id="login-password"
                            v-model="password"
                            type="password"
                            class="form-control form-control-full-width"
                            :class="{ 'form-control-error': errorCredentials }"
                            :placeholder="$t('Enter your password')"
                            :disabled="busy"
                            autocomplete="current-password"
                        />
                    </div>

                    <div v-if="errorCredentials" class="form-error">
                        {{ errorCredentials }}
                    </div>

                    <button
                        type="submit"
                        class="btn btn-login"
                        :disabled="busy"
                    >
                        <i v-if="busy" class="fas fa-spinner fa-spin"></i>
                        <i v-else class="fas fa-sign-in-alt"></i>
                        <span v-if="!busy">{{ $t("Login") }}</span>
                        <span v-else>{{ $t("Logging in...") }}</span>
                    </button>
                </form>

                <!-- Error Message -->
                <div v-if="error" class="login-error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>{{ error }}</span>
                </div>

                <!-- Wallet Login Section -->
                <div class="wallet-login-section">
                    <WalletLoginButton />
                </div>
            </div>

            <!-- Footer -->
            <div class="modal-footer login-footer">
                <div class="login-footer-links">
                    <a 
                        class="login-footer-link" 
                        href="javascript:;" 
                        @click="openCookiesModal"
                    >
                        <i class="fas fa-cookie-bite"></i>
                        {{ $t("Change cookies preferences") }}
                    </a>
                </div>
            </div>
        </form>

        <ChangeLanguageModal v-if="displayLanguageModal" v-model:display="displayLanguageModal"></ChangeLanguageModal>
        <CookiesModal v-if="displayCookiesModal" v-model:display="displayCookiesModal"></CookiesModal>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import { AuthController } from "@/control/auth";
import { Request } from "@asanrom/request-browser";
import { ApiAuth } from "@/api/api-group-auth";
import { ColorThemeName, getTheme, setTheme } from "@/control/app-preferences";
import CookiesModal from "@/components/modals/CookiesModal.vue";
import ChangeLanguageModal from "@/components/modals/ChangeLanguageModal.vue";
import { getUniqueStringId } from "@/utils/unique-id";
import { Timeouts } from "@/utils/timeout";
import WalletLoginButton from "@/components/wallet/WalletLoginButton.vue";

export default defineComponent({
    components: {
        ChangeLanguageModal,
        CookiesModal,
        WalletLoginButton,
    },
    name: "LoginPage",
    setup: function () {
        return {
            requestId: getUniqueStringId(),
            tpLoadRequestId: getUniqueStringId(),
        };
    },
    data: function () {
        return {
            username: "",
            password: "",

            errorCredentials: "",

            remember: true,

            busy: false,
            error: "",

            theme: getTheme(),
            displayLanguageModal: false,

            displayCookiesModal: false,

            tpServices: [],
        };
    },
    methods: {
        loadTp: function () {
            Timeouts.Abort(this.tpLoadRequestId);

            Request.Pending(this.tpLoadRequestId, ApiAuth.ThirdPartyLoginDetails())
                .onSuccess((tpServices) => {
                    this.tpServices = tpServices;
                })
                .onRequestError((err, handleErr) => {
                    handleErr(err, {
                        temporalError: () => {
                            Timeouts.Set(this.tpLoadRequestId, 1500, this.loadTp.bind(this));
                        },
                    });
                })
                .onUnexpectedError(() => {
                    Timeouts.Set(this.tpLoadRequestId, 1500, this.loadTp.bind(this));
                });
        },

        submit: function (e: Event) {
            if (e) {
                e.preventDefault();
            }
            if (this.busy) {
                return;
            }
            this.busy = true;
            this.error = "";
            this.errorCredentials = "";
            this.$getCaptcha("login").then((captcha) => {
                Request.Pending(
                    this.requestId,
                    ApiAuth.Login({ username: this.username, password: this.password, captcha: captcha, remember: this.remember }),
                )
                    .onSuccess((response) => {
                        this.busy = false;
                        AuthController.SetSession(response.session_id);
                    })
                    .onCancel(() => {
                        this.busy = false;
                    })
                    .onRequestError((err, handleErr) => {
                        this.busy = false;
                        handleErr(err, {
                            badRequestCaptcha: () => {
                                this.error = this.$t("Please, prove you are not a robot by solving the captcha");
                            },
                            badRequestInvalidCredentials: () => {
                                this.errorCredentials = this.$t("Invalid username or password");
                            },
                            badRequest: () => {
                                this.errorCredentials = this.$t("Invalid username or password");
                            },
                            forbiddenCaptcha: () => {
                                this.error = this.$t("Please, prove you are not a robot by solving the captcha");
                            },
                            forbiddenInvalidCredentials: () => {
                                this.errorCredentials = this.$t("Invalid username or password");
                            },
                            forbiddenUserBanned: () => {
                                this.error = this.$t("The user you are trying to log into is banned from the platform");
                            },
                            forbidden: () => {
                                this.errorCredentials = this.$t("Invalid username or password");
                            },
                            serverError: () => {
                                this.error = this.$t("Internal server error");
                            },
                            networkError: () => {
                                this.error = this.$t("Could not connect to the server");
                            },
                        });
                    })
                    .onUnexpectedError((err) => {
                        this.error = err.message;
                        console.error(err);
                        this.busy = false;
                    });
            });
        },

        onAuthChanged: function () {
            if (AuthController.isAuthenticated()) {
                this.$goBackFromLogin();
            } else if (AuthController.isAskingForTwoFactor()) {
                this.$router.push({ name: "tfa-login" });
            }
        },

        invertTheme: function () {
            setTheme("light");
        },

        onThemeChanged: function (t: ColorThemeName) {
            this.theme = t;
        },

        selectLanguage: function () {
            this.displayLanguageModal = true;
        },

        openCookiesModal: function () {
            this.displayCookiesModal = true;
        },
    },
    mounted: function () {
        this.$listenOnAppEvent("auth-status-changed", this.onAuthChanged.bind(this));
        this.$listenOnAppEvent("theme-changed", this.onThemeChanged.bind(this));
        this.onAuthChanged();
        this.$autoFocus();
        this.loadTp();
    },
    beforeUnmount: function () {
        Request.Abort(this.requestId);
        Request.Abort(this.tpLoadRequestId);
        Timeouts.Abort(this.tpLoadRequestId);
    },
});
</script>

<style scoped>
/* Login Form Container */
.login-form {
    display: flex;
    flex-direction: column;
    max-width: 500px;
    margin: auto;
}

/* Logo Section */
.login-logo-section {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--mci-space-8, 2rem) var(--mci-space-6, 1.5rem) var(--mci-space-6, 1.5rem);
    margin-bottom: var(--mci-space-2, 0.5rem);
}

.login-logo {
    max-width: 200px;
    max-height: 120px;
    width: auto;
    height: auto;
    object-fit: contain;
}

/* Header */
.login-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--mci-space-4, 1rem) var(--mci-space-6, 1.5rem);
    border-bottom: 1px solid var(--theme-border-color, var(--mci-gray-200));
    margin-bottom: 0;
}

.login-header .modal-title {
    font-size: var(--mci-font-size-2xl, 1.75rem);
    font-weight: 600;
    color: var(--mci-primary-800, #004080);
    padding: 0;
}

.login-header-actions {
    display: flex;
    gap: var(--mci-space-2, 0.5rem);
}

.login-action-btn {
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--mci-radius-md, 6px);
    transition: all var(--mci-transition, 0.15s ease-in-out);
    color: var(--mci-gray-700, #4d4d4d);
}

.login-action-btn:hover {
    background-color: var(--mci-gray-100, #f2f2f2);
    color: var(--mci-primary-700, #004d99);
}

.login-action-btn:focus-visible {
    outline: var(--mci-focus-ring, 3px solid var(--mci-primary-500));
    outline-offset: var(--mci-focus-offset, 2px);
}

/* Body */
.login-body {
    padding: var(--mci-space-6, 1.5rem);
    display: flex;
    flex-direction: column;
    gap: var(--mci-space-5, 1.25rem);
}

.login-welcome {
    text-align: center;
    margin-bottom: var(--mci-space-2, 0.5rem);
}

.login-subtitle {
    font-size: var(--mci-font-size-xl, 1.5rem);
    font-weight: 600;
    color: var(--mci-gray-900, #1a1a1a);
    margin: 0 0 var(--mci-space-2, 0.5rem) 0;
    line-height: 1.4;
}

.login-description {
    font-size: var(--mci-font-size-base, 1.125rem);
    color: var(--mci-gray-600, #666666);
    margin: 0;
    line-height: 1.6;
}

/* Error Message */
.login-error-message {
    display: flex;
    align-items: center;
    gap: var(--mci-space-2, 0.5rem);
    padding: var(--mci-space-3, 0.75rem) var(--mci-space-4, 1rem);
    background-color: var(--mci-error-50, #fdf2f2);
    border: 1px solid var(--mci-error-100, #f8d7da);
    border-left: 4px solid var(--mci-error-600, #c82333);
    border-radius: var(--mci-radius-md, 6px);
    color: var(--mci-error-700, #a71d2a);
    font-size: var(--mci-font-size-sm, 1rem);
}

.login-error-message i {
    flex-shrink: 0;
    font-size: 1.125rem;
}

/* Wallet Login Section */
.wallet-login-section {
    margin: var(--mci-space-4, 1rem) 0;
}

/* Footer */
.login-footer {
    padding: var(--mci-space-4, 1rem) var(--mci-space-6, 1.5rem);
    border-top: 1px solid var(--theme-border-color, var(--mci-gray-200));
    margin-top: 0;
}

.login-footer-links {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--mci-space-4, 1rem);
}

.login-footer-link {
    display: inline-flex;
    align-items: center;
    gap: var(--mci-space-2, 0.5rem);
    color: var(--mci-gray-600, #666666);
    text-decoration: none;
    font-size: var(--mci-font-size-sm, 1rem);
    transition: color var(--mci-transition, 0.15s ease-in-out);
    padding: var(--mci-space-2, 0.5rem);
    border-radius: var(--mci-radius-sm, 4px);
}

.login-footer-link:hover {
    color: var(--mci-primary-700, #004d99);
    background-color: var(--mci-primary-50, #f0f6fc);
}

.login-footer-link:focus-visible {
    outline: var(--mci-focus-ring, 3px solid var(--mci-primary-500));
    outline-offset: var(--mci-focus-offset, 2px);
}

.login-footer-link i {
    font-size: 0.875rem;
}

/* Responsive Design */
@media (max-width: 600px) {
    .login-form {
        max-width: 100%;
    }

    .login-logo {
        max-width: 160px;
        max-height: 100px;
    }

    .login-header {
        padding: var(--mci-space-3, 0.75rem) var(--mci-space-4, 1rem);
    }

    .login-header .modal-title {
        font-size: var(--mci-font-size-xl, 1.5rem);
    }

    .login-body {
        padding: var(--mci-space-4, 1rem);
    }

    .login-subtitle {
        font-size: var(--mci-font-size-lg, 1.25rem);
    }

    .login-description {
        font-size: var(--mci-font-size-sm, 1rem);
    }

    .login-footer {
        padding: var(--mci-space-3, 0.75rem) var(--mci-space-4, 1rem);
    }
}

/* Login Form Inputs */
.login-form-inputs {
    display: flex;
    flex-direction: column;
    gap: var(--mci-space-4, 1rem);
}

.login-form-inputs .form-group {
    margin-bottom: 0;
}

.login-form-inputs .form-label {
    display: block;
    font-size: var(--mci-font-size-base, 1.125rem);
    font-weight: 500;
    color: var(--mci-gray-800, #333333);
    margin-bottom: var(--mci-space-2, 0.5rem);
}

.login-form-inputs .form-control {
    width: 100%;
    padding: var(--mci-space-3, 0.75rem) var(--mci-space-4, 1rem);
    font-size: var(--mci-font-size-base, 1.125rem);
    border: 2px solid var(--theme-border-color, var(--mci-gray-300));
    border-radius: var(--mci-radius-md, 6px);
    background-color: var(--input-bg-color, #ffffff);
    color: var(--text-color, #1a1a1a);
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.login-form-inputs .form-control:focus {
    outline: none;
    border-color: var(--mci-primary-500, #0066cc);
    box-shadow: 0 0 0 3px var(--mci-primary-100, rgba(0, 102, 204, 0.2));
}

.login-form-inputs .form-control::placeholder {
    color: var(--mci-gray-400, #999999);
}

.login-form-inputs .form-control:disabled {
    background-color: var(--mci-gray-100, #f5f5f5);
    cursor: not-allowed;
    opacity: 0.7;
}

.login-form-inputs .form-control-error {
    border-color: var(--mci-error-600, #c82333);
}

.login-form-inputs .form-control-error:focus {
    box-shadow: 0 0 0 3px var(--mci-error-100, rgba(200, 35, 51, 0.2));
}

.login-form-inputs .form-error {
    color: var(--mci-error-700, #a71d2a);
    font-size: var(--mci-font-size-sm, 1rem);
    margin-top: calc(var(--mci-space-2, 0.5rem) * -1);
}

.login-form-inputs .btn-login {
    margin-top: var(--mci-space-2, 0.5rem);
}

.login-form-inputs .btn-login i {
    margin-right: var(--mci-space-2, 0.5rem);
}
</style>
