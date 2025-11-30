// Routes

"use strict";

import { createRouter, createWebHistory, Router, RouteRecordRaw } from "vue-router";
import { Timeouts } from "./utils/timeout";
import { AppEvents } from "./control/app-events";
import { AuthController } from "./control/auth";

// Router
// https://router.vuejs.org/guide/#javascript

// List of forbidden routes:
//
//    - /api/*  - This is reserved for the API
//    - /static/* - This is reserved for static assets
//    - /webhooks*/ - Reserved for webhooks

// Rutas publicas que no requieren autenticacion
const PUBLIC_ROUTES = [
    "login",
    "tfa-login",
    "signup",
    "signup-success",
    "forgot-password",
    "reset-password",
    "verify-email",
    "tp-login",
    "tp-signup",
    "about",
    "terms",
    "cookies",
    "privacy",
];

const routes: (RouteRecordRaw & {
    meta?: {
        /**
         * Set it to true for sticky sidebar
         */
        sidebarSticky?: boolean;
    };
})[] = [
        /* General / Home */

        {
            name: "home",
            path: "/",
            component: () => import("@/components/routes/HomePage.vue"),
            meta: {
                sidebarSticky: true,
            },
        },

        {
            name: "block-explorer",
            path: "/block-explorer",
            component: () => import("@/components/routes/BlockExplorerPage.vue"),
            meta: {
                sidebarSticky: true,
            },
        },

        {
            name: "block",
            path: "/block-explorer/block/:block",
            component: () => import("@/components/routes/explorer/BlockPage.vue"),
            meta: {
                sidebarSticky: true,
            },
        },

        {
            name: "transaction",
            path: "/block-explorer/transaction/:tx",
            component: () => import("@/components/routes/explorer/TransactionPage.vue"),
            meta: {
                sidebarSticky: true,
            },
        },

        {
            name: "account",
            path: "/block-explorer/account/:address",
            component: () => import("@/components/routes/explorer/AccountPage.vue"),
            meta: {
                sidebarSticky: true,
            },
        },

        {
            name: "about",
            path: "/about",
            component: () => import("@/components/routes/AboutPage.vue"),
            meta: {
                sidebarSticky: true,
            },
        },

        {
            name: "terms",
            path: "/terms",
            component: () => import("@/components/routes/TermsOfUsePage.vue"),
            meta: {
                sidebarSticky: true,
            },
        },

        {
            name: "cookies",
            path: "/cookies",
            component: () => import("@/components/routes/CookiePolicyPage.vue"),
            meta: {
                sidebarSticky: true,
            },
        },

        {
            name: "privacy",
            path: "/privacy",
            component: () => import("@/components/routes/PrivacyPolicyPage.vue"),
            meta: {
                sidebarSticky: true,
            },
        },

        /* Auth */

        {
            name: "login",
            path: "/login",
            component: () => import("@/components/routes/auth/LoginPage.vue"),
        },

        {
            name: "tfa-login",
            path: "/login/tfa",
            component: () => import("@/components/routes/auth/TwoFactorLoginPage.vue"),
        },

        {
            name: "signup",
            path: "/signup",
            component: () => import("@/components/routes/auth/SignupPage.vue"),
        },
        {
            name: "signup-success",
            path: "/signup/success",
            component: () => import("@/components/routes/auth/SignupSuccessPage.vue"),
        },

        {
            name: "forgot-password",
            path: "/password/forgot",
            component: () => import("@/components/routes/auth/ForgotPasswordPage.vue"),
        },
        {
            name: "reset-password",
            path: "/password/reset/:uid/:token",
            component: () => import("@/components/routes/auth/ResetPasswordPage.vue"),
        },

        {
            name: "verify-email",
            path: "/email/verify/:uid/:token",
            component: () => import("@/components/routes/auth/EmailVerifyPage.vue"),
        },

        {
            name: "tp-login",
            path: "/login/tp/:service",
            component: () => import("@/components/routes/auth/ThirdPartyLogin.vue"),
        },

        {
            name: "tp-signup",
            path: "/signup/tp",
            component: () => import("@/components/routes/auth/ThirdPartySignupPage.vue"),
        },

        /* Profile */

        {
            name: "profile",
            path: "/user/:username",
            component: () => import("@/components/routes/profile/ProfilePage.vue"),
        },

        /* Account */

        {
            name: "account-settings",
            path: "/account-settings",
            component: () => import("@/components/routes/account/AccountSettingsPage.vue"),
        },

        /* Wallet */

        {
            name: "wallet",
            path: "/wallet/:id",
            component: () => import("@/components/routes/wallet/WalletSettingsPage.vue"),
        },

        /* Crowdfunding */

        {
            name: "crowdfunding",
            path: "/crowdfunding",
            component: () => import("@/components/routes/crowdfunding/CrowdfundingPage.vue"),
            meta: {
                sidebarSticky: true,
                auth: true,
            },
        },
        {
            path: "/tokens",
            name: "tokens",
            component: () => import("@/components/routes/crowdfunding/MyTokensPage.vue"),
            meta: {
                title: "Crowdfunding Tokens",
                requiresAuth: true,
                sidebarSticky: true,
            }
        },
        {
            path: "/tokens/create",
            name: "tokens-create",
            component: () => import("@/components/routes/tokens/TokenCreationPage.vue"),
            meta: {
                title: "Create Token",
                requiresAuth: true,
                sidebarSticky: true,
            }
        },
        {
            path: "/tokens/manage",
            name: "tokens-manage",
            component: () => import("@/components/routes/tokens/TokenManagementPage.vue"),
            meta: {
                title: "Manage Tokens",
                requiresAuth: true,
                sidebarSticky: true,
            }
        },
        {
            path: "/tokens/transfer",
            name: "tokens-transfer",
            component: () => import("@/components/routes/tokens/TokenTransferPage.vue"),
            meta: {
                title: "Transfer Tokens",
                requiresAuth: true,
                sidebarSticky: true,
            }
        },
        {
            path: "/tokens/explorer",
            name: "tokens-explorer",
            component: () => import("@/components/routes/tokens/TokenExplorerPage.vue"),
            meta: {
                title: "Token Explorer",
                requiresAuth: false,
                sidebarSticky: true,
            }
        },

        /* BSV Storage */

        {
            name: "bsv-storage",
            path: "/storage",
            component: () => import("@/components/routes/storage/BsvStoragePage.vue"),
        },
        /* Sections - Admin */

        {
            name: "dashboard",
            path: "/dashboard",
            component: () => import("@/components/routes/HomePage.vue"),
            meta: {
                sidebarSticky: true,
            },
        },

        {
            name: "people",
            path: "/people",
            component: () => import("@/components/sections/PersonasPage.vue"),
            meta: {
                sidebarSticky: true,
            },
        },

        {
            name: "services",
            path: "/services",
            component: () => import("@/components/sections/ServiciosPage.vue"),
            meta: {
                sidebarSticky: true,
            },
        },

        {
            name: "activity",
            path: "/activity",
            component: () => import("@/components/sections/ActividadPage.vue"),
            meta: {
                sidebarSticky: true,
            },
        },

        {
            name: "permissions",
            path: "/permissions",
            component: () => import("@/components/sections/PermisosPage.vue"),
            meta: {
                sidebarSticky: true,
            },
        },

        /* Sections - Citizen */

        {
            name: "my-credentials",
            path: "/my-credentials",
            component: () => import("@/components/sections/citizen/MisCredencialesPage.vue"),
            meta: {
                sidebarSticky: true,
            },
        },

        {
            name: "my-activity",
            path: "/my-activity",
            component: () => import("@/components/sections/citizen/MiActividadPage.vue"),
            meta: {
                sidebarSticky: true,
            },
        },

        {
            name: "benefits",
            path: "/benefits",
            component: () => import("@/components/sections/BeneficiosPage.vue"),
            meta: {
                sidebarSticky: true,
            },
        },

        /* Admin */

        {
            name: "admin",
            path: "/admin",
            component: () => import("@/components/routes/admin/AdministrationPage.vue"),
        },

        {
            name: "admin-user",
            path: "/admin/users/:id",
            component: () => import("@/components/routes/admin/UserPage.vue"),
        },

        /* Default */

        {
            path: "/:catchAll(.*)",
            component: () => import("@/components/routes/NotFoundPage.vue"),
        },
    ];

export function makeApplicationRouter(): Router {
    const router = createRouter({
        // 4. Provide the history implementation to use. We are using the hash history for simplicity here.
        history: createWebHistory(),
        routes, // short for `routes: routes`
    });

    // Funcion para esperar a que se cargue la autenticacion
    const waitForAuthLoaded = (): Promise<void> => {
        return new Promise((resolve) => {
            if (AuthController.FirstTimeLoaded || !AuthController.Loading) {
                resolve();
                return;
            }
            
            const checkInterval = setInterval(() => {
                if (AuthController.FirstTimeLoaded || !AuthController.Loading) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 50);
            
            // Timeout de seguridad - max 5 segundos
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 5000);
        });
    };

    // Guard global: requiere autenticacion para todas las rutas excepto las publicas
    router.beforeEach(async (to, from, next) => {
        Timeouts.Set("router-load-state", 300, () => {
            AppEvents.Emit("router-load-state-change", true);
        });

        const routeName = to.name as string;
        const isPublicRoute = PUBLIC_ROUTES.includes(routeName);

        // Si es ruta publica, permitir acceso
        if (isPublicRoute) {
            next();
            return;
        }

        // Esperar a que se cargue el estado de autenticacion
        await waitForAuthLoaded();

        const isAuthenticated = AuthController.isAuthenticated();

        // Si no esta autenticado, redirigir a login
        if (!isAuthenticated) {
            // Guardar la ruta a la que intentaba ir
            AuthController.PageToGo = { name: routeName, params: to.params, query: to.query };
            next({ name: "login" });
            return;
        }

        // Usuario autenticado, permitir acceso
        next();
    });

    router.afterEach(() => {
        Timeouts.Abort("router-load-state");
        AppEvents.Emit("router-load-state-change", false);
    });

    return router;
}
