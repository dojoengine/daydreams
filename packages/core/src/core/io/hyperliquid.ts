import { Hyperliquid } from "hyperliquid";
import { Logger } from "../../core/logger";
import { LogLevel } from "../types";

export interface HyperliquidCredentials {
    mainAddress: string;
    walletAddress: string;
    privateKey: string;
}

export class HyperliquidClient {
    private client: Hyperliquid;
    private mainAddress: string;
    private logger: Logger;
    private perpMeta: any;

    constructor(
        credentials: HyperliquidCredentials,
        logLevel: LogLevel = LogLevel.INFO,
        testnet: boolean = false
    ) {
        this.mainAddress = credentials.mainAddress;
        this.client = new Hyperliquid({
            enableWs: true,
            privateKey: credentials.privateKey,
            testnet,
            walletAddress: credentials.walletAddress,
        });
        this.logger = new Logger({
            level: logLevel,
            enableColors: true,
            enableTimestamp: true,
        });

        this.client.connect().catch((error) => {
            this.logger.error("HyperliquidClient", "Failed to login", {
                error,
            });
            throw error;
        });
    }

    public async placeLimitOrderInstantOrCancel(
        ticker: string,
        sz: number,
        limit_px: number,
        is_buy: boolean
    ) {
        try {
            return await this.placeOrder(ticker, sz, limit_px, is_buy, {
                limit: { tif: "Ioc" },
            });
        } catch (error) {
            this.logger.error(
                "HyperliquidClient",
                "Failed to place IOC order",
                {
                    error,
                    ticker,
                    sz,
                    limit_px,
                    is_buy,
                }
            );
            throw error;
        }
    }

    public async placeLimitOrderGoodTilCancel(
        ticker: string,
        sz: number,
        limit_px: number,
        is_buy: boolean
    ) {
        try {
            return await this.placeOrder(ticker, sz, limit_px, is_buy, {
                limit: { tif: "Gtc" },
            });
        } catch (error) {
            this.logger.error(
                "HyperliquidClient",
                "Failed to place GTC order",
                {
                    error,
                    ticker,
                    sz,
                    limit_px,
                    is_buy,
                }
            );
            throw error;
        }
    }

    public async cancelOrder(ticker: string, orderId: number) {
        try {
            return await this.client.exchange.cancelOrder({
                coin: ticker,
                o: orderId,
            });
        } catch (error) {
            this.logger.error("HyperliquidClient", "Failed to cancel order", {
                error,
                ticker,
                orderId,
            });
            throw error;
        }
    }

    public async getAccountBalancesAndPositions() {
        try {
            return await this.client.info.perpetuals.getClearinghouseState(
                this.mainAddress
            );
        } catch (error) {
            this.logger.error(
                "HyperliquidClient",
                "Failed to get account balances and positions",
                { error }
            );
            throw error;
        }
    }

    public async getOpenOrders() {
        try {
            return await this.client.info.getUserOpenOrders(this.mainAddress);
        } catch (error) {
            this.logger.error(
                "HyperliquidClient",
                "Failed to get open orders",
                {
                    error,
                }
            );
            throw error;
        }
    }

    public async marketSellPositions(tickers: string[]) {
        try {
            const positions = (await this.getAccountBalancesAndPositions())
                .assetPositions;
            return await Promise.all(
                tickers.map((ticker) =>
                    this.marketSellPosition(ticker, positions)
                )
            );
        } catch (error) {
            this.logger.error(
                "HyperliquidClient",
                "Failed to market sell positions",
                { error, tickers }
            );
            throw error;
        }
    }

    public async marketSellPosition(ticker: string, positions: any) {
        try {
            if (!ticker) return;
            if (!positions) {
                const { assetPositions } =
                    await this.getAccountBalancesAndPositions();
                positions = assetPositions;
            }
            const match = positions.find(
                (p: any) => p.position.coin === `${ticker.toUpperCase()}-PERP`
            );
            if (!match) return;
            const size = Number(match.position.szi);
            return await this.placeMarketOrder(
                ticker.toUpperCase(),
                size,
                false
            );
        } catch (error) {
            this.logger.error(
                "HyperliquidClient",
                "Failed to market sell position",
                { error, ticker }
            );
            throw error;
        }
    }

    private async loadPerpMeta() {
        try {
            if (this.perpMeta) return;
            this.perpMeta = {};
            const universe = (await this.client.info.perpetuals.getMeta())
                .universe;
            universe.forEach((token) => {
                this.perpMeta[token.name] = token.szDecimals;
            });
        } catch (error) {
            this.logger.error("HyperliquidClient", "Failed to load perp meta", {
                error,
            });
            throw error;
        }
    }

    public async placeMarketOrderUSD(
        ticker: string,
        totalprice: number,
        is_buy: boolean
    ) {
        try {
            await this.loadPerpMeta();
            const orderbook = await this.client.info.getL2Book(
                ticker + "-PERP"
            );
            const triggerPx = is_buy
                ? Number(orderbook.levels[1][3].px)
                : Number(orderbook.levels[0][3].px);
            let szDecimals = this.perpMeta[ticker + "-PERP"];
            if (szDecimals === undefined) {
                throw new Error("Can't find szDecimals for " + ticker);
            }
            const sz = Number((totalprice / triggerPx).toFixed(szDecimals));
            const result = await this.placeOrder(
                ticker,
                sz,
                triggerPx,
                is_buy,
                {
                    limit: { tif: "Ioc" },
                }
            );
            return result;
        } catch (error) {
            this.logger.error(
                "HyperliquidClient",
                "Failed to place market order USD",
                { error, ticker, totalprice, is_buy }
            );
            throw error;
        }
    }

    public async placeMarketOrder(ticker: string, sz: number, is_buy: boolean) {
        try {
            const orderbook = await this.client.info.getL2Book(
                ticker + "-PERP"
            );
            const triggerPx = is_buy
                ? Number(orderbook.levels[1][3].px)
                : Number(orderbook.levels[0][3].px);
            const result = await this.placeOrder(
                ticker,
                sz,
                triggerPx,
                is_buy,
                {
                    limit: { tif: "Ioc" },
                }
            );
            return result;
        } catch (error) {
            this.logger.error(
                "HyperliquidClient",
                "Failed to place market order",
                { error, ticker, sz, is_buy }
            );
            throw error;
        }
    }

    private async placeOrder(
        ticker: string,
        sz: number,
        limit_px: number,
        is_buy: boolean,
        order_type: object
    ) {
        try {
            return await this.client.exchange.placeOrder({
                coin: ticker + "-PERP",
                is_buy,
                sz,
                limit_px,
                order_type,
                reduce_only: false,
            });
        } catch (error) {
            this.logger.error("HyperliquidClient", "Failed to place order", {
                error,
                ticker,
                sz,
                limit_px,
                is_buy,
                order_type,
            });
            throw error;
        }
    }
}

// Example usage:
/*
const hyperliquid = new HyperliquidClient(
    {
        mainAddress: env.HYPERLIQUID_MAIN_ADDRESS,
        walletAddress: env.HYPERLIQUID_WALLET_ADDRESS,
        privateKey: env.HYPERLIQUID_PRIVATE_KEY,
    },
    loglevel
);

await hyperliquid.placeLimitOrderGoodTilCancel("BTC", 0.1, 60000, true);
await hyperliquid.getAccountBalancesAndPositions();
await hyperliquid.placeLimitOrderInstantOrCancel("ETH", 1, 3000, false);
await hyperliquid.getOpenOrders();
await hyperliquid.placeMarketOrder("BTC", 0.1, true);
await hyperliquid.marketSellPositions(["BTC", "ETH"]);
await hyperliquid.placeMarketOrderUSD("ETH", 5000, true);
await hyperliquid.cancelOrder("BTC", 1234);
*/
