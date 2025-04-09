import { EventEmitter } from 'events';
import "./websocket-polyfill";

/**
 * Room types for the WebSocket data stream
 */
export enum DatastreamRoom {
    // Token/pool updates
    LATEST = 'latest',
    // Price updates
    PRICE_BY_TOKEN = 'price-by-token',
    PRICE_BY_POOL = 'price',
    // Transactions
    TOKEN_TRANSACTIONS = 'transaction',
    // Wallet transactions
    WALLET_TRANSACTIONS = 'wallet',
    // Pump.fun stages
    GRADUATING = 'graduating',
    GRADUATED = 'graduated',
    // Metadata and holders
    METADATA = 'metadata',
    HOLDERS = 'holders',
    // Token changes
    TOKEN_CHANGES = 'token',
    POOL_CHANGES = 'pool'
}

/**
 * Configuration for the Datastream client
 */
export interface DatastreamConfig {
    /**
     * WebSocket URL for the data stream found on your Dashboard.
     */
    wsUrl: string;
    /**
     * Whether to automatically reconnect on disconnect
     * @default true
     */
    autoReconnect?: boolean;
    /**
     * Initial reconnect delay in milliseconds
     * @default 2500
     */
    reconnectDelay?: number;
    /**
     * Maximum reconnect delay in milliseconds
     * @default 4500
     */
    reconnectDelayMax?: number;
    /**
     * Randomization factor for reconnect delay
     * @default 0.5
     */
    randomizationFactor?: number;
}

interface SubscribeResponse<T = any> {
    room: string;
    /**
     * Register a listener for this subscription
     * @param callback Function to handle incoming data
     * @returns Object with unsubscribe method
     */
    on(callback: (data: T) => void): {
        unsubscribe: () => void;
    };
}

/**
 * Subscription methods for the Datastream client
 */
class SubscriptionMethods {
    private ds: Datastream;
    public price: PriceSubscriptions;
    public tx: TransactionSubscriptions;

    constructor(datastream: Datastream) {
        this.ds = datastream;
        this.price = new PriceSubscriptions(datastream);
        this.tx = new TransactionSubscriptions(datastream);
    }

    /**
     * Subscribe to latest tokens and pools
     */
    latest(): SubscribeResponse<PoolUpdate> {
        return this.ds._subscribe<PoolUpdate>('latest');
    }

    /**
     * Subscribe to graduating tokens
     * @param marketCapThresholdSOL Optional market cap threshold in SOL
     */
    graduating(marketCapThresholdSOL?: number): SubscribeResponse<PoolUpdate> {
        const room = marketCapThresholdSOL
            ? `graduating:sol:${marketCapThresholdSOL}`
            : 'graduating';
        return this.ds._subscribe<PoolUpdate>(room);
    }

    /**
     * Subscribe to graduated tokens
     */
    graduated(): SubscribeResponse<PoolUpdate> {
        return this.ds._subscribe<PoolUpdate>('graduated');
    }

    /**
     * Subscribe to token metadata updates
     * @param tokenAddress The token address
     */
    metadata(tokenAddress: string): SubscribeResponse<TokenMetadata> {
        return this.ds._subscribe<TokenMetadata>(`metadata:${tokenAddress}`);
    }

    /**
     * Subscribe to holder count updates for a token
     * @param tokenAddress The token address
     */
    holders(tokenAddress: string): SubscribeResponse<HolderUpdate> {
        return this.ds._subscribe<HolderUpdate>(`holders:${tokenAddress}`);
    }

    /**
     * Subscribe to token changes (any pool)
     * @param tokenAddress The token address
     */
    token(tokenAddress: string): SubscribeResponse<PoolUpdate> {
        return this.ds._subscribe<PoolUpdate>(`token:${tokenAddress}`);
    }

    /**
     * Subscribe to pool changes
     * @param poolId The pool address
     */
    pool(poolId: string): SubscribeResponse<PoolUpdate> {
        return this.ds._subscribe<PoolUpdate>(`pool:${poolId}`);
    }
}

/**
 * Price-related subscription methods
 */
class PriceSubscriptions {
    private ds: Datastream;

    constructor(datastream: Datastream) {
        this.ds = datastream;
    }

    /**
     * Subscribe to price updates for a token's primary/largest pool
     * @param tokenAddress The token address
     */
    token(tokenAddress: string): SubscribeResponse<PriceUpdate> {
        return this.ds._subscribe<PriceUpdate>(`price-by-token:${tokenAddress}`);
    }

    /**
     * Subscribe to all price updates for a token across all pools
     * @param tokenAddress The token address
     */
    allPoolsForToken(tokenAddress: string): SubscribeResponse<PriceUpdate> {
        return this.ds._subscribe<PriceUpdate>(`price:${tokenAddress}`);
    }

    /**
     * Subscribe to price updates for a specific pool
     * @param poolId The pool address
     */
    pool(poolId: string): SubscribeResponse<PriceUpdate> {
        return this.ds._subscribe<PriceUpdate>(`price:${poolId}`);
    }
}

/**
 * Transaction-related subscription methods
 */
class TransactionSubscriptions {
    private ds: Datastream;

    constructor(datastream: Datastream) {
        this.ds = datastream;
    }

    /**
     * Subscribe to transactions for a token across all pools
     * @param tokenAddress The token address
     */
    token(tokenAddress: string): SubscribeResponse<TokenTransaction> {
        return this.ds._subscribe<TokenTransaction>(`transaction:${tokenAddress}`);
    }

    /**
     * Subscribe to transactions for a specific token and pool
     * @param tokenAddress The token address
     * @param poolId The pool address
     */
    pool(tokenAddress: string, poolId: string): SubscribeResponse<TokenTransaction> {
        return this.ds._subscribe<TokenTransaction>(`transaction:${tokenAddress}:${poolId}`);
    }

    /**
     * Subscribe to transactions for a specific wallet
     * @param walletAddress The wallet address
     */
    wallet(walletAddress: string): SubscribeResponse<WalletTransaction> {
        return this.ds._subscribe<WalletTransaction>(`wallet:${walletAddress}`);
    }
}

/**
 * WebSocket service for real-time data streaming from Solana Tracker
 */
export class Datastream extends EventEmitter {
    public subscribe: SubscriptionMethods;

    private wsUrl: string;
    private socket: WebSocket | null = null;
    private transactionSocket: WebSocket | null = null;
    private reconnectAttempts = 0;
    private reconnectDelay: number;
    private reconnectDelayMax: number;
    private randomizationFactor: number;
    private subscribedRooms = new Set<string>();
    private transactions = new Set<string>();
    private autoReconnect: boolean;
    private isConnecting = false;

    /**
     * Creates a new Datastream client for real-time Solana Tracker data
     * @param config Configuration options
     */
    constructor(config: DatastreamConfig) {
        super();
        this.wsUrl = config.wsUrl || '';
        this.autoReconnect = config.autoReconnect !== false;
        this.reconnectDelay = config.reconnectDelay || 2500;
        this.reconnectDelayMax = config.reconnectDelayMax || 4500;
        this.randomizationFactor = config.randomizationFactor || 0.5;
        this.subscribe = new SubscriptionMethods(this);
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', this.disconnect.bind(this));
        }
    }

    /**
     * Connects to the WebSocket server
     * @returns Promise that resolves when connected
     */
    async connect(): Promise<void> {
        if (this.socket && this.transactionSocket) {
            return;
        }

        if (this.isConnecting) {
            return;
        }

        this.isConnecting = true;

        try {
            await Promise.all([
                this.createSocket('main'),
                this.createSocket('transaction')
            ]);

            this.isConnecting = false;
            this.emit('connected');
        } catch (e) {
            this.isConnecting = false;
            this.emit('error', e);

            if (this.autoReconnect) {
                this.reconnect();
            }
        }
    }

    /**
     * Creates a WebSocket connection
     * @param type Socket type ('main' or 'transaction')
     * @returns Promise that resolves when connected
     */
    private createSocket(type: 'main' | 'transaction'): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const socket = new WebSocket(this.wsUrl);

                socket.onopen = () => {
                    if (type === 'main') {
                        this.socket = socket;
                    } else {
                        this.transactionSocket = socket;
                    }

                    this.reconnectAttempts = 0;
                    this.setupSocketListeners(socket, type);
                    this.resubscribeToRooms();
                    resolve();
                };

                socket.onerror = (error) => {
                    reject(error);
                };

            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Sets up WebSocket event listeners
     * @param socket The WebSocket connection
     * @param type Socket type ('main' or 'transaction')
     */
    private setupSocketListeners(socket: WebSocket, type: 'main' | 'transaction'): void {
        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'message') {
                    // Deduplicate transactions
                    if (message.data?.tx && this.transactions.has(message.data.tx)) {
                        return;
                    } else if (message.data?.tx) {
                        this.transactions.add(message.data.tx);
                    }

                    // Special handling for price events
                    if (message.room.includes('price:')) {
                        this.emit(`price-by-token:${message.data.token}`, message.data);
                    }

                    this.emit(message.room, message.data);
                }
            } catch (error) {
                this.emit('error', new Error(`Error processing message: ${error}`));
            }
        };

        socket.onclose = () => {
            this.emit('disconnected', type);

            if (type === 'main') {
                this.socket = null;
            } else if (type === 'transaction') {
                this.transactionSocket = null;
            }

            if (this.autoReconnect) {
                this.reconnect();
            }
        };
    }

    /**
     * Disconnects from the WebSocket server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }

        if (this.transactionSocket) {
            this.transactionSocket.close();
            this.transactionSocket = null;
        }

        this.subscribedRooms.clear();
        this.transactions.clear();
        this.emit('disconnected', 'all');
    }

    /**
     * Handles reconnection to the WebSocket server
     */
    private reconnect(): void {
        if (!this.autoReconnect) return;

        this.emit('reconnecting', this.reconnectAttempts);

        const delay = Math.min(
            this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
            this.reconnectDelayMax
        );

        const jitter = delay * this.randomizationFactor;
        const reconnectDelay = delay + Math.random() * jitter;

        setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
        }, reconnectDelay);
    }

    /**
     * Subscribes to a data room
     * @param room The room name to join
     * @returns Response with room name and on() method for listening
     * @internal Used by SubscriptionMethods
     */
    _subscribe<T = any>(room: string): SubscribeResponse<T> {
        this.subscribedRooms.add(room);

        const socket = room.includes('transaction')
            ? this.transactionSocket
            : this.socket;

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'join', room }));
        } else {
            // If not connected, we'll subscribe when connection is established
            this.connect();
        }

        return {
            room,
            on: (callback: (data: T) => void) => {
                // Create a wrapper that handles arrays automatically
                const wrappedCallback = (data: T | T[]) => {
                    if (Array.isArray(data)) {
                        // If data is an array, call the callback for each item
                        data.forEach(item => callback(item));
                    } else {
                        // If data is a single item, call the callback directly
                        callback(data);
                    }
                };

                this.on(room, wrappedCallback as any);

                return {
                    unsubscribe: () => {
                        this.removeListener(room, wrappedCallback as any);
                    }
                };
            }
        };
    }


    public on(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    public once(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.once(event, listener);
    }

    public off(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.off(event, listener);
    }

    public removeListener(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.removeListener(event, listener);
    }

    public removeAllListeners(event?: string | symbol): this {
        return super.removeAllListeners(event);
    }

    public listeners(event: string | symbol): Function[] {
        return super.listeners(event);
    }

    /**
     * Unsubscribes from a data room
     * @param room The room name to leave
     * @returns Reference to this instance for chaining
     */
    unsubscribe(room: string): Datastream {
        this.subscribedRooms.delete(room);

        const socket = room.includes('transaction')
            ? this.transactionSocket
            : this.socket;

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'leave', room }));
        }

        return this;
    }

    /**
     * Resubscribes to all previously subscribed rooms after reconnection
     */
    private resubscribeToRooms(): void {
        if (
            this.socket &&
            this.socket.readyState === WebSocket.OPEN &&
            this.transactionSocket &&
            this.transactionSocket.readyState === WebSocket.OPEN
        ) {
            for (const room of this.subscribedRooms) {
                const socket = room.includes('transaction')
                    ? this.transactionSocket
                    : this.socket;

                socket.send(JSON.stringify({ type: 'join', room }));
            }
        }
    }

    /**
     * Get the current connection status
     * @returns True if connected, false otherwise
     */
    isConnected(): boolean {
        return (
            !!this.socket &&
            this.socket.readyState === WebSocket.OPEN &&
            !!this.transactionSocket &&
            this.transactionSocket.readyState === WebSocket.OPEN
        );
    }
}

// Export types for specific data structures
export interface TokenTransaction {
    tx: string;
    amount: number;
    priceUsd: number;
    volume: number;
    volumeSol?: number;
    type: 'buy' | 'sell';
    wallet: string;
    time: number;
    program: string;
    pools?: string[];
}

export interface PriceUpdate {
    price: number;
    price_quote: number;
    pool: string;
    token: string;
    time: number;
}

export interface PoolUpdate {
    liquidity: {
        quote: number;
        usd: number;
    };
    price: {
        quote: number;
        usd: number;
    };
    tokenSupply: number;
    lpBurn: number;
    tokenAddress: string;
    marketCap: {
        quote: number;
        usd: number;
    };
    decimals: number;
    security: {
        freezeAuthority: string | null;
        mintAuthority: string | null;
    };
    quoteToken: string;
    market: string;
    deployer?: string;
    lastUpdated: number;
    createdAt?: number;
    poolId: string;
    curvePercentage?: number;
    curve?: string;
    txns?: {
        buys: number;
        total: number;
        volume: number;
        sells: number;
    };
    bundleId?: string;
}

export interface HolderUpdate {
    total: number;
}

export interface WalletTransaction {
    tx: string;
    amount: number;
    priceUsd: number;
    solVolume: number;
    volume: number;
    type: 'buy' | 'sell';
    wallet: string;
    time: number;
    program: string;
    token?: {
        from: {
            name: string;
            symbol: string;
            image?: string;
            decimals: number;
            amount: number;
            address: string;
        };
        to: {
            name: string;
            symbol: string;
            image?: string;
            decimals: number;
            amount: number;
            address: string;
        };
    };
}

export interface TokenMetadata {
    name: string;
    symbol: string;
    mint: string;
    uri?: string;
    decimals: number;
    hasFileMetaData?: boolean;
    createdOn?: string;
    description?: string;
    image?: string;
    showName?: boolean;
    twitter?: string;
    telegram?: string;
    website?: string;
    strictSocials?: {
        twitter?: string;
        telegram?: string;
        website?: string;
    };
}