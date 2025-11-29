<template>
    <div class="page-content" tabindex="-1">
        <ComponentLoader v-if="loading"></ComponentLoader>
        
        <div class="storage-container" v-if="!loading">
            <div class="header-section">
                <h1>{{ $t("File Storage with BSV Hash Anchor") }}</h1>
                <p class="subtitle">{{ $t("Upload files and anchor SHA256 hash on BSV blockchain") }}</p>
                <div class="wallet-status">
                    <button v-if="!isConnected" class="btn btn-outline-primary btn-sm" @click="connect">
                        <i class="fas fa-wallet"></i> {{ $t("Connect Wallet") }}
                    </button>
                    <span v-else class="badge badge-success">
                        <i class="fas fa-check-circle"></i> {{ $t("Wallet Connected") }}
                    </span>
                </div>
            </div>

            <!-- Storage Config Info -->
            <div class="config-card">
                <h3><i class="fas fa-cog"></i> {{ $t("Storage Configuration") }}</h3>
                <div class="config-grid">
                    <div class="config-item">
                        <span class="label">{{ $t("Mode") }}:</span>
                        <span class="value success">LOCAL + HASH</span>
                    </div>
                    <div class="config-item">
                        <span class="label">{{ $t("Hash Algorithm") }}:</span>
                        <span class="value">SHA256</span>
                    </div>
                    <div class="config-item">
                        <span class="label">{{ $t("Max File Size") }}:</span>
                        <span class="value">50 MB</span>
                    </div>
                </div>
            </div>

            <!-- Upload Section -->
            <div class="upload-section">
                <h3><i class="fas fa-cloud-upload-alt"></i> {{ $t("Upload File") }}</h3>
                
                <div class="form-group">
                    <label>{{ $t("Select Bucket") }}</label>
                    <select v-model="selectedBucket" class="form-control">
                        <option v-for="bucket in buckets" :key="bucket" :value="bucket">
                            {{ bucket }}
                        </option>
                    </select>
                    <small class="form-text">{{ $t("Organize your files by category") }}</small>
                </div>

                <div class="form-group">
                    <label>{{ $t("Visibility") }}</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" v-model="isPublic" :value="false" />
                            <span><i class="fas fa-lock"></i> {{ $t("Private") }}</span>
                            <small>{{ $t("Requires authentication to access") }}</small>
                        </label>
                        <label class="radio-option">
                            <input type="radio" v-model="isPublic" :value="true" />
                            <span><i class="fas fa-globe"></i> {{ $t("Public") }}</span>
                            <small>{{ $t("Anyone with the URL can access") }}</small>
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label>{{ $t("File") }}</label>
                    <div 
                        class="drop-zone" 
                        :class="{ 'drag-over': isDragging, 'has-file': selectedFile }"
                        @dragover.prevent="isDragging = true"
                        @dragleave="isDragging = false"
                        @drop.prevent="handleDrop"
                        @click="triggerFileInput"
                    >
                        <input 
                            type="file" 
                            ref="fileInput" 
                            @change="handleFileSelect" 
                            style="display: none;"
                        />
                        <div v-if="!selectedFile" class="drop-zone-content">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <p>{{ $t("Drag & drop a file here or click to browse") }}</p>
                            <small>{{ $t("Maximum file size: 50MB") }}</small>
                        </div>
                        <div v-else class="file-preview">
                            <i :class="getFileIcon(selectedFile.type)"></i>
                            <div class="file-info">
                                <span class="file-name">{{ selectedFile.name }}</span>
                                <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
                            </div>
                            <button class="btn-remove" @click.stop="removeFile">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="button-group">
                    <button 
                        class="btn btn-primary btn-lg" 
                        @click="uploadFile" 
                        :disabled="!selectedFile || uploading"
                    >
                        <i class="fas fa-upload" v-if="!uploading"></i>
                        <i class="fas fa-spinner fa-spin" v-else></i>
                        {{ uploading ? $t("Uploading...") : $t("Upload & Get Hash") }}
                    </button>
                </div>

                <!-- Upload Progress -->
                <div v-if="uploading" class="progress-section">
                    <div class="progress-bar-container">
                        <div class="progress-bar indeterminate"></div>
                    </div>
                    <p class="progress-text">{{ $t("Uploading and calculating hash...") }}</p>
                </div>

                <!-- Upload Result -->
                <div v-if="uploadResult" class="result-card success">
                    <h4><i class="fas fa-check-circle"></i> {{ $t("Upload Successful!") }}</h4>
                    <div class="result-details">
                        <div class="result-item">
                            <span class="label">{{ $t("SHA256 Hash") }}:</span>
                            <div class="url-container">
                                <code class="hash-value">{{ uploadResult.hash }}</code>
                                <button class="btn-copy" @click="copyToClipboard(uploadResult.hash)" :title="$t('Copy')">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                        <div class="result-item">
                            <span class="label">{{ $t("File ID") }}:</span>
                            <span class="value mono">{{ uploadResult.fileId }}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">{{ $t("Size") }}:</span>
                            <span class="value">{{ formatFileSize(uploadResult.size) }}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">{{ $t("Type") }}:</span>
                            <span class="value">{{ uploadResult.mimeType }}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">{{ $t("File URL") }}:</span>
                            <div class="url-container">
                                <a :href="uploadResult.url" target="_blank" class="value link">{{ $t("Open File") }}</a>
                                <button class="btn-copy" @click="copyToClipboard(uploadResult.url)" :title="$t('Copy URL')">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="hash-note">
                        <i class="fas fa-info-circle"></i>
                        {{ $t("This SHA256 hash serves as cryptographic proof of file integrity. You can verify the file has not been modified by recalculating its hash.") }}
                    </div>

                    <!-- Anchor on BSV Section -->
                    <div class="anchor-section" v-if="!uploadResult.txid">
                        <button 
                            class="btn btn-success btn-lg" 
                            @click="anchorOnBsv" 
                            :disabled="anchoring || !isConnected"
                        >
                            <i class="fas fa-link" v-if="!anchoring"></i>
                            <i class="fas fa-spinner fa-spin" v-else></i>
                            {{ anchoring ? $t("Anchoring...") : $t("Anchor Hash on BSV Blockchain") }}
                        </button>
                        <small v-if="!isConnected" class="connect-hint">
                            <i class="fas fa-exclamation-circle"></i>
                            {{ $t("Connect your BSV wallet to anchor this hash on-chain") }}
                        </small>
                    </div>

                    <!-- BSV Transaction Result -->
                    <div class="txid-result" v-if="uploadResult.txid">
                        <h5><i class="fas fa-cube"></i> {{ $t("Anchored on BSV!") }}</h5>
                        <div class="result-item">
                            <span class="label">{{ $t("Transaction ID") }}:</span>
                            <div class="url-container">
                                <code class="txid-value">{{ uploadResult.txid }}</code>
                                <button class="btn-copy" @click="copyToClipboard(uploadResult.txid)" :title="$t('Copy')">
                                    <i class="fas fa-copy"></i>
                                </button>
                                <a :href="'https://whatsonchain.com/tx/' + uploadResult.txid" target="_blank" class="btn-external" :title="$t('View on WhatsOnChain')">
                                    <i class="fas fa-external-link-alt"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Message -->
            <div v-if="message" :class="['message', messageType]">
                {{ message }}
            </div>

            <!-- Uploaded Files History -->
            <div class="history-section" v-if="uploadedFiles.length > 0">
                <h3><i class="fas fa-history"></i> {{ $t("Recent Uploads") }}</h3>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>{{ $t("File") }}</th>
                                <th>{{ $t("Hash (truncated)") }}</th>
                                <th>{{ $t("Size") }}</th>
                                <th>{{ $t("Actions") }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(file, index) in uploadedFiles" :key="index">
                                <td>
                                    <i :class="getFileIcon(file.mimeType)"></i>
                                    {{ file.fileName || 'File' }}
                                </td>
                                <td>
                                    <code class="hash-truncated">{{ truncateHash(file.hash) }}</code>
                                </td>
                                <td>{{ formatFileSize(file.size) }}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" @click="copyToClipboard(file.hash)" :title="$t('Copy Hash')">
                                        <i class="fas fa-fingerprint"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-secondary" @click="openFile(file.url)" :title="$t('Open')">
                                        <i class="fas fa-external-link-alt"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import ComponentLoader from "@/components/utils/ComponentLoader.vue";
import { getApiUrl } from "@/api/utils";
import { useWallet } from "@/composables/useWallet";
import { Script } from "@bsv/sdk";

// Tipo para resultado de upload
interface FileUploadResult {
    fileId: string;
    fileName: string;
    mimeType: string;
    size: number;
    hash: string;
    url: string;
    timestamp: number;
    txid?: string; // BSV transaction ID if anchored
}

// Tipo local para historial de uploads
interface StorageHistoryItem {
    fileName: string;
    fileId: string;
    size: number;
    mimeType: string;
    hash: string;
    url: string;
    uploadedAt: number;
}

export default defineComponent({
    name: "BsvStoragePage",
    components: {
        ComponentLoader,
    },
    setup() {
        const loading = ref(false);
        const uploading = ref(false);
        const anchoring = ref(false);
        
        // Wallet connection
        const { wallet, isConnected, connect } = useWallet();
        
        const buckets = ref<string[]>(['documents', 'images', 'media', 'other']);
        const selectedBucket = ref("documents");
        const isPublic = ref(false);
        const selectedFile = ref<File | null>(null);
        const isDragging = ref(false);
        const fileInput = ref<HTMLInputElement | null>(null);
        const message = ref("");
        const messageType = ref("");
        const uploadResult = ref<FileUploadResult | null>(null);
        const uploadedFiles = ref<StorageHistoryItem[]>([]);

        const triggerFileInput = () => {
            fileInput.value?.click();
        };

        const handleFileSelect = (event: Event) => {
            const target = event.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
                selectedFile.value = target.files[0];
                uploadResult.value = null;
            }
        };

        const handleDrop = (event: DragEvent) => {
            isDragging.value = false;
            if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
                selectedFile.value = event.dataTransfer.files[0];
                uploadResult.value = null;
            }
        };

        const removeFile = () => {
            selectedFile.value = null;
            if (fileInput.value) {
                fileInput.value.value = "";
            }
        };

        const uploadFile = async () => {
            if (!selectedFile.value) return;

            uploading.value = true;
            message.value = "Uploading file...";
            messageType.value = "info";
            uploadResult.value = null;

            try {
                const formData = new FormData();
                formData.append("file", selectedFile.value);
                formData.append("bucket", selectedBucket.value);
                formData.append("isPublic", isPublic.value.toString());

                const response = await fetch(getApiUrl("/api/v1/files/upload"), {
                    method: "POST",
                    body: formData,
                    credentials: "include",
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Upload failed");
                }

                // Backend sends result directly (not wrapped in { result: ... })
                const result: FileUploadResult = data;
                uploading.value = false;
                uploadResult.value = result;

                // Add to history
                const historyItem: StorageHistoryItem = {
                    fileName: result.fileName,
                    fileId: result.fileId,
                    size: result.size,
                    mimeType: result.mimeType,
                    hash: result.hash,
                    url: result.url,
                    uploadedAt: result.timestamp,
                };
                uploadedFiles.value.unshift(historyItem);
                saveToHistory(historyItem);

                message.value = "File uploaded successfully!";
                messageType.value = "success";

                // Clear selection
                selectedFile.value = null;
                if (fileInput.value) {
                    fileInput.value.value = "";
                }
            } catch (err: any) {
                console.error('Upload error:', err);
                uploading.value = false;
                message.value = "Upload failed: " + (err.message || 'Unknown error');
                messageType.value = "error";
            }
        };

        const openFile = (url: string) => {
            window.open(url, '_blank');
        };

        const copyToClipboard = (text: string) => {
            navigator.clipboard.writeText(text).then(() => {
                message.value = "Copied to clipboard!";
                messageType.value = "success";
                setTimeout(() => {
                    message.value = "";
                }, 2000);
            });
        };

        const truncateHash = (hash: string): string => {
            if (!hash) return '';
            return hash.substring(0, 8) + '...' + hash.substring(hash.length - 8);
        };

        const formatFileSize = (bytes: number): string => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const getFileIcon = (mimeType: string): string => {
            if (!mimeType) return 'fas fa-file';
            if (mimeType.startsWith('image/')) return 'fas fa-file-image';
            if (mimeType.startsWith('video/')) return 'fas fa-file-video';
            if (mimeType.startsWith('audio/')) return 'fas fa-file-audio';
            if (mimeType.includes('pdf')) return 'fas fa-file-pdf';
            if (mimeType.includes('word') || mimeType.includes('document')) return 'fas fa-file-word';
            if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'fas fa-file-excel';
            if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'fas fa-file-archive';
            if (mimeType.includes('text') || mimeType.includes('json')) return 'fas fa-file-code';
            return 'fas fa-file';
        };

        const saveToHistory = (file: StorageHistoryItem) => {
            try {
                const history = JSON.parse(localStorage.getItem('file-storage-history') || '[]');
                history.unshift(file);
                localStorage.setItem('file-storage-history', JSON.stringify(history.slice(0, 20)));
            } catch (e) {
                console.error('Failed to save to history', e);
            }
        };

        const loadHistory = () => {
            try {
                const history = JSON.parse(localStorage.getItem('file-storage-history') || '[]');
                uploadedFiles.value = history;
            } catch (e) {
                console.error('Failed to load history', e);
            }
        };

        /**
         * Anchor the file hash on BSV blockchain using OP_RETURN
         */
        const anchorOnBsv = async () => {
            if (!uploadResult.value || !isConnected.value || !wallet.value) {
                message.value = "Please upload a file and connect your wallet first.";
                messageType.value = "error";
                return;
            }

            anchoring.value = true;
            message.value = "Creating blockchain transaction...";
            messageType.value = "info";

            try {
                // Build OP_RETURN data: FILE_HASH_ANCHOR | hash | filename | timestamp
                const anchorData = [
                    "FILE_HASH_ANCHOR",
                    uploadResult.value.hash,
                    uploadResult.value.fileName,
                    uploadResult.value.timestamp.toString()
                ];

                // Create OP_RETURN script using ASM format
                // OP_FALSE OP_RETURN <data1> <data2> ...
                // Convert data to hex for ASM format
                const toHex = (str: string): string => {
                    return Array.from(new TextEncoder().encode(str))
                        .map(b => b.toString(16).padStart(2, '0'))
                        .join('');
                };
                
                const asmParts = ['OP_FALSE', 'OP_RETURN'];
                for (const data of anchorData) {
                    asmParts.push(toHex(data));
                }
                const opReturnScript = Script.fromASM(asmParts.join(' '));

                // Create transaction using wallet
                const result = await wallet.value.createAction({
                    outputs: [{
                        lockingScript: opReturnScript.toHex(),
                        satoshis: 0, // OP_RETURN outputs have 0 satoshis
                        outputDescription: 'File hash anchor'
                    }],
                    description: `Anchor file hash: ${uploadResult.value.fileName}`,
                    options: { randomizeOutputs: false }
                });

                if (result.txid) {
                    uploadResult.value.txid = result.txid;
                    message.value = `Hash anchored on BSV! TX: ${result.txid}`;
                    messageType.value = "success";

                    // Update history with txid
                    const historyIndex = uploadedFiles.value.findIndex(
                        f => f.hash === uploadResult.value?.hash
                    );
                    if (historyIndex >= 0) {
                        uploadedFiles.value[historyIndex] = {
                            ...uploadedFiles.value[historyIndex],
                            txid: result.txid
                        } as any;
                        localStorage.setItem('file-storage-history', JSON.stringify(uploadedFiles.value));
                    }
                } else {
                    throw new Error("Transaction created but no txid returned");
                }
            } catch (err: any) {
                console.error('Anchor error:', err);
                message.value = "Anchor failed: " + (err.message || 'Unknown error');
                messageType.value = "error";
            } finally {
                anchoring.value = false;
            }
        };

        onMounted(() => {
            loadHistory();
        });

        return {
            loading,
            uploading,
            anchoring,
            buckets,
            selectedBucket,
            isPublic,
            selectedFile,
            isDragging,
            fileInput,
            message,
            messageType,
            uploadResult,
            uploadedFiles,
            triggerFileInput,
            handleFileSelect,
            handleDrop,
            removeFile,
            uploadFile,
            openFile,
            copyToClipboard,
            truncateHash,
            formatFileSize,
            getFileIcon,
            // Wallet & BSV
            isConnected,
            connect,
            anchorOnBsv,
        };
    }
});
</script>

<style scoped>
.storage-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
}

.header-section {
    text-align: center;
    margin-bottom: 2rem;
}

.header-section h1 {
    margin-bottom: 0.5rem;
}

.subtitle {
    color: var(--theme-text-secondary);
    font-size: 1.1rem;
}

.config-card, .upload-section, .history-section {
    background: var(--theme-card-bg);
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.config-card h3, .upload-section h3, .history-section h3 {
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.config-item {
    display: flex;
    flex-direction: column;
}

.config-item .label {
    font-weight: 600;
    color: var(--theme-text-secondary);
    font-size: 0.85rem;
}

.config-item .value {
    font-size: 1rem;
}

.config-item .value.success {
    color: #10b981;
    font-weight: bold;
}

.mono {
    font-family: monospace;
    font-size: 0.9rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
}

.form-control {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--theme-border);
    border-radius: 4px;
    font-size: 1rem;
    background: var(--theme-input-bg);
    color: var(--theme-text);
}

.form-text {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.85rem;
    color: var(--theme-text-secondary);
}

.radio-group {
    display: flex;
    gap: 1rem;
}

.radio-option {
    flex: 1;
    padding: 1rem;
    border: 2px solid var(--theme-border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.radio-option:has(input:checked) {
    border-color: var(--theme-primary);
    background: var(--theme-primary-light);
}

.radio-option input {
    margin-right: 0.5rem;
}

.radio-option span {
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.radio-option small {
    display: block;
    margin-top: 0.25rem;
    margin-left: 1.5rem;
    color: var(--theme-text-secondary);
    font-size: 0.8rem;
}

.drop-zone {
    border: 2px dashed var(--theme-border);
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--theme-input-bg);
}

.drop-zone:hover, .drop-zone.drag-over {
    border-color: var(--theme-primary);
    background: var(--theme-primary-light);
}

.drop-zone.has-file {
    border-style: solid;
    border-color: var(--theme-primary);
}

.drop-zone-content i {
    font-size: 3rem;
    color: var(--theme-text-secondary);
    margin-bottom: 1rem;
}

.drop-zone-content p {
    margin-bottom: 0.5rem;
}

.drop-zone-content small {
    color: var(--theme-text-secondary);
}

.file-preview {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.file-preview i {
    font-size: 2.5rem;
    color: var(--theme-primary);
}

.file-info {
    flex: 1;
    text-align: left;
}

.file-name {
    display: block;
    font-weight: 600;
    word-break: break-all;
}

.file-size {
    color: var(--theme-text-secondary);
    font-size: 0.9rem;
}

.btn-remove {
    background: none;
    border: none;
    color: var(--theme-danger);
    cursor: pointer;
    padding: 0.5rem;
    font-size: 1.2rem;
}

.button-group {
    text-align: center;
}

.btn-lg {
    padding: 0.75rem 2rem;
    font-size: 1.1rem;
}

.progress-section {
    margin-top: 1.5rem;
}

.progress-bar-container {
    height: 8px;
    background: #eee;
    border-radius: 4px;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background: var(--theme-primary);
}

.progress-bar.indeterminate {
    width: 30%;
    animation: indeterminate 1.5s infinite ease-in-out;
}

@keyframes indeterminate {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(400%); }
}

.progress-text {
    text-align: center;
    margin-top: 0.5rem;
    color: var(--theme-text-secondary);
}

.result-card {
    margin-top: 1.5rem;
    padding: 1.5rem;
    border-radius: 8px;
}

.result-card.success {
    background: #d1fae5;
    border: 1px solid #10b981;
}

.result-card h4 {
    color: #065f46;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.result-details {
    display: grid;
    gap: 0.75rem;
}

.result-item {
    display: flex;
    flex-direction: column;
}

.result-item .label {
    font-weight: 600;
    color: #065f46;
    font-size: 0.85rem;
}

.url-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.hash-value {
    background: #a7f3d0;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    word-break: break-all;
    flex: 1;
    font-family: monospace;
}

.hash-truncated {
    font-family: monospace;
    font-size: 0.85rem;
    background: #f3f4f6;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
}

.link {
    color: #059669;
    text-decoration: underline;
}

.btn-copy {
    background: none;
    border: 1px solid #10b981;
    color: #065f46;
    padding: 0.5rem;
    border-radius: 4px;
    cursor: pointer;
}

.btn-copy:hover {
    background: #10b981;
    color: white;
}

.hash-note {
    margin-top: 1rem;
    padding: 0.75rem;
    background: #a7f3d0;
    border-radius: 4px;
    font-size: 0.85rem;
    color: #065f46;
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
}

.hash-note i {
    margin-top: 0.1rem;
}

.message {
    padding: 1rem;
    border-radius: 4px;
    margin-top: 1rem;
}

.message.success {
    background: #d1fae5;
    color: #065f46;
}

.message.error {
    background: #fee2e2;
    color: #991b1b;
}

.message.info {
    background: #dbeafe;
    color: #1e40af;
}

.table {
    width: 100%;
    border-collapse: collapse;
}

.table th, .table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--theme-border);
}

.table th {
    font-weight: 600;
    color: var(--theme-text-secondary);
    font-size: 0.85rem;
}

.btn-outline-primary, .btn-outline-secondary {
    background: transparent;
    border: 1px solid;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 0.25rem;
}

.btn-outline-primary {
    border-color: var(--theme-primary);
    color: var(--theme-primary);
}

.btn-outline-secondary {
    border-color: var(--theme-text-secondary);
    color: var(--theme-text-secondary);
}

/* Wallet Status */
.wallet-status {
    margin-top: 1rem;
}

.wallet-status .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    font-size: 0.9rem;
}

.wallet-status .badge-success {
    background: #d1fae5;
    color: #065f46;
}

/* Anchor Section */
.anchor-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #a7f3d0;
    text-align: center;
}

.anchor-section .btn-success {
    background: #10b981;
    border: none;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
}

.anchor-section .btn-success:hover:not(:disabled) {
    background: #059669;
}

.anchor-section .btn-success:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.connect-hint {
    display: block;
    margin-top: 0.75rem;
    color: #6b7280;
    font-size: 0.85rem;
}

/* Transaction Result */
.txid-result {
    margin-top: 1.5rem;
    padding: 1rem;
    background: #ecfdf5;
    border: 2px solid #10b981;
    border-radius: 8px;
}

.txid-result h5 {
    color: #065f46;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.txid-value {
    background: #a7f3d0;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    word-break: break-all;
    flex: 1;
    font-family: monospace;
}

.btn-external {
    background: none;
    border: 1px solid #10b981;
    color: #065f46;
    padding: 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
}

.btn-external:hover {
    background: #10b981;
    color: white;
}

@media (max-width: 768px) {
    .radio-group {
        flex-direction: column;
    }
    
    .config-grid {
        grid-template-columns: 1fr;
    }
}
</style>
