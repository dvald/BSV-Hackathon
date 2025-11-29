<template>
    <nav class="navigation-bar" role="navigation" aria-label="Menú Principal">
        <div class="nav-container" role="tablist">
            <RouterLink
                :to="{ name: 'dashboard' }"
                class="nav-item"
                role="tab"
                :aria-selected="$route.name === 'dashboard'"
                :aria-controls="'view-dashboard'"
                tabindex="0"
            >
                <i class="fas fa-th-large" aria-hidden="true"></i>
                <span>{{ $t("Control Panel") }}</span>
            </RouterLink>
            <RouterLink
                :to="{ name: 'services' }"
                class="nav-item"
                role="tab"
                :aria-selected="$route.name === 'services'"
                :aria-controls="'view-services'"
                tabindex="0"
            >
                <i class="fas fa-chart-line" aria-hidden="true"></i>
                <span>{{ $t("Services") }}</span>
            </RouterLink>
            <RouterLink
                :to="{ name: 'people' }"
                class="nav-item"
                role="tab"
                :aria-selected="$route.name === 'people'"
                :aria-controls="'view-people'"
                tabindex="0"
            >
                <i class="fas fa-users" aria-hidden="true"></i>
                <span>{{ $t("People") }}</span>
            </RouterLink>
            <RouterLink
                :to="{ name: 'management' }"
                class="nav-item"
                role="tab"
                :aria-selected="$route.name === 'management'"
                :aria-controls="'view-management'"
                tabindex="0"
            >
                <i class="fas fa-shield-alt" aria-hidden="true"></i>
                <span>{{ $t("Management") }}</span>
                <span v-if="pendingCredentials > 0" class="nav-badge" :aria-label="`${pendingCredentials} ${$t('pending notifications')}`">
                    {{ pendingCredentials }}
                </span>
            </RouterLink>
            <RouterLink
                :to="{ name: 'activity' }"
                class="nav-item"
                role="tab"
                :aria-selected="$route.name === 'activity'"
                :aria-controls="'view-activity'"
                tabindex="0"
            >
                <i class="fas fa-database" aria-hidden="true"></i>
                <span>{{ $t("Activity") }}</span>
            </RouterLink>
        </div>
    </nav>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { RouterLink } from "vue-router";

export default defineComponent({
    components: {
        RouterLink,
    },
    name: "NavigationBar",
    data: function () {
        return {
            pendingCredentials: 3, // Esto debería venir de un controlador o prop
        };
    },
    methods: {},
    mounted: function () {},
    beforeUnmount: function () {},
});
</script>

<style scoped>
.navigation-bar {
    position: fixed;
    top: 100px; /* Altura del top-bar actualizada */
    left: 0;
    width: 100%;
    background: white;
    border-bottom: 2px solid #e2e8f0; /* slate-200 */
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    z-index: 40;
    overflow-x: auto;
    padding: 0.5rem 1.5rem;
}

.nav-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: max-content;
    height: 64px;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: var(--lf-spacing-md);
    padding: var(--lf-spacing-md) var(--lf-spacing-xl);
    border-radius: var(--lf-border-radius-md);
    text-decoration: none;
    color: var(--lf-text-secondary);
    font-size: var(--lf-font-size-lg);
    font-weight: var(--lf-font-weight-bold);
    white-space: nowrap;
    transition: all var(--lf-transition-base);
    border: var(--lf-border-width) solid transparent;
    position: relative;
    min-height: var(--lf-clickable-min-size);
    line-height: var(--lf-line-height-normal);
}

.nav-item i {
    width: 1.5rem;
    height: 1.5rem;
    color: #64748b; /* slate-500 */
    font-size: 1.5rem;
}

.nav-item:hover {
    background: var(--lf-bg-hover);
    color: var(--lf-text-primary);
}

.nav-item:hover i {
    color: var(--lf-slate-600);
}

.nav-item:focus-visible {
    outline: var(--lf-focus-outline-width) solid var(--lf-focus-color) !important;
    outline-offset: var(--lf-focus-outline-offset) !important;
    background: var(--lf-bg-hover);
    text-decoration: underline;
    box-shadow: 0 0 0 var(--lf-focus-shadow-width) var(--lf-focus-shadow) !important;
}

.nav-item.router-link-active {
    background: var(--lf-blue-100);
    color: var(--lf-blue-900);
    border-color: var(--lf-blue-500);
    border-width: var(--lf-border-width);
}

.nav-item.router-link-active i {
    color: #1d4ed8; /* blue-700 */
}

.nav-badge {
    position: absolute;
    top: -0.25rem;
    right: -0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 1.75rem;
    min-width: 1.75rem;
    padding: 0 var(--lf-spacing-sm);
    background: var(--lf-orange-600);
    color: var(--lf-text-inverse);
    font-size: var(--lf-font-size-sm);
    font-weight: var(--lf-font-weight-bold);
    border-radius: var(--lf-border-radius-full);
    border: var(--lf-border-width) solid var(--lf-text-inverse);
    box-shadow: var(--lf-shadow-none);
}

.nav-sync-status {
    margin-left: auto;
    display: flex;
    align-items: center;
    padding: 0 1rem;
    border-left: 2px solid #cbd5e1; /* slate-300 */
}

.sync-badge {
    display: flex;
    align-items: center;
    gap: var(--lf-spacing-sm);
    background: var(--lf-emerald-100);
    padding: var(--lf-spacing-sm) var(--lf-spacing-lg);
    border-radius: var(--lf-border-radius-full);
    border: 1px solid var(--lf-emerald-300);
}

.sync-indicator {
    width: 0.75rem;
    height: 0.75rem;
    background: var(--lf-emerald-600);
    border-radius: 50%;
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.sync-text {
    font-size: var(--lf-font-size-sm);
    font-weight: var(--lf-font-weight-bold);
    color: var(--lf-emerald-900);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    line-height: var(--lf-line-height-normal);
}

/* Responsive */
@media (max-width: 768px) {
    .nav-sync-status {
        display: none;
    }
}
</style>

