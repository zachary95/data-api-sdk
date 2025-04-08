# Solana Tracker - Data API SDK

Official JavaScript/TypeScript client for the [Solana Tracker Data API](https://www.solanatracker.io/data-api).

[![npm version](https://badge.fury.io/js/@solanatracker%2Fdata-api.svg)](https://www.npmjs.com/package/@solanatracker/data-api)

## Features

- Full TypeScript support with detailed interfaces for all API responses
- Comprehensive coverage of all Solana Tracker Data API endpoints
- Built-in error handling with specific error types
- Compatible with both Node.js and browser environments

## Installation

Install the package using npm:

```bash
npm install @solanatracker/data-api
```

Or with yarn:

```bash
yarn add @solanatracker/data-api
```

## Quick Start

```typescript
import { Client } from '@solanatracker/data-api';

// Initialize the client with your API key
const client = new Client({
  apiKey: 'YOUR_API_KEY',
});

// Fetch token information
const fetchTokenInfo = async () => {
  try {
    const tokenInfo = await client.getTokenInfo('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R');
    console.log('Token info:', tokenInfo);
  } catch (error) {
    console.error('Error:', error);
  }
};

fetchTokenInfo();
```

## API Documentation

The library provides methods for all endpoints in the Solana Tracker Data API.

### Token Endpoints

```typescript
// Get token information
const tokenInfo = await client.getTokenInfo('tokenAddress');

// Get token by pool address
const tokenByPool = await client.getTokenByPool('poolAddress');

// Get token holders
const tokenHolders = await client.getTokenHolders('tokenAddress');

// Get top token holders
const topHolders = await client.getTopHolders('tokenAddress');

// Get all-time high price for a token
const athPrice = await client.getAthPrice('tokenAddress');

// Get tokens by deployer wallet
const deployerTokens = await client.getTokensByDeployer('walletAddress');

// Search for tokens
const searchResults = await client.searchTokens({
  query: 'SOL',
  minLiquidity: 100000,
  sortBy: 'marketCapUsd',
  sortOrder: 'desc',
});

// Get latest tokens
const latestTokens = await client.getLatestTokens(1);

// Get information about multiple tokens
const multipleTokens = await client.getMultipleTokens([
  'So11111111111111111111111111111111111111112',
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
]);

// Get trending tokens
const trendingTokens = await client.getTrendingTokens('1h');

// Get tokens by volume
const volumeTokens = await client.getTokensByVolume('24h');

// Get token overview (latest, graduating, graduated)
const tokenOverview = await client.getTokenOverview();

// Get graduated tokens
const graduatedTokens = await client.getGraduatedTokens();
```

### Price Endpoints

```typescript
// Get token price
const tokenPrice = await client.getPrice('tokenAddress', true); // Include price changes

// Get historic price information
const priceHistory = await client.getPriceHistory('tokenAddress');

// Get price at a specific timestamp
const timestampPrice = await client.getPriceAtTimestamp('tokenAddress', 1690000000);

// Get price range (lowest/highest in time range)
const priceRange = await client.getPriceRange('tokenAddress', 1690000000, 1695000000);

// Get price using POST method
const postedPrice = await client.postPrice('tokenAddress');

// Get multiple token prices
const multiplePrices = await client.getMultiplePrices([
  'So11111111111111111111111111111111111111112',
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
]);

// Get multiple token prices using POST
const postedMultiplePrices = await client.postMultiplePrices([
  'So11111111111111111111111111111111111111112',
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
]);
```

### Wallet Endpoints

```typescript
// Get basic wallet information
const walletBasic = await client.getWalletBasic('walletAddress');

// Get all tokens in a wallet
const wallet = await client.getWallet('walletAddress');

// Get wallet tokens with pagination
const walletPage = await client.getWalletPage('walletAddress', 2);

// Get wallet trades
const walletTrades = await client.getWalletTrades('walletAddress', undefined, true, true, false);
```

### Trade Endpoints

```typescript
// Get trades for a token
const tokenTrades = await client.getTokenTrades('tokenAddress');

// Get trades for a specific token and pool
const poolTrades = await client.getPoolTrades('tokenAddress', 'poolAddress');

// Get trades for a specific token, pool, and wallet
const userPoolTrades = await client.getUserPoolTrades('tokenAddress', 'poolAddress', 'walletAddress');

// Get trades for a specific token and wallet
const userTokenTrades = await client.getUserTokenTrades('tokenAddress', 'walletAddress');
```

### Chart Endpoints

```typescript
// Get OHLCV data for a token
const chartData = await client.getChartData('tokenAddress', '1h', 1690000000, 1695000000);

// Get OHLCV data for a specific token and pool
const poolChartData = await client.getPoolChartData('tokenAddress', 'poolAddress', '15m');

// Get holder count chart data
const holdersChart = await client.getHoldersChart('tokenAddress', '1d');
```

### PnL Endpoints

```typescript
// Get PnL data for all positions of a wallet
const walletPnL = await client.getWalletPnL('walletAddress', true, true, false);

// Get the first 100 buyers of a token with PnL data
const firstBuyers = await client.getFirstBuyers('tokenAddress');

// Get PnL data for a specific token in a wallet
const tokenPnL = await client.getTokenPnL('walletAddress', 'tokenAddress');
```

### Top Traders Endpoints

```typescript
// Get the most profitable traders across all tokens
const topTraders = await client.getTopTraders(1, true, 'total');

// Get top 100 traders by PnL for a token
const tokenTopTraders = await client.getTokenTopTraders('tokenAddress');
```

### Additional Endpoints

```typescript
// Get detailed stats for a token
const tokenStats = await client.getTokenStats('tokenAddress');

// Get detailed stats for a specific token and pool
const poolStats = await client.getPoolStats('tokenAddress', 'poolAddress');
```

## Error Handling

The library includes specific error types for robust error handling:

```typescript
import { Client, DataApiError, RateLimitError, ValidationError } from '@solanatracker/data-api';

try {
  const tokenInfo = await client.getTokenInfo('invalid-address');
} catch (error) {
  if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded. Retry after:', error.retryAfter, 'seconds');
  } else if (error instanceof ValidationError) {
    console.error('Validation error:', error.message);
  } else if (error instanceof DataApiError) {
    console.error('API error:', error.message, 'Status:', error.status);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Subscription Plans

Solana Tracker offers a range of subscription plans with varying rate limits:

| Plan            | Price         | Requests/Month | Rate Limit |
|-----------------|---------------|----------------|------------|
| Free            | Free          | 10,000         | 1/second   |
| Starter         | €14.99/month  | 50,000         | None       |
| Advanced        | €50/month     | 200,000        | None       |
| Pro             | €200/month    | 1,000,000      | None       |
| Premium         | €397/month    | 10,000,000     | None       |
| Business        | €599/month    | 25,000,000     | None       |
| Enterprise      | €1499/month   | 100,000,000    | None       |
| Enterprise Plus | Custom        | Unlimited      | None       |

Visit [Solana Tracker](https://www.solanatracker.io/account/data-api) to sign up and get your API key.

## License

This project is licensed under the [MIT License](LICENSE).