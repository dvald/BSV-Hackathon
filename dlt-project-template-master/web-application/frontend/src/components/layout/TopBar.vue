<template>
    <div class="top-bar" tabindex="-1">
        <div class="top-bar-logo-td">
            <span class="top-bar-title">{{ platformName }}</span>
            <span class="top-bar-title-min">{{ platformName }}</span>
        </div>
        <nav class="top-bar-navigation" role="navigation" aria-label="Navegación principal">
            <RouterLink 
                :to="{name: 'people'}" 
                class="top-bar-nav-link"
                tabindex="0"
                aria-label="Ir a la sección de Personas"
            >
                {{ $t("People") }}
            </RouterLink>
            <RouterLink 
                :to="{name: 'services'}" 
                class="top-bar-nav-link"
                tabindex="0"
                aria-label="Ir a la sección de Servicios"
            >
                {{ $t("Services") }}
            </RouterLink>
            <RouterLink 
                :to="{name: 'activity'}" 
                class="top-bar-nav-link"
                tabindex="0"
                aria-label="Ir a la sección de Actividad"
            >
                {{ $t("Activity") }}
            </RouterLink>
            <RouterLink 
                :to="{name: 'permissions'}" 
                class="top-bar-nav-link"
                tabindex="0"
                aria-label="Ir a la sección de Permisos"
            >
                {{ $t("Permissions") }}
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
.top-bar-navigation {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1.5rem;
    flex: 1;
    justify-content: center;
    padding: 0 1rem;
}

.top-bar-nav-link {
    display: inline-block;
    padding: 0.75rem 1.25rem;
    text-decoration: none;
    color: var(--text-color);
    font-size: 1.25rem;
    font-weight: 500;
    border-radius: 4px;
    transition: background-color 0.2s ease, color 0.2s ease;
    cursor: pointer;
    outline: none;
    position: relative;
}

.top-bar-nav-link:visited {
    color: var(--text-color);
}

.top-bar-nav-link:hover {
    background-color: var(--hover-color);
    color: var(--text-color);
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

.top-bar-nav-link.router-link-active:hover {
    background-color: var(--selected-color);
    color: var(--bg-color);
}

.top-bar-nav-link.router-link-active:focus-visible {
    outline: 3px solid var(--primary-color);
    outline-offset: 2px;
    background-color: var(--selected-color);
}

/* Responsive: ocultar en pantallas pequeñas */
@media (max-width: 768px) {
    .top-bar-navigation {
        gap: 0.75rem;
        padding: 0 0.5rem;
    }
    
    .top-bar-nav-link {
        padding: 0.6rem 0.8rem;
        font-size: 1.1rem;
    }
}

@media (max-width: 600px) {
    .top-bar-navigation {
        display: none;
    }
}
</style>
