<template>
    <div class="page-content" tabindex="-1">
        <ComponentLoader v-if="loading"></ComponentLoader>

        <div class="block-explorer-header">
            <h1>{{ $t("Account") }} #{{ address }}</h1>
            <button @click="goBack()" class="btn btn-primary btn-sm">{{ $t("Go Back") }}</button>
        </div>

        <div v-if="!loading && error" class="form-error">{{ error }}</div>

        <div v-if="!loading && !error">
            <div class="table-responsive">
                <table class="table">
                    <tbody>
                        <tr>
                            <th colspan="2" class="text-left">{{ $t("Summary") }}</th>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Balance") }}</td>
                            <td>{{ balance }} ETH</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Total Transactions") }}</td>
                            <td>{{ transactions }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Is Contract?") }}</td>
                            <td>{{ isContract ? $t("Yes") : $t("No") }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { ApiBlockExplorer } from "@/api/api-group-block-explorer";
import ComponentLoader from "@/components/utils/ComponentLoader.vue";
import { Timeouts } from "@/utils/timeout";
import { getUniqueStringId } from "@/utils/unique-id";
import { Request } from "@asanrom/request-browser";
import { defineComponent } from "vue";

export default defineComponent({
    components: {
        ComponentLoader,
    },
    name: "AccountPage",
    setup: function () {
        return {
            loadRequestId: getUniqueStringId(),
        };
    },
    data: function () {
        return {
            loading: true,
            error: "",

            address: (this.$route.params.address || "") + "",

            balance: 0,
            transactions: 0,
            isContract: false,
        };
    },
    methods: {
        load: function () {
            Timeouts.Abort(this.loadRequestId);
            Request.Abort(this.loadRequestId);

            this.loading = true;
            this.error = "";

            Request.Pending(this.loadRequestId, ApiBlockExplorer.GetAccount(this.address))
                .onSuccess((response) => {
                    this.loading = false;
                    this.balance = response.balance;
                    this.transactions = response.totalTransactions;
                    this.isContract = response.isContract;
                })
                .onRequestError((err, handleErr) => {
                    handleErr(err, {
                        unauthorized: () => {
                            this.$requireLogin();
                        },
                        badRequestInvalidWalletAddress: () => {
                            this.loading = false;
                            this.error = this.$t("Invalid wallet address");
                        },
                        badRequest: () => {
                            this.loading = false;
                            this.error = this.$t("Bad request");
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

        goBack: function () {
            this.$router.back();
        },
    },
    mounted: function () {
        this.load();
    },
    beforeUnmount: function () {
        Timeouts.Abort(this.loadRequestId);
        Request.Abort(this.loadRequestId);
    },
    watch: {
        $route: function () {
            const newAddress = (this.$route.params.address || "") + "";

            if (newAddress !== this.address) {
                this.address = newAddress;
                this.load();
            }
        },
    },
});
</script>

<style scoped>
.block-explorer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
</style>
