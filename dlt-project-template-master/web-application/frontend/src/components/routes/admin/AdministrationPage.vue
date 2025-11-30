<template>
    <div class="page-content admin-page" tabindex="-1">
        <div class="admin-container">
            <h1 class="admin-title">{{ $t('Administration and moderation') }}</h1>
            <UsersPage></UsersPage>
        </div>
    </div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from "vue";

import { AuthController } from "@/control/auth";
import { HOME_ROUTE } from "@/app-events-plugin";
import ComponentLoader from "@/components/utils/ComponentLoader.vue";

const UsersPage = defineAsyncComponent({
    loader: () => import("./UsersPage.vue"),
    loadingComponent: ComponentLoader,
    delay: 1000,
});

const REQUIRED_PERMISSIONS = ["mod.users", "admin.roles"];

export default defineComponent({
    components: {
        UsersPage,
    },
    name: "AdministrationPage",
    data: function () {
        return {
            canUsers: AuthController.hasPermission("mod.users"),
            canRoles: AuthController.hasPermission("admin.roles"),
        };
    },
    methods: {
        checkPermission: function () {
            if (!AuthController.isAuthenticated()) {
                this.$requireLogin();
                return;
            }

            for (const p of REQUIRED_PERMISSIONS) {
                if (AuthController.hasPermission(p)) {
                    return;
                }
            }

            // Not enough permissions
            this.$showMessageModal(this.$t("Access denied"), this.$t("You lack the required permission to visit this page"));
            this.$router.push({ name: HOME_ROUTE });
        },

        onAuthChanged: function () {
            this.canUsers = AuthController.hasPermission("mod.users");
            this.canRoles = AuthController.hasPermission("admin.roles");
        },
    },
    mounted: function () {
        this.$setSubTitle(this.$t("Administration and moderation"));
        this.$listenOnAppEvent("auth-status-changed", this.onAuthChanged.bind(this));
        this.checkPermission();
    },
    beforeUnmount: function () {},
});
</script>

<style scoped>
.admin-page {
    padding: 1.5rem;
}

.admin-container {
    max-width: 1200px;
    margin: 0 auto;
}

.admin-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--mci-text-primary, #1a1a1a);
    margin-bottom: 1.5rem;
}
</style>
