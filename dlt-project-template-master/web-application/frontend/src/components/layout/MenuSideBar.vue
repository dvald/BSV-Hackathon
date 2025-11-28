<template>
    <div class="side-bar" :class="{ hidden: !expanded }">
        <div class="side-bar-body">
            <router-link class="side-bar-option" :class="{ selected: page === 'home' }" :title="$t('Home')" :to="{ name: 'home' }">
                <div class="side-bar-option-icon"><i class="fas fa-home"></i></div>
                <div class="side-bar-option-text">{{ $t("Home") }}</div>
            </router-link>

            <router-link
                class="side-bar-option"
                :class="{ selected: page === 'block-explorer' }"
                :title="$t('Block Explorer')"
                :to="{ name: 'block-explorer' }"
            >
                <div class="side-bar-option-icon"><i class="fas fa-cube"></i></div>
                <div class="side-bar-option-text">{{ $t("Block Explorer") }}</div>
            </router-link>

            <router-link
                class="side-bar-option"
                :class="{ selected: page === 'crowdfunding' }"
                :title="$t('Crowdfunding')"
                :to="{ name: 'crowdfunding' }"
            >
                <div class="side-bar-option-icon"><i class="fas fa-hand-holding-dollar"></i></div>
                <div class="side-bar-option-text">{{ $t("Crowdfunding") }}</div>
            </router-link>

            <router-link
                class="side-bar-option"
                :class="{ selected: page === 'tokens' }"
                :title="$t('My Tokens')"
                :to="{ name: 'tokens' }"
            >
                <div class="side-bar-option-icon"><i class="fas fa-coins"></i></div>
                <div class="side-bar-option-text">{{ $t("My Tokens") }}</div>
            </router-link>

            <div class="side-bar-separator"></div>

            <router-link class="side-bar-option" :class="{ selected: page === 'about' }" :title="$t('About')" :to="{ name: 'about' }">
                <div class="side-bar-option-icon"><i class="fas fa-info"></i></div>
                <div class="side-bar-option-text">{{ $t("About") }}</div>
            </router-link>

            <router-link
                class="side-bar-option"
                :class="{ selected: page === 'terms' }"
                :title="$t('Terms of use')"
                :to="{ name: 'terms' }"
            >
                <div class="side-bar-option-icon"><i class="fas fa-scale-balanced"></i></div>
                <div class="side-bar-option-text">{{ $t("Terms of use") }}</div>
            </router-link>

            <router-link
                class="side-bar-option"
                :class="{ selected: page === 'cookies' }"
                :title="$t('Cookies policy')"
                :to="{ name: 'cookies' }"
            >
                <div class="side-bar-option-icon"><i class="fas fa-cookie-bite"></i></div>
                <div class="side-bar-option-text">{{ $t("Cookies policy") }}</div>
            </router-link>

            <router-link
                class="side-bar-option"
                :class="{ selected: page === 'privacy' }"
                :title="$t('Privacy policy')"
                :to="{ name: 'privacy' }"
            >
                <div class="side-bar-option-icon"><i class="fas fa-shield"></i></div>
                <div class="side-bar-option-text">{{ $t("Privacy policy") }}</div>
            </router-link>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useVModel } from "../../utils/v-model";

export default defineComponent({
    components: {},
    name: "MenuSideBar",
    emits: ["update:expanded"],
    props: {
        expanded: Boolean,
    },
    setup(props) {
        return {
            expandedStatus: useVModel(props, "expanded"),
        };
    },
    data: function () {
        return {
            page: "",
        };
    },
    methods: {
        updatePage: function () {
            this.page = this.$route ? (this.$route.name as string) : "";
        },

        onAuthChanged: function () {},
    },
    mounted: function () {
        this.updatePage();

        this.$listenOnAppEvent("auth-status-changed", this.onAuthChanged.bind(this));
    },
    watch: {
        $route: function () {
            this.updatePage();
        },
    },
});
</script>

<style></style>
