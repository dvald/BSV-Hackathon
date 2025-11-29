<template>
    <div class="top-bar" tabindex="-1">
        <div class="top-bar-logo-td">
            <RouterLink :to="{name: 'home'}" class="logo-link" aria-label="Ir al inicio - MiCiudadID">
                <i class="mdi mdi-city nav-icon logo-icon" aria-hidden="true"></i>
                <span class="top-bar-title">MiCiudadID</span>
                <span class="top-bar-title-min">MCI</span>
            </RouterLink>
        </div>
        <nav class="top-bar-navigation" role="navigation" aria-label="Navegación principal de administración">
            <RouterLink 
                :to="{name: 'home'}" 
                class="top-bar-nav-link"
                tabindex="0"
                aria-label="Ir al Panel de Control"
            >
                <i class="mdi mdi-view-dashboard nav-icon" aria-hidden="true"></i>
                <span class="nav-text">{{ $t("Dashboard") }}</span>
            </RouterLink>
            <RouterLink 
                :to="{name: 'services'}" 
                class="top-bar-nav-link"
                tabindex="0"
                aria-label="Ir a la sección de Servicios Municipales"
            >
                <i class="mdi mdi-domain nav-icon" aria-hidden="true"></i>
                <span class="nav-text">{{ $t("Services") }}</span>
            </RouterLink>
            <RouterLink 
                :to="{name: 'people'}" 
                class="top-bar-nav-link"
                tabindex="0"
                aria-label="Ir a la sección de Ciudadanos"
            >
                <i class="mdi mdi-account-group nav-icon" aria-hidden="true"></i>
                <span class="nav-text">{{ $t("Citizens") }}</span>
            </RouterLink>
            <RouterLink 
                :to="{name: 'permissions'}" 
                class="top-bar-nav-link"
                tabindex="0"
                aria-label="Ir a la sección de Gestión SSI - Credenciales"
            >
                <i class="mdi mdi-certificate nav-icon" aria-hidden="true"></i>
                <span class="nav-text">{{ $t("Credentials") }}</span>
            </RouterLink>
            <RouterLink 
                :to="{name: 'activity'}" 
                class="top-bar-nav-link"
                tabindex="0"
                aria-label="Ir a la sección de Actividad y Trazabilidad"
            >
                <i class="mdi mdi-clipboard-text-clock nav-icon" aria-hidden="true"></i>
                <span class="nav-text">{{ $t("Activity") }}</span>
            </RouterLink>
        </nav>

        <div class="top-bar-user-td" v-if="loggedIn">
            <span class="top-bar-hello-message">{{ $t("Hello, $USER!").replace("$USER", renderName(profileName)) }}</span>
            <button type="button" class="top-bar-button-img" :title="$t('User settings')" @click="openUserSettings">
                <img v-if="profileImage" class="btn-image" :src="profileImage" />
                <img v-else class="btn-image" src="@/assets/user.png" />
            </button>
        </div>

        <div class="top-bar-user-td" v-if="!loggedIn">
            <button type="button" class="top-bar-button" :title="$t('Select your language')" @click="selectLanguage">
                <i class="fas fa-language"></i>
            </button>
            <button type="button" class="top-bar-button" :title="$t('Change theme')" @click="invertTheme">
                <i v-if="theme === 'dark'" class="fas fa-sun"></i>
                <i v-else class="fas fa-moon"></i>
            </button>
            <button type="button" @click="login" class="btn btn-primary btn-top-bar-login">
                <i class="fas fa-sign-in"></i> {{ $t("Login") }}
            </button>
        </div>
    </div>
</template>

<script lang="ts">
import { ColorThemeName, getTheme, setTheme } from "@/control/app-preferences";
import { AuthController } from "@/control/auth";
import { defineComponent } from "vue";
import { RouterLink } from "vue-router";

export default defineComponent({
    components: {
        RouterLink,
    },
    name: "TopBar",
    emits: ["toggle-menu", "openModal"],
    data: function () {
        return {
            platformName: import.meta.env.VITE__PLATFORM_NAME || "Platform",
            loggedIn: AuthController.isAuthenticated(),
            profileImage: AuthController.ProfileImage,
            theme: getTheme(),
            profileName: AuthController.ProfileName || AuthController.Username || "",
        };
    },
    methods: {
        openUserSettings: function () {
            this.$emit("openModal", "account-settings");
        },

        selectLanguage: function () {
            this.$emit("openModal", "change-language-modal");
        },

        invertTheme: function () {
            setTheme(this.theme === "dark" ? "light" : "dark");
        },

        login: function () {
            this.$requireLogin();
        },

        clickMenu: function () {
            this.$emit("toggle-menu");
        },

        onAuthChanged: function () {
            this.loggedIn = AuthController.isAuthenticated();
            this.profileName = AuthController.ProfileName || AuthController.Username || "";
            this.profileImage = AuthController.ProfileImage;
        },

        onThemeChanged: function (t: ColorThemeName) {
            this.theme = t;
        },

        renderName: function (name: string): string {
            return ((name + "").split(" ")[0] + "").split(",")[0] || "???";
        },
    },
    mounted: function () {
        this.$listenOnAppEvent("auth-status-changed", this.onAuthChanged.bind(this));
        this.$listenOnAppEvent("theme-changed", this.onThemeChanged.bind(this));
    },
    beforeUnmount: function () {},
});
</script>

<style scoped>
/* Logo Link */
.logo-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: inherit;
}

.logo-link:hover {
    opacity: 0.9;
}

.logo-icon {
    font-size: 1.5rem;
}

/* Navigation */
.top-bar-navigation {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    justify-content: center;
    padding: 0 1rem;
}

.top-bar-nav-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    text-decoration: none;
    color: var(--text-color);
    font-size: 1rem;
    font-weight: 500;
    border-radius: 8px;
    transition: background-color 0.2s ease, color 0.2s ease, transform 0.1s ease;
    cursor: pointer;
    outline: none;
    position: relative;
    min-height: 44px; /* WCAG touch target */
}

.nav-icon {
    font-size: 1.25rem;
}

.nav-text {
    white-space: nowrap;
}

.top-bar-nav-link:visited {
    color: var(--text-color);
}

.top-bar-nav-link:hover {
    background-color: var(--hover-color);
    color: var(--text-color);
    transform: translateY(-1px);
}

/* Estilos de focus para accesibilidad - visible y claro */
.top-bar-nav-link:focus-visible {
    outline: 3px solid var(--primary-color);
    outline-offset: 2px;
    background-color: var(--hover-color);
    text-decoration: underline;
}

.top-bar-nav-link.router-link-active {
    background-color: var(--selected-color);
    color: var(--bg-color);
    font-weight: 600;
}

.top-bar-nav-link.router-link-active .nav-icon {
    transform: scale(1.1);
}

.top-bar-nav-link.router-link-active:hover {
    background-color: var(--selected-color);
    color: var(--bg-color);
    transform: none;
}

.top-bar-nav-link.router-link-active:focus-visible {
    outline: 3px solid var(--primary-color);
    outline-offset: 2px;
    background-color: var(--selected-color);
}

/* Responsive: ajustes para pantallas medianas */
@media (max-width: 1024px) {
    .top-bar-navigation {
        gap: 0.25rem;
        padding: 0 0.5rem;
    }
    
    .top-bar-nav-link {
        padding: 0.6rem 0.75rem;
        font-size: 0.9rem;
    }
    
    .nav-icon {
        font-size: 1.1rem;
    }
}

/* Responsive: pantallas pequeñas - mostrar solo iconos */
@media (max-width: 768px) {
    .top-bar-navigation {
        gap: 0.25rem;
        padding: 0 0.25rem;
    }
    
    .top-bar-nav-link {
        padding: 0.6rem;
        justify-content: center;
    }
    
    .nav-text {
        display: none;
    }
    
    .nav-icon {
        font-size: 1.25rem;
    }
    
    .logo-icon {
        font-size: 1.25rem;
    }
    
    .top-bar-title {
        font-size: 0.9rem !important;
    }
}

/* Responsive: pantallas muy pequeñas */
@media (max-width: 480px) {
    .top-bar-navigation {
        display: none;
    }
}
</style>
