// API definitions (Auto generated)

"use strict"

export interface WalletInfo {
    /**
     * Wallet ID
     */
    id: string;

    /**
     * Wallet name
     */
    name?: string;

    /**
     * Wallet address
     */
    address?: string;
}

export interface CrowdfundingStatus {
    /**
     * Goal in satoshis
     */
    goal: number;

    /**
     * Amount raised in satoshis
     */
    raised: number;

    /**
     * Number of unique investors
     */
    investorCount: number;

    /**
     * Whether the campaign is complete
     */
    isComplete: boolean;

    /**
     * Percentage funded
     */
    percentFunded: number;

    investors: Investor[];
}

export interface Investor {
    /**
     * Investor identity key
     */
    identityKey: string;

    /**
     * Amount invested
     */
    amount: number;

    /**
     * Investment timestamp
     */
    timestamp: number;
}

export interface InvestmentResponse {
    /**
     * Success status
     */
    success: boolean;

    /**
     * Amount invested
     */
    amount: number;

    /**
     * Total raised so far
     */
    totalRaised: number;

    /**
     * Success message
     */
    message: string;
}

export interface ErrorResponse {
    /**
     * Error code 
     */
    code?: string;
}

export interface WalletCreateBody {
    /**
     * Wallet name (max 80 chars)
     */
    name: string;

    /**
     * Password to protect the wallet
     */
    password: string;

    /**
     * Private key (HEX). If not provided, a random one is generated.
     */
    private_key?: string;
}

export interface WalletCreateBadRequest {
    /**
     * Error Code:
     *  - INVALID_NAME: Invalid wallet name
     *  - TOO_MANY_WALLETS: You have too many wallets
     *  - WEAK_PASSWORD: Password too weak
     *  - INVALID_PRIVATE_KEY: Invalid private key provided
     */
    code: string;
}

export interface WalletEditBody {
    /**
     * Wallet name (max 80 chars)
     */
    name: string;
}

export interface WalletEditBadRequest {
    /**
     * Error Code:
     *  - INVALID_NAME: Invalid wallet name
     */
    code: string;
}

export interface WalletChangePasswordBody {
    /**
     * Current password
     */
    password: string;

    /**
     * New password
     */
    new_password: string;
}

export interface WalletChangePasswordBadRequest {
    /**
     * Error Code:
     *  - WEAK_PASSWORD: Password too weak
     *  - WRONG_PASSWORD: Wrong current password
     */
    code: string;
}

export interface WalletExportBody {
    /**
     * Current password
     */
    password: string;
}

export interface WalletExportBadRequest {
    /**
     * Error Code:
     *  - WRONG_PASSWORD: Wrong current password
     */
    code: string;
}

export interface WalletExportResponse {
    /**
     * Private key (HEX)
     */
    private_key: string;
}

export interface UserAdminListItem {
    /**
     * User ID
     */
    id: string;

    /**
     * User role
     */
    role: string;

    /**
     * Username
     */
    username: string;

    /**
     * Email
     */
    email: string;

    /**
     * Verified
     */
    verified: boolean;

    /**
     * Banned
     */
    banned: boolean;

    /**
     * Creation timestamp (Unix milliseconds)
     */
    created: number;
}

export interface UserAdminList {
    users: UserAdminListItem[];

    /**
     * Page number (starting by 1)
     */
    page: number;

    /**
     * Total number of pages
     */
    totalPages: number;

    /**
     * Total results
     */
    total?: number;
}

export interface UserAdminDetails {
    /**
     * User ID
     */
    id: string;

    /**
     * User role
     */
    role: string;

    /**
     * Username
     */
    username: string;

    /**
     * Email
     */
    email: string;

    /**
     * Verified
     */
    verified: boolean;

    /**
     * Banned
     */
    banned: boolean;

    /**
     * Creation timestamp (Unix milliseconds)
     */
    created: number;

    /**
     * Immune to moderation
     */
    modImmune: boolean;

    /**
     * Has TFA enabled
     */
    tfa: boolean;

    /**
     * User locale
     */
    locale: string;

    sessions: SessionListItem[];
}

export interface AdminSetRoleBody {
    /**
     * Role to set
     */
    role: string;
}

export interface SetRoleBadRequest {
    /**
     * Error Code:
     *  - SELF: You cannot change your own role
     *  - INVALID_ROLE: Invalid or non-existent role
     */
    code: string;
}

export interface UserAdminEmailChange {
    /**
     * New email
     */
    email: string;
}

export interface UserAdminEmailChangeBadRequest {
    /**
     * Error Code:
     *  - EMAIL_INVALID: Invalid email
     *  - EMAIL_IN_USE: Email is in use
     */
    code: string;
}

export interface UserAdminUsernameChange {
    /**
     * New username
     */
    username: string;
}

export interface UserAdminUsernameChangeBadRequest {
    /**
     * Error Code:
     *  - USERNAME_INVALID: Invalid username
     *  - USERNAME_IN_USE: Username in use
     */
    code: string;
}

export interface UserAdminPasswordChange {
    /**
     * New password
     */
    password: string;
}

export interface UserAdminPasswordChangeBadRequest {
    /**
     * Error Code:
     *  - WEAK_PASSWORD: Password too weak
     */
    code: string;
}

export interface ServiceItem {
    /**
     * Service ID
     */
    id: string;

    /**
     * Service name
     */
    name: string;

    /**
     * Service description
     */
    description?: string;

    /**
     * Admin user
     */
    adminUser?: string;

    /**
     * Required credentials (comma-separated)
     */
    requiredCredentials?: string;

    /**
     * Associated token
     */
    associatedToken?: string;

    /**
     * User count
     */
    userCount?: number;

    /**
     * Credential count
     */
    credentialCount?: number;

    /**
     * Tokens used
     */
    tokensUsed?: number;
}

export interface ServiceListResponse {
    services: ServiceItem[];

    /**
     * Total count
     */
    count: number;
}

export interface CreateServiceRequest {
    /**
     * Service name
     */
    name: string;

    /**
     * Service description
     */
    description?: string;

    /**
     * Admin user ID
     */
    adminUser?: string;

    requiredCredentials?: string[];

    /**
     * Associated token
     */
    associatedToken?: string;
}

export interface UpdateServiceRequest {
    /**
     * Service name
     */
    name?: string;

    /**
     * Service description
     */
    description?: string;

    /**
     * Admin user ID
     */
    adminUser?: string;

    /**
     * Required credentials
     */
    requiredCredentials?: string;

    /**
     * Associated token
     */
    associatedToken?: string;
}

export interface ServiceAdminItem {
    /**
     * Record ID
     */
    id: string;

    /**
     * Admin user ID
     */
    adminUID: string;

    /**
     * Service ID
     */
    serviceId: string;
}

export interface ServiceAdminListResponse {
    admins: ServiceAdminItem[];

    /**
     * Total count
     */
    count: number;
}

export interface CreateServiceAdminRequest {
    /**
     * Admin user ID
     */
    adminUID: string;

    /**
     * Service ID
     */
    serviceId: string;
}

export interface GlobalRolePermission {
    /**
     * Permission identifier
     */
    id: string;

    /**
     * True if the permission is granted
     */
    granted?: boolean;
}

export interface GlobalRole {
    /**
     * Role identifier
     */
    id: string;

    permissions: GlobalRolePermission[];
}

export interface CreateRoleBadRequest {
    /**
     * Error Code:
     *  - INVALID_ID: Invalid identifier (Must not be empty, cannot be admin, max 80 characters, only lowercase letters, numbers and underscores)
     *  - DUPLICATED: Another role was found with the same ID
     */
    code: string;
}

export interface RoleModifyBody {
    permissions: GlobalRolePermission[];
}

export interface UserProfileMin {
    /**
     * User ID
     */
    id?: string;

    /**
     * Username
     */
    username?: string;

    /**
     * Full name
     */
    name?: string;

    /**
     * Image URL
     */
    image?: string;
}

export interface UserProfile {
    /**
     * User ID
     */
    id?: string;

    /**
     * Username
     */
    username?: string;

    /**
     * Join Date (YYYY-MM-DD)
     */
    joinDate?: string;

    /**
     * Full name
     */
    name?: string;

    /**
     * Bio / Description
     */
    bio?: string;

    /**
     * Image URL
     */
    image?: string;

    /**
     * Location
     */
    location?: string;

    /**
     * Website URL
     */
    website?: string;
}

export interface UpdateProfileBody {
    /**
     * Full name
     */
    name?: string;

    /**
     * Bio / Description
     */
    bio?: string;

    /**
     * Location
     */
    location?: string;

    /**
     * Website URL
     */
    website?: string;
}

export interface UpdateProfileBadRequest {
    /**
     * Error Code:
     *  - INVALID_NAME: Invalid full name. Cannot exceed 80 characters
     *  - INVALID_BIO: Invalid bio. Cannot exceed 300 characters.
     *  - INVALID_LOCATION: Invalid location. Cannot exceed 100 characters.
     *  - INVALID_WEBSITE: Invalid website. Must be a valid URL and cannot exceed 100 characters.
     */
    code: string;
}

export interface UploadProfileImageResponse {
    /**
     * Uploaded image URL
     */
    url?: string;
}

export interface ServiceEndpoint {
    /**
     * Service ID 
     */
    id: string;

    /**
     * Service type 
     */
    type: string;

    /**
     * Service endpoint URL 
     */
    serviceEndpoint: string;
}

export interface CreateDIDRequest {
    /**
     * Private key in hex format (optional, will generate random if not provided)
     */
    privateKey?: string;

    services?: ServiceEndpoint[];
}

export interface CreateDIDResponse {
    /**
     * The created DID identifier 
     */
    did: string;

    /**
     * Transaction ID on BSV blockchain
     */
    txid: string;

    /**
     * The complete DID document
     */
    document: any;
}

export interface ResolveDIDResponse {
    /**
     * The resolved DID document
     */
    didDocument: any;

    /**
     * Metadata about the DID document
     */
    didDocumentMetadata: any;

    /**
     * Verification results
     */
    verification: any;
}

export interface GenerateRandomDIDRequest {
    services?: ServiceEndpoint[];
}

export interface GenerateRandomDIDResponse {
    /**
     * The generated DID identifier
     */
    did: string;

    /**
     * The generated private key (KEEP SECURE!)
     */
    privateKey: string;

    /**
     * Transaction ID on BSV blockchain
     */
    txid: string;

    /**
     * The complete DID document
     */
    document: any;
}

export interface ValidateDIDRequest {
    /**
     * The DID document to validate
     */
    document: any;
}

export interface ValidateDIDResponse {
    /**
     * Whether the document is valid
     */
    valid: boolean;

    errors?: string[];
}

export interface ExportDIDRequest {
    /**
     * The DID document to export
     */
    document: any;
}

export interface ExportDIDResponse {
    /**
     * The DID document as formatted JSON string
     */
    json: string;
}

export interface RequestCredentialRequest {
    /**
     * Credential ID
     */
    credentialId: string;

    /**
     * Service ID
     */
    serviceId: string;

    /**
     * Document ID
     */
    documentId: string;
}

export interface RequestCredentialResponse {
    /**
     * The request ID
     */
    requestId: string;

    /**
     * Status (PENDING)
     */
    status: string;
}

export interface GetPendingRequestsResponse {
    requests: CredentialRequest[];

    /**
     * Total count
     */
    count: number;
}

export interface ApproveRequestRequest {
    /**
     * The request ID to approve
     */
    requestId: string;
}

export interface ApproveRequestResponse {
    /**
     * The issued credential ID
     */
    credentialRequestId: string;

    /**
     * The complete credential
     */
    credential: any;
}

export interface RejectRequestRequest {
    /**
     * The request ID to reject
     */
    requestId: string;

    /**
     * Reason for rejection
     */
    reason: string;
}

export interface RejectRequestResponse {
    /**
     * Whether rejection was successful
     */
    success: boolean;
}

export interface GetUserCredentialsResponse {
    credentials: any[];

    /**
     * Total count
     */
    count: number;
}

export interface GetRequestStatusResponse {
    /**
     * Request ID
     */
    requestId: string;

    /**
     * User's DID
     */
    userDID: string;

    /**
     * Credential type
     */
    credentialType: string;

    /**
     * Request data
     */
    requestData: any;

    /**
     * Status (PENDING, APPROVED, REJECTED)
     */
    status: string;

    /**
     * Timestamp
     */
    requestedAt: number;

    /**
     * Credential ID (if approved)
     */
    credentialId?: string;

    /**
     * Rejection reason (if rejected)
     */
    rejectionReason?: string;
}

export interface VerifyCredentialRequest {
    /**
     * The credential to verify
     */
    credential: any;
}

export interface VerifyCredentialResponse {
    /**
     * Whether credential is valid
     */
    valid: boolean;

    errors?: string[];

    /**
     * Individual checks
     */
    checks: any;
}

export interface CredentialTypeListResponse {
    credentialTypes: CredentialTypeItem[];

    /**
     * Total count
     */
    count: number;
}

export interface CreateCredentialTypeRequest {
    /**
     * Credential type name
     */
    name: string;

    /**
     * Description
     */
    description?: string;
}

export interface UpdateCredentialTypeRequest {
    /**
     * Credential type name
     */
    name?: string;

    /**
     * Description
     */
    description?: string;
}

export interface CitizenItem {
    /**
     * Citizen ID
     */
    id: string;

    /**
     * User ID
     */
    uid: string;

    /**
     * Citizen status
     */
    status: string;

    /**
     * Creation timestamp
     */
    createdAt: number;

    /**
     * Last update timestamp
     */
    updatedAt: number;

    /**
     * Decentralized identifier
     */
    did?: string;
}

export interface CitizenListResponse {
    citizens: CitizenItem[];

    /**
     * Total count
     */
    count: number;
}

export interface CreateCitizenRequest {
    /**
     * User ID
     */
    uid: string;

    /**
     * Citizen status (default: active)
     */
    status?: string;

    /**
     * Decentralized identifier
     */
    did?: string;
}

export interface CreateCitizenBadRequest {
    /**
     * Error code:
     * - MISSING_UID
     * - CITIZEN_ALREADY_EXISTS
     */
    code: string;
}

export interface UpdateCitizenRequest {
    /**
     * Citizen status
     */
    status?: string;

    /**
     * Decentralized identifier
     */
    did?: string;
}

export interface UpdateCitizenBadRequest {
    /**
     * Error code:
     * - NOT_FOUND
     */
    code: string;
}

export interface DeleteCitizenBadRequest {
    /**
     * Error code:
     * - NOT_FOUND
     */
    code: string;
}

export interface CitizenServiceItem {
    /**
     * Record ID
     */
    id: string;

    /**
     * Citizen ID
     */
    citizenId: string;

    /**
     * Service ID
     */
    serviceId: string;
}

export interface CitizenServiceListResponse {
    citizenServices: CitizenServiceItem[];

    /**
     * Total count
     */
    count: number;
}

export interface CreateCitizenServiceRequest {
    /**
     * Citizen ID
     */
    citizenId: string;

    /**
     * Service ID
     */
    serviceId: string;
}

export interface ExplorerSearchInformationItem {
    /**
     * Account balance (ETH)
     */
    balance?: number;

    /**
     * Total transactions
     */
    totalTransactions?: number;

    /**
     * True if address is a contract, false if not
     */
    isContract?: boolean;

    /**
     * Block number
     */
    number?: number;

    /**
     * Mix hash
     */
    mixHash?: string;

    /**
     * Parent hash
     */
    parentHash?: string;

    /**
     * sha3Uncles
     */
    sha3Uncles?: string;

    /**
     * Logs bloom
     */
    logsBloom?: string;

    /**
     * Transactions root
     */
    transactionsRoot?: string;

    /**
     * State root
     */
    stateRoot?: string;

    /**
     * Receipts root
     */
    receiptsRoot?: string;

    /**
     * Miner address
     */
    miner?: string;

    /**
     * Difficulty
     */
    difficulty?: number;

    /**
     * Total difficulty
     */
    totalDifficulty?: number;

    /**
     * Extra data
     */
    extraData?: string;

    /**
     * Block size
     */
    size?: number;

    /**
     * Gas limit
     */
    gasLimit?: number;

    /**
     * Gas used
     */
    gasUsed?: number;

    /**
     * Base fee per gas
     */
    baseFeePerGas?: number;

    /**
     * Block timestamp
     */
    timestamp?: number;

    transactions?: string[];

    /**
     * Block hash
     */
    blockHash?: string;

    /**
     * Block number
     */
    blockNumber?: number;

    /**
     * Chain ID
     */
    chainId?: string;

    /**
     * From address
     */
    from?: string;

    /**
     * Gas
     */
    gas?: number;

    /**
     * Gas price
     */
    gasPrice?: number;

    /**
     * Max priority fee per gas
     */
    maxPriorityFeePerGas?: number;

    /**
     * Max fee per gas
     */
    maxFeePerGas?: number;

    /**
     * Block or transaction hash
     */
    hash?: string;

    /**
     * Transaction input
     */
    input?: string;

    /**
     * Nonce
     */
    nonce?: string;

    /**
     * To address
     */
    to?: string;

    /**
     * Transaction index
     */
    transactionIndex?: number;

    /**
     * Transaction type
     */
    type?: number;

    /**
     * Transaction value
     */
    value?: number;

    /**
     * y parity
     */
    yParity?: number;

    /**
     * V
     */
    v?: string;

    /**
     * R
     */
    r?: string;

    /**
     * S
     */
    s?: string;
}

export interface ExplorerSearchInformation {
    /**
     * Mode: account, block, transaction
     */
    mode: string;

    info?: ExplorerSearchInformationItem;
}

export interface BlockInformationMin {
    /**
     * Block number
     */
    number?: number;

    /**
     * Block hash
     */
    hash?: string;

    /**
     * Miner address
     */
    miner?: string;

    /**
     * Block size
     */
    size?: number;

    /**
     * Timestamp
     */
    timestamp?: number;

    /**
     * Transactions length
     */
    transactions?: number;
}

export interface BlockInformation {
    /**
     * Block number
     */
    number?: number;

    /**
     * Block hash
     */
    hash?: string;

    /**
     * Mix hash
     */
    mixHash?: string;

    /**
     * Parent hash
     */
    parentHash?: string;

    /**
     * Nonce
     */
    nonce?: string;

    /**
     * sha3Uncles
     */
    sha3Uncles?: string;

    /**
     * Logs bloom
     */
    logsBloom?: string;

    /**
     * Transactions root
     */
    transactionsRoot?: string;

    /**
     * State root
     */
    stateRoot?: string;

    /**
     * Receipts root
     */
    receiptsRoot?: string;

    /**
     * Miner address
     */
    miner?: string;

    /**
     * Difficulty
     */
    difficulty?: number;

    /**
     * Total difficulty
     */
    totalDifficulty?: number;

    /**
     * Extra data
     */
    extraData?: string;

    /**
     * Block size
     */
    size?: number;

    /**
     * Gas limit
     */
    gasLimit?: number;

    /**
     * Gas used
     */
    gasUsed?: number;

    /**
     * Base fee per gas
     */
    baseFeePerGas?: number;

    /**
     * Block timestamp
     */
    timestamp?: number;

    transactions?: string[];
}

export interface AccountInformation {
    /**
     * Account balance
     */
    balance?: number;

    /**
     * Total transactions
     */
    totalTransactions?: number;

    /**
     * True if address is a contract, false if not
     */
    isContract?: boolean;
}

export interface TransactionInformation {
    /**
     * Block hash
     */
    blockHash?: string;

    /**
     * Block number
     */
    blockNumber?: number;

    /**
     * Chain ID
     */
    chainId?: string;

    /**
     * From address
     */
    from?: string;

    /**
     * Gas
     */
    gas?: number;

    /**
     * Gas price
     */
    gasPrice?: number;

    /**
     * Max priority fee per gas
     */
    maxPriorityFeePerGas?: number;

    /**
     * Max fee per gas
     */
    maxFeePerGas?: number;

    /**
     * Transaction hash
     */
    hash?: string;

    /**
     * Transaction input
     */
    input?: string;

    /**
     * Nonce
     */
    nonce?: string;

    /**
     * To address
     */
    to?: string;

    /**
     * Transaction index
     */
    transactionIndex?: number;

    /**
     * Transaction type
     */
    type?: number;

    /**
     * Transaction value
     */
    value?: number;

    /**
     * y parity
     */
    yParity?: number;

    /**
     * V
     */
    v?: string;

    /**
     * R
     */
    r?: string;

    /**
     * S
     */
    s?: string;
}

export interface AuthenticationContext {
    /**
     * Auth status 
     */
    status: "UNAUTHORIZED" | "TFA_REQUIRED" | "USER_NOT_FOUND" | "LOGGED_IN";

    /**
     * User ID
     */
    uid?: string;

    /**
     * User role.
     */
    role?: string;

    permissions?: string[];

    /**
     * Username
     */
    username?: string;

    /**
     * User email
     */
    email?: string;

    /**
     * Is the account protected by two factor authentication?
     */
    tfa?: boolean;

    /**
     * User locale
     */
    locale?: string;

    /**
     * Profile name
     */
    profileName?: string;

    /**
     * Profile image URL
     */
    profileImage?: string;

    /**
     * Wallet provider (e.g., 'bsv-metanet')
     */
    walletProvider?: string;

    /**
     * Wallet identity key (public key)
     */
    walletIdentityKey?: string;
}

export interface AuthenticationContextError {
    /**
     * Authentication status: UNAUTHORIZED, TFA_REQUIRED (requires two, factor authentication), USER_NOT_FOUND
     */
    code: string;
}

export interface LoginRequest {
    /**
     * Username or email
     */
    username: string;

    /**
     * Password
     */
    password: string;

    /**
     * Captcha (Action = "login")
     */
    captcha?: string;

    /**
     * Send true to keep the session active until closed
     */
    remember?: boolean;
}

export interface LoginErrorBadRequest {
    /**
     * Error Code:
     *  - CAPTCHA: Invalid captcha
     *  - INVALID_CREDENTIALS: Invalid username or empty password
     */
    code: string;
}

export interface LoginErrorForbidden {
    /**
     * Error Code:
     *  - CAPTCHA: Invalid captcha
     *  - INVALID_CREDENTIALS: Invalid credentials
     *  - USER_BANNED: User is banned
     */
    code: string;
}

export interface LoginResponse {
    /**
     * User Id
     */
    uid: string;

    /**
     * Session ID
     */
    session_id: string;
}

export interface ThirdPartyLoginService {
    /**
     * Service ID
     */
    id: string;

    /**
     * Service name
     */
    name: string;

    /**
     * App public client ID
     */
    client_id: string;

    /**
     * Login URL
     */
    url: string;

    /**
     * Redirect URL
     */
    redirect_url: string;
}

export interface ThirdPartyLoginBody {
    /**
     * Service ID
     */
    service: string;

    /**
     * OAuth 2.0 code
     */
    code: string;
}

export interface LoginTPErrorBadRequest {
    /**
     * Error Code:
     *  - SERVICE_INVALID: Invalid service ID
     *  - NO_CODE: No code provided
     *  - OAUTH_ERROR: OAuth 2.0 error (probably an invalid code)
     *  - BANNED: User is banned
     */
    code: string;
}

export interface ThirdPartyLoginResponse {
    /**
     * Result. 
     */
    result: "SESSION" | "MUST_REGISTER";

    /**
     * Session ID
     */
    session_id?: string;

    /**
     * Username suggestion. Can be empty if no suggestion is provided.
     */
    username?: string;

    /**
     *  Email to register. Can be empty for no email.
     */
    email?: string;

    /**
     * Third party user ID to register
     */
    id?: string;

    /**
     * Token to register the user
     */
    token?: string;
}

export interface SignupTPRequest {
    /**
     * Third Party user ID
     */
    id: string;

    /**
     * Username
     */
    username: string;

    /**
     * Email
     */
    email?: string;

    /**
     * Password
     */
    password: string;

    /**
     * Token received after authorizing (Oauth 2.0)
     */
    token: string;

    /**
     * User locale
     */
    locale?: string;
}

export interface SignupTPErrorBadRequest {
    /**
     * Error Code:
     *  - ID_INVALID: Invalid ID
     *  - TOKEN_INVALID: Invalid token
     *  - USERNAME_INVALID: Invalid username
     *  - USERNAME_IN_USE: Username in use
     *  - EMAIL_INVALID: Invalid email
     *  - EMAIL_IN_USE: The email is in use by other account
     *  - WEAK_PASSWORD: Password too short
     */
    code: string;
}

export interface SignupTPResponse {
    /**
     * User ID of the new user
     */
    uid: string;

    /**
     * Session ID
     */
    session_id: string;
}

export interface TFAErrorBadRequest {
    /**
     * Error Code:
     *  - CAPTCHA: Invalid captcha
     */
    code: string;
}

export interface TFAErrorForbidden {
    /**
     * Error Code:
     *  - INVALID_CODE: Invalid code provided
     */
    code: string;
}

export interface TFALoginRequest {
    /**
     * Captcha (action = "tfa")
     */
    captcha: string;

    /**
     * Two-factor authentication single-use code
     */
    token: string;
}

export interface SignupRequest {
    /**
     * Email
     */
    email: string;

    /**
     * Username
     */
    username: string;

    /**
     * Password
     */
    password: string;

    /**
     * Captcha (action = "signup")
     */
    captcha?: string;

    /**
     * User locale
     */
    locale?: string;
}

export interface SignupErrorBadRequest {
    /**
     * Error Code:
     *  - CAPTCHA: Invalid captcha
     *  - EMAIL_INVALID: Invalid email
     *  - EMAIL_IN_USE: Email is in use
     *  - USERNAME_INVALID: Invalid username
     *  - USERNAME_IN_USE: Username in use
     *  - WEAK_PASSWORD: Password too short
     */
    code: string;
}

export interface SignupResponse {
    /**
     * User ID of the new user
     */
    uid: string;

    /**
     * Session ID (Only if email validation is disabled)
     */
    session_id?: string;
}

export interface EmailVerifyRequest {
    /**
     * User ID
     */
    uid: string;

    /**
     * Verification code
     */
    verification: string;
}

export interface EmailVerifyForbidden {
    /**
     * Error code:
     *  - EMAIL_IN_USE: The email is in use and cannot be verified
     */
    code: string;
}

export interface EmailVerifyResponse {
    /**
     * Status:
     *  - VERIFIED: Account was verified
     *  - ALREADY_VERIFIED: Account was already verified
     */
    status: string;
}

export interface ForgotPasswordRequest {
    /**
     * User email
     */
    email: string;

    /**
     * Captcha (action = "forgot_password")
     */
    captcha?: string;
}

export interface ForgotPasswordErrorBadRequest {
    /**
     * Error Code:
     *  - CAPTCHA: Invalid captcha
     *  - EMAIL_INVALID: Invalid email
     */
    code: string;
}

export interface ForgotPasswordResponse {
    /**
     * Status:
     *  - RESET_PASSWORD_EMAIL_SENT: Email sent
     *  - VERIFY_EMAIL_SENT: Account is not verified yet
     *  - ACCOUNT_VERIFIED: Account was verified, but no email was sent
     */
    status: string;
}

export interface ResetPasswordRequest {
    /**
     * User ID
     */
    uid: string;

    /**
     * Verification code
     */
    verification: string;

    /**
     * New password
     */
    password: string;
}

export interface ResetPasswordErrorBadRequest {
    /**
     * Error Code:
     *  - WEAK_PASSWORD: Password too short
     */
    code: string;
}

export interface WalletLoginResponse {
    /**
     * User ID
     */
    uid: string;

    /**
     * Session ID
     */
    session_id: string;
}

export interface WalletLoginRequest {
    /**
     * Identity key
     */
    identityKey: string;
}

export interface LinkWalletError {
    /**
     * Error codes:\n - WALLET_NOT_CONFIGURED: BSV wallet not available\n - NO_IDENTITY_KEY: Could not extract identity key\n - ALREADY_LINKED: This wallet is already linked to another account\n - INTERNAL_ERROR: Server error
     */
    code: string;
}

export interface UsernameChangeRequest {
    /**
     * New username
     */
    username: string;

    /**
     * Account password
     */
    password: string;

    /**
     * Two factor authentication code, if you have it enabled is required
     */
    tfa_token?: string;
}

export interface UsernameChangeBadRequest {
    /**
     * Error Code:
     *  - WRONG_PASSWORD: Wrong password
     *  - USERNAME_INVALID: Invalid username
     *  - USERNAME_IN_USE: Username in use
     *  - INVALID_TFA_CODE: Invalid two factor authentication
     */
    code: string;
}

export interface EmailChangeRequest {
    /**
     * New email
     */
    email: string;

    /**
     * Account password
     */
    password: string;

    /**
     * Two factor authentication code, if you have it enabled is required
     */
    tfa_token?: string;

    /**
     * Captcha (Action = "change_email")
     */
    captcha?: string;
}

export interface EmailChangeBadRequest {
    /**
     * Error Code:
     *  - CAPTCHA: Invalid captcha
     *  - WRONG_PASSWORD: Wrong password
     *  - EMAIL_INVALID: Invalid email
     *  - EMAIL_IN_USE: Email is in use
     *  - INVALID_TFA_CODE: Invalid two factor authentication
     */
    code: string;
}

export interface PasswordChangeRequest {
    /**
     * Old password
     */
    old_password: string;

    /**
     * New password
     */
    new_password: string;
}

export interface PasswordChangeBadRequest {
    /**
     * Error Code:
     *  - WRONG_PASSWORD: Wrong old password
     *  - WEAK_PASSWORD: Password too weak
     */
    code: string;
}

export interface TFAGenResponse {
    /**
     * TFA secret
     */
    secret: string;

    /**
     * URL for QR code
     */
    uri: string;
}

export interface TFASetupRequest {
    /**
     * Account password
     */
    password: string;

    /**
     * TFA secret
     */
    secret: string;

    /**
     * Current TFA token to validate the secret
     */
    token: string;
}

export interface TFASetupBadRequest {
    /**
     * Error Code:
     *  - WRONG_PASSWORD: Wrong password
     *  - ALREADY: TFA already setup
     *  - INVALID: Invalid tfa secret or validation code
     */
    code: string;
}

export interface TFARemoveRequest {
    /**
     * Current TFA token to validate the request
     */
    token: string;
}

export interface TFARemoveBadRequest {
    /**
     * Error Code:
     *  - NOT_ENABLED: TFA not enabled
     *  - INVALID: Invalid tfa secret or validation code
     */
    code: string;
}

export interface SessionListItem {
    /**
     * Session Token
     */
    session: string;

    /**
     * Session creation timestamp
     */
    created?: number;

    /**
     * Remote address
     */
    remote?: string;

    /**
     * Operating system
     */
    os?: string;

    /**
     * Browser / Platform
     */
    browser?: string;

    /**
     * Is current Session?
     */
    current?: boolean;
}

export interface ChangeLocaleBody {
    /**
     * Locale to use, If wrong, it will use the default locale.
     */
    locale?: string;
}

export interface AccountDeleteBadRequest {
    /**
     * Error Code:
     *  - WRONG_PASSWORD: Wrong password
     *  - INVALID_TFA_CODE: Invalid two factor authentication
     */
    code: string;
}

export interface DeleteAccountRequest {
    /**
     * Account password
     */
    password: string;

    /**
     * Two factor authentication code, if you have it enabled is required
     */
    tfa_token: string;
}

