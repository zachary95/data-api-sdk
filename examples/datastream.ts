// examples/datastream.ts
import { Datastream } from '@solanatracker/data-api';

// Initialize the Datastream with configuration
const dataStream = new Datastream({
  wsUrl: 'YOUR_WS_URL', // Get this from your Solana Tracker Dashboard
  autoReconnect: true, // Auto reconnect on disconnect (default: true)
  reconnectDelay: 2500, // Initial reconnect delay in ms (default: 2500)
  reconnectDelayMax: 4500, // Maximum reconnect delay in ms (default: 4500)
  randomizationFactor: 0.5, // Randomization factor for reconnect delay (default: 0.5)
});

// ************************************
// Basic connection management examples
// ************************************

// Connect to the WebSocket server
const connect = async () => {
  try {
    await dataStream.connect();
    console.log('Successfully connected to Datastream');
  } catch (error) {
    console.error('Failed to connect:', error);
  }
};

// Check connection status
const checkConnection = () => {
  const isConnected = dataStream.isConnected();
  console.log(`Datastream connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
  return isConnected;
};

// Disconnect from the WebSocket server
const disconnect = () => {
  dataStream.disconnect();
  console.log('Disconnected from Datastream');
};

// Register connection event handlers
dataStream.on('connected', () => console.log('Event: Connected to Datastream'));
dataStream.on('disconnected', (type) => console.log(`Event: Disconnected from Datastream (${type})`));
dataStream.on('reconnecting', (attempts) => console.log(`Event: Reconnecting to Datastream (attempt ${attempts})`));
dataStream.on('error', (error) => console.error('Event: Datastream error:', error));

// Connect to start receiving data
connect();

// Example token and pool addresses for demonstration
const TOKEN_ADDRESS = '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'; // Example token
const POOL_ADDRESS = 'FJtaAZd6tXNCFGNqXj83JUZqZ5jKQrLpjPTUmAgBGsX4'; // Example pool
const WALLET_ADDRESS = 'YourWalletAddressHere'; // Replace with actual wallet address

// ************************************
// Top-level subscription examples
// ************************************

// Subscribe to latest tokens and pools
const subscribeToLatest = () => {
  const subscription = dataStream.subscribe.latest().on((data) => {
    console.log('Latest token/pool update:', data);
    console.log(`Token: ${data.tokenAddress}`);
    console.log(`Market Cap: $${data.marketCap?.usd.toLocaleString()}`);
  });
  
  return subscription; // Contains unsubscribe() method
};

// Subscribe to graduating tokens
const subscribeToGraduating = (marketCapThresholdSOL?: number) => {
  const subscription = dataStream.subscribe.graduating(marketCapThresholdSOL).on((data) => {
    console.log('Graduating token:', data);
    console.log(`Token: ${data.tokenAddress}`);
    console.log(`Market Cap: $${data.marketCap?.usd.toLocaleString()}`);
  });
  
  return subscription;
};

// Subscribe to graduated tokens
const subscribeToGraduated = () => {
  const subscription = dataStream.subscribe.graduated().on((data) => {
    console.log('Graduated token:', data);
    console.log(`Token: ${data.tokenAddress}`);
    console.log(`Market Cap: $${data.marketCap?.usd.toLocaleString()}`);
  });
  
  return subscription;
};

// Subscribe to token metadata updates
const subscribeToMetadata = (tokenAddress: string = TOKEN_ADDRESS) => {
  const subscription = dataStream.subscribe.metadata(tokenAddress).on((data) => {
    console.log('Token metadata update:', data);
    console.log(`Name: ${data.name}`);
    console.log(`Symbol: ${data.symbol}`);
    console.log(`Description: ${data.description || 'N/A'}`);
  });
  
  return subscription;
};

// Subscribe to holder count updates
const subscribeToHolders = (tokenAddress: string = TOKEN_ADDRESS) => {
  const subscription = dataStream.subscribe.holders(tokenAddress).on((data) => {
    console.log('Holder count update:', data);
    console.log(`Total holders: ${data.total}`);
  });
  
  return subscription;
};

// Subscribe to token changes (any pool)
const subscribeToTokenChanges = (tokenAddress: string = TOKEN_ADDRESS) => {
  const subscription = dataStream.subscribe.token(tokenAddress).on((data) => {
    console.log('Token update:', data);
    console.log(`Price: $${data.price?.usd}`);
    console.log(`Liquidity: $${data.liquidity?.usd}`);
    console.log(`Market Cap: $${data.marketCap?.usd}`);
  });
  
  return subscription;
};

// Subscribe to pool changes
const subscribeToPoolChanges = (poolId: string = POOL_ADDRESS) => {
  const subscription = dataStream.subscribe.pool(poolId).on((data) => {
    console.log('Pool update:', data);
    console.log(`Pool ID: ${data.poolId}`);
    console.log(`Token: ${data.tokenAddress}`);
    console.log(`Price: $${data.price?.usd}`);
    console.log(`Liquidity: $${data.liquidity?.usd}`);
  });
  
  return subscription;
};

// ************************************
// Price subscription examples
// ************************************

// Subscribe to token price updates (main/largest pool)
const subscribeToTokenPrice = (tokenAddress: string = TOKEN_ADDRESS) => {
  const subscription = dataStream.subscribe.price.token(tokenAddress).on((data) => {
    console.log('Token price update:', data);
    console.log(`Price: $${data.price}`);
    console.log(`Token: ${data.token}`);
    console.log(`Pool: ${data.pool}`);
    console.log(`Time: ${new Date(data.time).toLocaleTimeString()}`);
  });
  
  return subscription;
};

// Subscribe to all price updates for a token (across all pools)
const subscribeToAllTokenPrices = (tokenAddress: string = TOKEN_ADDRESS) => {
  const subscription = dataStream.subscribe.price.allPoolsForToken(tokenAddress).on((data) => {
    console.log('Token price update (all pools):', data);
    console.log(`Price: $${data.price}`);
    console.log(`Quote price: ${data.price_quote}`);
    console.log(`Pool: ${data.pool}`);
    console.log(`Time: ${new Date(data.time).toLocaleTimeString()}`);
  });
  
  return subscription;
};

// Subscribe to price updates for a specific pool
const subscribeToPoolPrice = (poolId: string = POOL_ADDRESS) => {
  const subscription = dataStream.subscribe.price.pool(poolId).on((data) => {
    console.log('Pool price update:', data);
    console.log(`Price: $${data.price}`);
    console.log(`Token: ${data.token}`);
    console.log(`Pool: ${data.pool}`);
    console.log(`Time: ${new Date(data.time).toLocaleTimeString()}`);
  });
  
  return subscription;
};

// ************************************
// Transaction subscription examples
// ************************************

// Subscribe to transactions for a token (across all pools)
const subscribeToTokenTransactions = (tokenAddress: string = TOKEN_ADDRESS) => {
  const subscription = dataStream.subscribe.tx.token(tokenAddress).on((data) => {
    // The Datastream will automatically handle arrays of transactions
    console.log(`${data.type.toUpperCase()} transaction`);
    console.log(`Transaction ID: ${data.tx}`);
    console.log(`Amount: ${data.amount}`);
    console.log(`Price: $${data.priceUsd}`);
    console.log(`Volume: $${data.volume}`);
    console.log(`Wallet: ${data.wallet}`);
    console.log(`Time: ${new Date(data.time).toLocaleTimeString()}`);
    console.log('---');
  });
  
  return subscription;
};

// Subscribe to transactions for a specific token and pool
const subscribeToPoolTransactions = (
  tokenAddress: string = TOKEN_ADDRESS, 
  poolId: string = POOL_ADDRESS
) => {
  const subscription = dataStream.subscribe.tx.pool(tokenAddress, poolId).on((data) => {
    console.log(`Pool ${data.type.toUpperCase()} transaction`);
    console.log(`Transaction ID: ${data.tx}`);
    console.log(`Amount: ${data.amount}`);
    console.log(`Price: $${data.priceUsd}`);
    console.log(`Volume: $${data.volume}`);
    console.log(`Wallet: ${data.wallet}`);
    console.log(`Time: ${new Date(data.time).toLocaleTimeString()}`);
    console.log('---');
  });
  
  return subscription;
};

// Subscribe to transactions for a specific wallet
const subscribeToWalletTransactions = (walletAddress: string = WALLET_ADDRESS) => {
  const subscription = dataStream.subscribe.tx.wallet(walletAddress).on((data) => {
    console.log(`Wallet ${data.type.toUpperCase()} transaction`);
    console.log(`Transaction ID: ${data.tx}`);
    console.log(`Amount: ${data.amount}`);
    console.log(`Price: $${data.priceUsd}`);
    console.log(`Volume: $${data.volume}`);
    console.log(`SOL Volume: ${data.solVolume}`);
    
    if (data.token) {
      console.log('Token Details:');
      console.log(`From: ${data.token.from.name} (${data.token.from.symbol})`);
      console.log(`To: ${data.token.to.name} (${data.token.to.symbol})`);
    }
    
    console.log(`Time: ${new Date(data.time).toLocaleTimeString()}`);
    console.log('---');
  });
  
  return subscription;
};

// ************************************
// Combined example demonstrating multiple subscriptions
// ************************************

const runCombinedExample = async () => {
  // Connect to the datastream
  await dataStream.connect();
  
  console.log('Setting up subscriptions...');
  
  // Track basic token info
  const tokenAddress = TOKEN_ADDRESS;
  
  // Subscribe to price updates
  const priceSubscription = dataStream.subscribe.price.token(tokenAddress).on((priceData) => {
    console.log(`Price Update: $${priceData.price}`);
  });
  
  // Subscribe to transactions
  const txSubscription = dataStream.subscribe.tx.token(tokenAddress).on((tx) => {
    console.log(`Transaction: ${tx.type} ${tx.amount} at $${tx.priceUsd}`);
  });
  
  // Subscribe to holder updates
  const holderSubscription = dataStream.subscribe.holders(tokenAddress).on((holderData) => {
    console.log(`Holders: ${holderData.total}`);
  });
  
  // Subscribe to latest tokens
  const latestSubscription = dataStream.subscribe.latest().on((tokenData) => {
    console.log(`New Token: ${tokenData.tokenAddress}`);
  });
  
  console.log('All subscriptions active! Monitoring for 30 seconds...');
  
  // After 30 seconds, unsubscribe from everything
  setTimeout(() => {
    console.log('Cleaning up subscriptions...');
    
    priceSubscription.unsubscribe();
    txSubscription.unsubscribe();
    holderSubscription.unsubscribe();
    latestSubscription.unsubscribe();
    
    console.log('All subscriptions removed.');
    dataStream.disconnect();
  }, 30000);
};

// ************************************
// Example execution
// ************************************

// To run any of the examples, uncomment the relevant line below
// or call the functions in your application

// subscribeToLatest();
// subscribeToGraduating();
// subscribeToGraduated();
// subscribeToMetadata(TOKEN_ADDRESS);
// subscribeToHolders(TOKEN_ADDRESS);
// subscribeToTokenChanges(TOKEN_ADDRESS);
// subscribeToPoolChanges(POOL_ADDRESS);
// subscribeToTokenPrice(TOKEN_ADDRESS);
// subscribeToAllTokenPrices(TOKEN_ADDRESS);
// subscribeToPoolPrice(POOL_ADDRESS);
// subscribeToTokenTransactions(TOKEN_ADDRESS);
// subscribeToPoolTransactions(TOKEN_ADDRESS, POOL_ADDRESS);
// subscribeToWalletTransactions(WALLET_ADDRESS);

// OR run the combined example:
// runCombinedExample();
