import { useWallet } from '@/composables/useWallet';
import { getApiUrl } from './utils';

export interface SignedFetchOptions extends Omit<RequestInit, 'body'> {
    body?: BodyInit | Record<string, unknown> | null;
}

export async function signedFetch(path: string, options: SignedFetchOptions = {}): Promise<Response> {
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

    let body: BodyInit | null | undefined = undefined;
    if (options.body && typeof options.body === 'object' && !(options.body instanceof Blob) && !(options.body instanceof FormData) && !(options.body instanceof URLSearchParams) && !(options.body instanceof ArrayBuffer) && !(options.body instanceof ReadableStream)) {
        headers.set('Content-Type', 'application/json');
        body = JSON.stringify(options.body);
    } else {
        body = options.body as BodyInit | null | undefined;
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
        body,
        method,
        headers
    });
}
