import { useWallet } from '@/composables/useWallet';
import { getApiUrl } from './utils';

export async function signedFetch(path: string, options: RequestInit = {}) {
    const { identityKey, isConnected, connect } = useWallet();

    if (!isConnected.value) {
        await connect();
        if (!isConnected.value) {
            throw new Error("Wallet not connected");
        }
    }

    const method = (options.method || 'GET').toUpperCase();
    const url = getApiUrl(path);

    // Simple approach: Use regular fetch with identity key header
    const headers = new Headers(options.headers);

    if (options.body && typeof options.body === 'object') {
        headers.set('Content-Type', 'application/json');
        options.body = JSON.stringify(options.body);
    }

    // Add identity key for backend to identify user
    headers.set('x-bsv-identity-key', identityKey.value!);

    // Add session token if available
    const sessionToken = localStorage.getItem('x-session-token');
    if (sessionToken) {
        headers.set('x-session-id', sessionToken);
    }

    return fetch(url, {
        ...options,
        method,
        headers
    });
}
