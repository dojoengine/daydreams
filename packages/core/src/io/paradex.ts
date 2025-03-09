import BigNumber from "bignumber.js";
import {
    ec,
    shortString,
    type TypedData,
    typedData as starkTypedData,
} from "starknet";

export interface ParadexAccount {
    address: string;
    privateKey: string;
    jwtToken?: string;
}

export interface ParadexConfig {
    readonly apiBaseUrl: string;
    readonly starknet: {
        readonly chainId: string;
    };
}

interface AuthRequest extends Record<string, unknown> {
    method: string;
    path: string;
    body: string;
    timestamp: number;
    expiration: number;
}

interface MarketData {
    symbol: string;
    last_price: string;
    mark_price: string;
    index_price: string;
    open_interest: string;
    funding_rate: string;
    volume_24h: string;
    trades_24h: string;
    price_change_24h: string;
}


interface BatchOrderResult {
    orderId: string;
    market: string;
    status: string;
    error?: string;
}

const DOMAIN_TYPES = {
    StarkNetDomain: [
        { name: "name", type: "felt" },
        { name: "chainId", type: "felt" },
        { name: "version", type: "felt" },
    ],
};
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function authenticate(config: ParadexConfig, account: ParadexAccount) {
    const { signature, timestamp, expiration } = signAuthRequest(
        config,
        account,
    );
    const headers = {
        Accept: "application/json",
        "PARADEX-STARKNET-ACCOUNT": account.address,
        "PARADEX-STARKNET-SIGNATURE": signature,
        "PARADEX-TIMESTAMP": timestamp.toString(),
        "PARADEX-SIGNATURE-EXPIRATION": expiration.toString(),
        "Content-Type": "application/json"
    };

    try {
        const response = await fetch(`${config.apiBaseUrl}/auth`, {
            method: "POST",
            headers,
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Authentication failed: ${response.status} - ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        if (!data.jwt_token) {
            throw new Error('No JWT token received from authentication');
        }
        return data.jwt_token;
    } catch (e) {
        console.error('Authentication error:', e);
        throw e;
    }
}

export async function getAccountInfo(config: ParadexConfig, account: ParadexAccount) {
    if (!account.jwtToken) {
        throw new Error('No JWT token available. Please authenticate first.');
    }

    const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${account.jwtToken}`,
    };

    try {
        const response = await fetch(`${config.apiBaseUrl}/account`, {
            method: "GET",
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to get account info: ${response.status} - ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        if (!data) {
            throw new Error('No account data received');
        }
        return data;
    } catch (e) {
        console.error('Get account info error:', e);
        throw e;
    }
}

export async function listAvailableMarkets(
    config: ParadexConfig,
    market?: string,
) {
    const headers = {
        Accept: "application/json",
    };

    try {
        const url = market
            ? `${config.apiBaseUrl}/markets?market=${market}`
            : `${config.apiBaseUrl}/markets`;

        const response = await fetch(url, {
            method: "GET",
            headers,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.results) {
            throw new Error('No results found in response');
        }
        return data.results;
    } catch (e) {
        console.error('Error fetching markets:', e);
        throw e;
    }
}

export async function getPositions(config: ParadexConfig, account: ParadexAccount) {
    const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${account.jwtToken}`,
    };

    try {
        const response = await fetch(`${config.apiBaseUrl}/positions`, {
            method: "GET",
            headers,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.results;
    } catch (e) {
        console.error(e);
    }
}

export async function getOpenOrders(config: ParadexConfig, account: ParadexAccount) {
    const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${account.jwtToken}`,
    };

    try {
        const response = await fetch(`${config.apiBaseUrl}/orders`, {
            method: "GET",
            headers,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.results;
    } catch (e) {
        console.error(e);
    }
}

export async function openOrder(
    config: ParadexConfig,
    account: ParadexAccount,
    orderDetails: Record<string, string>,
) {
    const price = Number(orderDetails.price);
    if (price <= 0) {
        throw new Error("Order failed: price must be a non-negative non-zero number.");
    }

    const timestamp = Date.now();
    const signature = signOrder(config, account, orderDetails, timestamp);

    const inputBody = JSON.stringify({
        ...orderDetails,
        signature: signature,
        signature_timestamp: timestamp,
    });

    const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${account.jwtToken}`,
        "Content-Type": "application/json",
    };

    try {
        const response = await fetch(`${config.apiBaseUrl}/orders`, {
            method: "POST",
            headers,
            body: inputBody,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Order failed: ${data.message || response.status}`);
        }

        console.log("Order response:", data);

        return {
            orderId: data.orderId || data.id || 'filled-immediately',
            status: data.status || 'success',
            data: data
        };
    } catch (error) {
        console.error('Error in openOrder:', error);
        throw error;
    }
}

export async function cancelOrder(
    config: ParadexConfig,
    account: ParadexAccount,
    orderId: string,
) {
    const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${account.jwtToken}`,
    };

    try {
        const response = await fetch(`${config.apiBaseUrl}/orders/${orderId}`, {
            method: "DELETE",
            headers,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return true;
    } catch (e) {
        console.error(e);
    }
}

export async function executeBatchOrders(
    config: ParadexConfig,
    account: ParadexAccount,
    orders: Array<{
        market: string;
        side: string;
        type: string;
        size: string;
        price?: string;
        timeInForceType?: string;
    }>
): Promise<BatchOrderResult[]> {
    const results = await Promise.all(
        orders.map(async (orderDetails): Promise<BatchOrderResult> => {
            try {
                const result = await openOrder(config, account, orderDetails);
                return {
                    orderId: result.orderId,
                    market: orderDetails.market,
                    status: result.status
                };
            } catch (error) {
                return {
                    orderId: '',
                    market: orderDetails.market,
                    status: 'FAILED',
                    error: error instanceof Error ? error.message : String(error)
                };
            }
        })
    );

    return results;
}

function generateTimestamps(): {
    timestamp: number;
    expiration: number;
} {
    const dateNow = new Date();
    const dateExpiration = new Date(dateNow.getTime() + SEVEN_DAYS_MS);

    return {
        timestamp: Math.floor(dateNow.getTime() / 1000),
        expiration: Math.floor(dateExpiration.getTime() / 1000),
    };
}

function signAuthRequest(
    config: ParadexConfig,
    account: ParadexAccount,
): {
    signature: string;
    timestamp: number;
    expiration: number;
} {
    const { timestamp, expiration } = generateTimestamps();

    const request: AuthRequest = {
        method: "POST",
        path: "/v1/auth",
        body: "",
        timestamp,
        expiration,
    };

    const typedData = buildAuthTypedData(request, config.starknet.chainId);
    const signature = signatureFromTypedData(account, typedData);

    return { signature, timestamp, expiration };
}

function signOrder(
    config: ParadexConfig,
    account: ParadexAccount,
    orderDetails: Record<string, string>,
    timestamp: number,
): string {
    const sideForSigning = orderDetails.side === "BUY" ? "1" : "2";

    const priceForSigning = toQuantums(orderDetails.price ?? "0", 8);
    const sizeForSigning = toQuantums(orderDetails.size, 8);
    const orderTypeForSigning = shortString.encodeShortString(
        orderDetails.type,
    );
    const marketForSigning = shortString.encodeShortString(orderDetails.market);

    const message = {
        timestamp: timestamp,
        market: marketForSigning,
        side: sideForSigning,
        orderType: orderTypeForSigning,
        size: sizeForSigning,
        price: priceForSigning,
    };

    const typedData = buildOrderTypedData(message, config.starknet.chainId);
    const signature = signatureFromTypedData(account, typedData);

    return signature;
}

function buildAuthTypedData(
    message: Record<string, unknown>,
    starknetChainId: string,
) {
    const paradexDomain = buildParadexDomain(starknetChainId);
    return {
        domain: paradexDomain,
        primaryType: "Request",
        types: {
            ...DOMAIN_TYPES,
            Request: [
                { name: "method", type: "felt" },
                { name: "path", type: "felt" },
                { name: "body", type: "felt" },
                { name: "timestamp", type: "felt" },
                { name: "expiration", type: "felt" },
            ],
        },
        message,
    };
}

function buildOrderTypedData(
    message: Record<string, unknown>,
    starknetChainId: string,
) {
    const paradexDomain = buildParadexDomain(starknetChainId);
    return {
        domain: paradexDomain,
        primaryType: "Order",
        types: {
            ...DOMAIN_TYPES,
            Order: [
                { name: "timestamp", type: "felt" },
                { name: "market", type: "felt" },
                { name: "side", type: "felt" },
                { name: "orderType", type: "felt" },
                { name: "size", type: "felt" },
                { name: "price", type: "felt" },
            ],
        },
        message,
    };
}

function buildParadexDomain(starknetChainId: string) {
    return {
        name: "Paradex",
        chainId: starknetChainId,
        version: "1",
    };
}

function signatureFromTypedData(account: ParadexAccount, typedData: TypedData) {
    const msgHash = starkTypedData.getMessageHash(typedData, account.address);
    const { r, s } = ec.starkCurve.sign(msgHash, account.privateKey);
    return JSON.stringify([r.toString(), s.toString()]);
}

export function toQuantums(
    amount: BigNumber | string,
    precision: number,
): string {
    const bnAmount = typeof amount === "string" ? BigNumber(amount) : amount;
    const bnQuantums = bnAmount.multipliedBy(new BigNumber(10).pow(precision));
    return bnQuantums.integerValue(BigNumber.ROUND_FLOOR).toString();
}

export class ParadexClient {
    private readonly config: ParadexConfig;
    private readonly account: ParadexAccount;

    constructor(config: ParadexConfig, account: ParadexAccount) {
        this.config = config;
        this.account = account;
    }

    async authenticate(): Promise<string> {
        const { signature, timestamp, expiration } = signAuthRequest(this.config, this.account);
        const response = await fetch(`${this.config.apiBaseUrl}/auth`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "PARADEX-STARKNET-ACCOUNT": this.account.address,
                "PARADEX-STARKNET-SIGNATURE": signature,
                "PARADEX-TIMESTAMP": timestamp.toString(),
                "PARADEX-SIGNATURE-EXPIRATION": expiration.toString(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            throw new Error(`Authentication failed: ${response.status}`);
        }

        const data = await response.json();
        return data.jwt_token;
    }

    async getAccountInfo() {
        return getAccountInfo(this.config, this.account);
    }

    async listMarkets(market?: string) {
        return listAvailableMarkets(this.config, market);
    }

    async getPositions() {
        return getPositions(this.config, this.account);
    }

    async getOpenOrders() {
        return getOpenOrders(this.config, this.account);
    }

    async placeOrder(orderDetails: Record<string, string>) {
        return openOrder(this.config, this.account, orderDetails);
    }

    async cancelOrder(orderId: string) {
        return cancelOrder(this.config, this.account, orderId);
    }
}