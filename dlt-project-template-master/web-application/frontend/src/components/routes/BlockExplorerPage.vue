<template>
    <div class="page-content" tabindex="-1">
        <h1>{{ $t("Welcome to the Ethereum Block Explorer!") }}</h1>

        <ComponentLoader v-if="loading"></ComponentLoader>

        <div v-if="!loading">
            <div class="form-group">
                <input
                    class="form-control form-control-full-width"
                    v-model="q"
                    :placeholder="$t('Search by Address, Tx hash or Block')"
                    @keydown="onSearch"
                />
            </div>
            <div v-if="error" class="form-error">{{ error }}</div>

            <h2>{{ $t("Last Blocks") }}</h2>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th scope="col">{{ $t("Block") }}</th>
                            <th scope="col">{{ $t("Transactions") }}</th>
                            <th scope="col">{{ $t("Size") }}</th>
                            <th scope="col">{{ $t("Timestamp") }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="block in lastBlocks" :key="block.number">
                            <th scope="row">
                                <a @click="showBlock(block.number)" href="javascript:;" type="button">{{ block.number }}</a>
                            </th>
                            <td>{{ block.transactions }}</td>
                            <td>{{ block.size }} bytes</td>
                            <td>{{ renderDate(block.timestamp) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Request } from "@asanrom/request-browser";
import { ApiBlockExplorer } from "@/api/api-group-block-explorer";

import { Timeouts } from "@/utils/timeout";
import { getUniqueStringId } from "@/utils/unique-id";
import { renderDateAndTime } from "@/utils/time-utils";

import ComponentLoader from "@/components/utils/ComponentLoader.vue";

export default defineComponent({
    components: {
        ComponentLoader,
    },
    name: "BlockExplorerPage",
    setup: function () {
        return {
            loadRequestId: getUniqueStringId(),
        };
    },
    data: function () {
        return {
            loading: true,

            lastBlocks: [],

            q: "",
            busy: false,
            error: "",
        };
    },
    methods: {
        load: function () {
            Timeouts.Abort(this.loadRequestId);
            Request.Abort(this.loadRequestId);

            this.loading = true;

            Request.Pending(this.loadRequestId, ApiBlockExplorer.GetLastBlock())
                .onSuccess((blocks) => {
                    this.loading = false;
                    this.lastBlocks = blocks || [];
                })
                .onRequestError((err, handleErr) => {
                    handleErr(err, {
                        unauthorized: () => {
                            this.$requireLogin();
                        },
                        temporalError: () => {
                            Timeouts.Set(this.loadRequestId, 1500, this.load.bind(this));
                        },
                    });
                })
                .onUnexpectedError((err) => {
                    console.error(err);
                    Timeouts.Set(this.loadRequestId, 1500, this.load.bind(this));
                });
        },

        showBlock: function (block: number) {
            this.$router.push({ name: "block", params: { block: block } });
        },

        onSearch: function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                event.target.click();
                this.doSearch();
            }
        },

        doSearch: function () {
            if (this.busy || !this.q) {
                return;
            }

            this.busy = true;
            this.error = "";

            Request.Do(ApiBlockExplorer.Search({ q: this.q }))
                .onSuccess((response) => {
                    this.busy = false;
                    if (response.mode === "block") {
                        this.$router.push({ name: "block", params: { block: this.q } });
                    } else if (response.mode === "account") {
                        this.$router.push({ name: "account", params: { address: this.q } });
                    } else if (response.mode === "transaction") {
                        this.$router.push({ name: "transaction", params: { tx: this.q } });
                    }

                    this.q = "";
                })
                .onRequestError((err, handleErr) => {
                    this.busy = false;
                    this.q = "";
                    handleErr(err, {
                        unauthorized: () => {
                            this.$requireLogin();
                        },
                        badRequest: () => {
                            this.error = this.$t("Invalid query");
                        },
                        notFoundBlockNotFound: () => {
                            this.error = this.$t("Block not found");
                        },
                        notFoundTransactionNotFound: () => {
                            this.error = this.$t("Transaction not found");
                        },
                        notFound: () => {
                            this.error = this.$t("Not found");
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
                    console.error(err);
                    this.busy = false;
                    this.q = "";
                    this.error = err.message;
                });
        },

        renderDate: function (t: number): string {
            return renderDateAndTime(t, this.$t);
        },
    },
    mounted: function () {
        this.load();
    },
    beforeUnmount: function () {
        Timeouts.Abort(this.loadRequestId);
        Request.Abort(this.loadRequestId);
    },
});
</script>

<style></style>
