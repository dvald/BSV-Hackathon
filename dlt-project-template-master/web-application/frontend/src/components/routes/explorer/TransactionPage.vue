<template>
    <div class="page-content" tabindex="-1">
        <ComponentLoader v-if="loading"></ComponentLoader>

        <div class="block-explorer-header">
            <h1>{{ $t("Transaction") }} #{{ tx }}</h1>
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
                            <td width="20%">{{ $t("Block Hash") }}</td>
                            <td>
                                <a @click="showBlock(info.blockHash)" href="javascript:;" type="button">{{ info.blockHash }}</a>
                            </td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Block Number") }}</td>
                            <td>
                                <a @click="showBlock(info.blockNumber)" href="javascript:;" type="button">{{ info.blockNumber }}</a>
                            </td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Chain ID") }}</td>
                            <td>{{ info.chainId }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("From") }}</td>
                            <td>
                                <a @click="showAccount(info.from)" href="javascript:;" type="button">{{ info.from }}</a>
                            </td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("To") }}</td>
                            <td>
                                <a @click="showAccount(info.to)" href="javascript:;" type="button">{{ info.to }}</a>
                            </td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Gas") }}</td>
                            <td>{{ info.gas }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Gas Price") }}</td>
                            <td>{{ info.gasPrice }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Max Priority Fee Per Gas") }}</td>
                            <td>{{ info.maxPriorityFeePerGas }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Max Fee Per Gas") }}</td>
                            <td>{{ info.maxFeePerGas }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Hash") }}</td>
                            <td>{{ info.hash }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Input") }}</td>
                            <td>{{ info.input }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Nonce") }}</td>
                            <td>{{ info.nonce }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Transaction Index") }}</td>
                            <td>{{ info.transactionIndex }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Type") }}</td>
                            <td>{{ info.type }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Value") }}</td>
                            <td>{{ info.value }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("yParity") }}</td>
                            <td>{{ info.yParity }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("V") }}</td>
                            <td>{{ info.v }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("R") }}</td>
                            <td>{{ info.r }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("S") }}</td>
                            <td>{{ info.s }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { ApiBlockExplorer } from "@/api/api-group-block-explorer";
import { TransactionInformation } from "@/api/definitions";
import ComponentLoader from "@/components/utils/ComponentLoader.vue";
import { Timeouts } from "@/utils/timeout";
import { getUniqueStringId } from "@/utils/unique-id";
import { Request } from "@asanrom/request-browser";
import { defineComponent } from "vue";

export default defineComponent({
    components: {
        ComponentLoader,
    },
    name: "TransactionPage",
    setup: function () {
        return {
            loadRequestId: getUniqueStringId(),
        };
    },
    data: function () {
        return {
            loading: true,
            error: "",

            tx: (this.$route.params.tx || "") + "",

            info: null as TransactionInformation,
        };
    },
    methods: {
        load: function () {
            Timeouts.Abort(this.loadRequestId);
            Request.Abort(this.loadRequestId);

            this.loading = true;
            this.error = "";

            Request.Pending(this.loadRequestId, ApiBlockExplorer.GetTransaction(this.tx))
                .onSuccess((response) => {
                    this.loading = false;
                    this.info = response;
                })
                .onRequestError((err, handleErr) => {
                    handleErr(err, {
                        unauthorized: () => {
                            this.$requireLogin();
                        },
                        notFoundTransactionNotFound: () => {
                            this.loading = false;
                            this.error = this.$t("Transaction not found");
                        },
                        notFound: () => {
                            this.loading = false;
                            this.error = this.$t("Not found");
                        },
                        badRequestInvalidTransaction: () => {
                            this.loading = false;
                            this.error = this.$t("Invalid transaction");
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

        showBlock: function (block: number | string) {
            this.$router.push({ name: "block", params: { block: block } });
        },

        showAccount: function (address: string) {
            this.$router.push({ name: "account", params: { address: address } });
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
            const newTx = (this.$route.params.tx || "") + "";

            if (newTx !== this.tx) {
                this.tx = newTx;
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
