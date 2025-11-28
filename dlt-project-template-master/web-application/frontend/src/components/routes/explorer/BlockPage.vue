<template>
    <div class="page-content" tabindex="-1">
        <ComponentLoader v-if="loading"></ComponentLoader>

        <div class="block-explorer-header">
            <h1>{{ $t("Block") }} #{{ block }}</h1>
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
                            <td width="20%">{{ $t("Block Number") }}</td>
                            <td>
                                <a href="javascript:;" type="button">{{ info.number }}</a>
                            </td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Hash") }}</td>
                            <td>{{ info.hash }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Mix Hash") }}</td>
                            <td>{{ info.mixHash }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Parent Hash") }}</td>
                            <td>{{ info.parentHash }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Nonce") }}</td>
                            <td>{{ info.nonce }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("sha3Uncles") }}</td>
                            <td>{{ info.sha3Uncles }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Logs Bloom") }}</td>
                            <td>{{ info.logsBloom }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Transactions Root") }}</td>
                            <td>{{ info.transactionsRoot }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("State Root") }}</td>
                            <td>{{ info.stateRoot }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Receipts Root") }}</td>
                            <td>{{ info.receiptsRoot }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Miner") }}</td>
                            <td>{{ info.miner }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Difficulty") }}</td>
                            <td>{{ info.difficulty }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Total Difficulty") }}</td>
                            <td>{{ info.totalDifficulty }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Extra Data") }}</td>
                            <td>{{ info.extraData }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Size") }}</td>
                            <td>{{ info.size }} bytes</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Gas Limit") }}</td>
                            <td>{{ info.gasLimit }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Gas Used") }}</td>
                            <td>{{ info.gasUsed }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Base Fee Per Gas") }}</td>
                            <td>{{ info.baseFeePerGas }}</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Timestamp") }}</td>
                            <td>{{ info.timestamp }} ({{ renderDate(info.timestamp) }})</td>
                        </tr>
                        <tr>
                            <td width="20%">{{ $t("Transactions") }}</td>
                            <td>
                                <p v-for="tx of info.transactions" :key="tx">
                                    <a @click="showTransaction(tx)" href="javascript:;" type="button">{{ tx }}</a>
                                </p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { ApiBlockExplorer } from "@/api/api-group-block-explorer";
import { BlockInformation } from "@/api/definitions";
import ComponentLoader from "@/components/utils/ComponentLoader.vue";
import { renderDateAndTime } from "@/utils/time-utils";
import { Timeouts } from "@/utils/timeout";
import { getUniqueStringId } from "@/utils/unique-id";
import { Request } from "@asanrom/request-browser";
import { defineComponent } from "vue";

export default defineComponent({
    components: {
        ComponentLoader,
    },
    name: "BlockPage",
    setup: function () {
        return {
            loadRequestId: getUniqueStringId(),
        };
    },
    data: function () {
        return {
            loading: true,
            error: "",

            block: (this.$route.params.block || "") + "",

            info: null as BlockInformation,
        };
    },
    methods: {
        load: function () {
            Timeouts.Abort(this.loadRequestId);
            Request.Abort(this.loadRequestId);

            this.loading = true;
            this.error = "";

            Request.Pending(this.loadRequestId, ApiBlockExplorer.GetBlock(this.block))
                .onSuccess((response) => {
                    this.loading = false;
                    this.info = response;
                })
                .onRequestError((err, handleErr) => {
                    handleErr(err, {
                        unauthorized: () => {
                            this.$requireLogin();
                        },
                        notFoundBlockNotFound: () => {
                            this.loading = false;
                            this.error = this.$t("Block not found");
                        },
                        notFound: () => {
                            this.loading = false;
                            this.error = this.$t("Not found");
                        },
                        badRequestInvalidBlock: () => {
                            this.loading = false;
                            this.error = this.$t("Invalid block");
                        },
                        badRequestInvalidBlockHash: () => {
                            this.loading = false;
                            this.error = this.$t("Invalid block hash");
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

        showTransaction: function (tx: string) {
            this.$router.push({ name: "transaction", params: { tx: tx } });
        },

        renderDate: function (t: number): string {
            return renderDateAndTime(t, this.$t);
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
            const newBlock = (this.$route.params.block || "") + "";

            if (newBlock !== this.block) {
                this.block = newBlock;
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
