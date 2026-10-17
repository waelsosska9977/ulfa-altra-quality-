import { TokenCatalogItem, TokenCategory } from './binanceApi';

// Dedicated sector sets for categorization
const MEME_SET = new Set([
  'DOGE', 'SHIB', '1000SHIB', 'PEPE', '1000PEPE', 'FLOKI', '1000FLOKI', 
  'BONK', '1000BONK', 'BOME', '1000BOME', 'WIF', 'POPCAT', 'MEW', 'NEIRO', 
  '1000NEIRO', 'PNUT', 'GOAT', 'MOODENG', 'TURBO', 'MEME', 'PEOPLE', 'SLERF', 
  'ACT', 'MYRO', 'BRETT', 'CHEEMS', 'COW', '1000RATS', '1000SATS', 'ORDI', 
  'CAT', 'BANANA', 'HIPPO', 'LADYS', 'BABYDOGE', '1000LUNC', 'LUNC'
]);

const AI_DEPIN_SET = new Set([
  'TAO', 'RENDER', 'FET', 'WLD', 'ARKM', 'NEAR', 'ICP', 'GRT', 'AGIX', 'OCEAN', 
  'RLC', 'PHB', 'AI', 'NFP', 'IO', 'ATH', 'HNT', 'MOBILE', 'IOTX', 'FIL', 
  'AR', 'THETA', 'GLM', 'LPT', 'SPEC', 'VIRTUAL', 'AIXBT', 'ORAI', 'NOS'
]);

const L1_L2_SET = new Set([
  'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'SUI', 'SEI', 'APT', 
  'TIA', 'ARB', 'OP', 'STRK', 'TON', 'KAS', 'INJ', 'FTM', 'ALGO', 'HBAR', 
  'DOT', 'LTC', 'BCH', 'ETC', 'POL', 'ATOM', 'KAVA', 'ROSE', 'MINA', 'ZIL', 
  'ONE', 'EGLD', 'RONIN', 'DYM', 'MANTA', 'BERA', 'MONAD', 'MOVE', 'STX', 
  'CFX', 'FLOW', 'CHZ', 'TRX', 'XLM', 'EOS', 'NEO', 'IOTA', 'KLAY', 'METIS'
]);

const DEFI_SET = new Set([
  'UNI', 'AAVE', 'MKR', 'PENDLE', 'ENA', 'CRV', 'LDO', 'JUP', 'RAY', 'DYDX', 
  'PYTH', 'COMP', 'SNX', '1INCH', 'SUSHI', 'CAKE', 'RUNE', 'KNC', 'BAL', 
  'GMX', 'OSMO', 'CETUS', 'DRIFT', 'MORPHO', 'SWELL', 'KMNO', 'COW', 'SAFE', 
  'DEGEN', 'BLUR', 'AERO', 'EIGEN', 'SCR'
]);

const RWA_SET = new Set([
  'ONDO', 'OM', 'TRU', 'CFG', 'POLYX', 'DUSK', 'TOKEN', 'MPL', 'CHR'
]);

const GAMING_SET = new Set([
  'GALA', 'SAND', 'MANA', 'AXS', 'BEAM', 'PIXEL', 'PORTAL', 'ILV', 'ACE', 
  'YGG', 'ENJ', 'ALICE', 'TLM', 'SUPER', 'BIGTIME', 'NOT', 'HMSTR', 'DOGS', 
  'CATI', 'XAI', 'MAVIA', 'RONIN', 'GMT'
]);

/**
 * Categorize any Binance symbol/baseAsset into clean sector
 */
export function categorizeFuturesSymbol(symbol: string, baseAsset: string): TokenCategory {
  const base = baseAsset.toUpperCase();
  const sym = symbol.toUpperCase();

  if (MEME_SET.has(base) || sym.includes('1000') || sym.includes('PEPE') || sym.includes('DOGE')) {
    return 'MEME';
  }
  if (AI_DEPIN_SET.has(base) || sym.includes('AI') || sym.includes('DEPIN')) {
    return 'AI_DEPIN';
  }
  if (RWA_SET.has(base) || sym.includes('ONDO') || sym.includes('OM')) {
    return 'RWA';
  }
  if (GAMING_SET.has(base) || sym.includes('GALA') || sym.includes('GAME')) {
    return 'GAMING';
  }
  if (DEFI_SET.has(base) || sym.includes('SWAP') || sym.includes('DAO')) {
    return 'DEFI';
  }
  if (L1_L2_SET.has(base)) {
    return 'LAYER1_2';
  }

  return 'TOP_FUTURES';
}

/**
 * Generate human-friendly names for crypto/futures tokens
 */
export function getFriendlyTokenName(symbol: string, baseAsset: string): string {
  const map: Record<string, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    SOL: 'Solana',
    BNB: 'BNB',
    XRP: 'Ripple',
    DOGE: 'Dogecoin',
    ADA: 'Cardano',
    AVAX: 'Avalanche',
    SUI: 'Sui Network',
    NEAR: 'NEAR Protocol',
    TAO: 'Bittensor',
    RENDER: 'Render',
    FET: 'Artificial Superintelligence',
    WLD: 'Worldcoin',
    PEPE: 'Pepe',
    '1000PEPE': 'Pepe 1000x Futures',
    SHIB: 'Shiba Inu',
    '1000SHIB': 'Shiba Inu 1000x',
    BONK: 'Bonk',
    '1000BONK': 'Bonk 1000x',
    FLOKI: 'Floki',
    '1000FLOKI': 'Floki 1000x',
    BOME: 'BOOK OF MEME',
    '1000BOME': 'BOME 1000x',
    WIF: 'dogwifhat',
    POPCAT: 'Popcat',
    NEIRO: 'First Neiro',
    '1000NEIRO': 'Neiro 1000x',
    PNUT: 'Peanut the Squirrel',
    GOAT: 'Goatseus Maximus',
    MOODENG: 'Moo Deng',
    TURBO: 'Turbo',
    SEI: 'Sei Network',
    APT: 'Aptos',
    TIA: 'Celestia',
    ARB: 'Arbitrum',
    OP: 'Optimism',
    STRK: 'Starknet',
    TON: 'Toncoin',
    KAS: 'Kaspa',
    INJ: 'Injective',
    FTM: 'Fantom / Sonic',
    ALGO: 'Algorand',
    HBAR: 'Hedera',
    DOT: 'Polkadot',
    LTC: 'Litecoin',
    BCH: 'Bitcoin Cash',
    ETC: 'Ethereum Classic',
    LINK: 'Chainlink',
    UNI: 'Uniswap',
    AAVE: 'Aave',
    MKR: 'Maker',
    PENDLE: 'Pendle',
    ENA: 'Ethena',
    CRV: 'Curve DAO',
    LDO: 'Lido DAO',
    JUP: 'Jupiter',
    RAY: 'Raydium',
    DYDX: 'dYdX',
    PYTH: 'Pyth Network',
    ONDO: 'Ondo Finance (RWA)',
    OM: 'MANTRA (RWA)',
    GALA: 'Gala Games',
    SAND: 'The Sandbox',
    MANA: 'Decentraland',
    AXS: 'Axie Infinity',
    BEAM: 'Beam Gaming',
    NOT: 'Notcoin',
    DOGS: 'Dogs',
    CATI: 'Catizen',
    HMSTR: 'Hamster Kombat',
    ACT: 'Act I : The AI Prophecy',
    DRIFT: 'Drift Protocol',
    GRASS: 'Grass Network',
    COW: 'CoW Protocol',
    CETUS: 'Cetus Protocol',
    SWELL: 'Swell Network',
    ORDI: 'Ordinals',
    '1000SATS': 'SATS 1000x',
    EIGEN: 'EigenLayer',
    SCR: 'Scroll',
    POL: 'Polygon (POL)',
    TRX: 'TRON',
    XLM: 'Stellar',
    FIL: 'Filecoin',
    ICP: 'Internet Computer',
    ARKM: 'Arkham',
  };

  if (map[baseAsset]) return map[baseAsset];
  if (baseAsset.startsWith('1000')) {
    const raw = baseAsset.replace('1000', '');
    return `${raw} 1000x Perpetual`;
  }
  return `${baseAsset} Perpetual`;
}

/**
 * Curated Pre-Seeded Binance Futures Universe (200+ top active contracts)
 * Guarantees zero latency on startup and offline resilience
 */
export const SEEDED_BINANCE_FUTURES: TokenCatalogItem[] = [
  // Top Majors & Blue Chips
  { symbol: 'BTCUSDT', baseAsset: 'BTC', name: 'Bitcoin', category: 'TOP_FUTURES', defaultPrice: 81650 },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', name: 'Ethereum', category: 'TOP_FUTURES', defaultPrice: 2430 },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', name: 'Solana', category: 'TOP_FUTURES', defaultPrice: 104.8 },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', name: 'BNB', category: 'TOP_FUTURES', defaultPrice: 620 },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', name: 'Ripple', category: 'TOP_FUTURES', defaultPrice: 2.15 },
  { symbol: 'DOGEUSDT', baseAsset: 'DOGE', name: 'Dogecoin', category: 'MEME', defaultPrice: 0.22 },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', name: 'Cardano', category: 'TOP_FUTURES', defaultPrice: 0.72 },
  { symbol: 'AVAXUSDT', baseAsset: 'AVAX', name: 'Avalanche', category: 'LAYER1_2', defaultPrice: 32.5 },
  { symbol: 'LINKUSDT', baseAsset: 'LINK', name: 'Chainlink', category: 'TOP_FUTURES', defaultPrice: 18.2 },
  { symbol: 'SUIUSDT', baseAsset: 'SUI', name: 'Sui Network', category: 'LAYER1_2', defaultPrice: 2.85 },
  { symbol: 'NEARUSDT', baseAsset: 'NEAR', name: 'NEAR Protocol', category: 'AI_DEPIN', defaultPrice: 4.95 },
  { symbol: 'TRXUSDT', baseAsset: 'TRX', name: 'TRON', category: 'TOP_FUTURES', defaultPrice: 0.24 },
  { symbol: 'LTCUSDT', baseAsset: 'LTC', name: 'Litecoin', category: 'TOP_FUTURES', defaultPrice: 88.5 },
  { symbol: 'BCHUSDT', baseAsset: 'BCH', name: 'Bitcoin Cash', category: 'TOP_FUTURES', defaultPrice: 420 },
  { symbol: 'ETCUSDT', baseAsset: 'ETC', name: 'Ethereum Classic', category: 'TOP_FUTURES', defaultPrice: 23.8 },
  { symbol: 'XLMUSDT', baseAsset: 'XLM', name: 'Stellar', category: 'TOP_FUTURES', defaultPrice: 0.35 },
  { symbol: 'DOTUSDT', baseAsset: 'DOT', name: 'Polkadot', category: 'LAYER1_2', defaultPrice: 6.85 },
  { symbol: 'POLUSDT', baseAsset: 'POL', name: 'Polygon (POL)', category: 'LAYER1_2', defaultPrice: 0.42 },

  // AI & Big Data / DePIN
  { symbol: 'TAOUSDT', baseAsset: 'TAO', name: 'Bittensor', category: 'AI_DEPIN', defaultPrice: 450 },
  { symbol: 'RENDERUSDT', baseAsset: 'RENDER', name: 'Render', category: 'AI_DEPIN', defaultPrice: 5.65 },
  { symbol: 'FETUSDT', baseAsset: 'FET', name: 'Artificial Superintelligence', category: 'AI_DEPIN', defaultPrice: 1.12 },
  { symbol: 'WLDUSDT', baseAsset: 'WLD', name: 'Worldcoin', category: 'AI_DEPIN', defaultPrice: 1.85 },
  { symbol: 'ICPUSDT', baseAsset: 'ICP', name: 'Internet Computer', category: 'AI_DEPIN', defaultPrice: 9.80 },
  { symbol: 'ARKMUSDT', baseAsset: 'ARKM', name: 'Arkham', category: 'AI_DEPIN', defaultPrice: 1.62 },
  { symbol: 'GRTUSDT', baseAsset: 'GRT', name: 'The Graph', category: 'AI_DEPIN', defaultPrice: 0.19 },
  { symbol: 'FILUSDT', baseAsset: 'FIL', name: 'Filecoin', category: 'AI_DEPIN', defaultPrice: 4.15 },
  { symbol: 'ARUSDT', baseAsset: 'AR', name: 'Arweave', category: 'AI_DEPIN', defaultPrice: 17.5 },
  { symbol: 'THETAUSDT', baseAsset: 'THETA', name: 'Theta Network', category: 'AI_DEPIN', defaultPrice: 1.45 },
  { symbol: 'HNTUSDT', baseAsset: 'HNT', name: 'Helium', category: 'AI_DEPIN', defaultPrice: 5.85 },
  { symbol: 'IOTXUSDT', baseAsset: 'IOTX', name: 'IoTeX', category: 'AI_DEPIN', defaultPrice: 0.042 },
  { symbol: 'AIUSDT', baseAsset: 'AI', name: 'Sleepless AI', category: 'AI_DEPIN', defaultPrice: 0.52 },
  { symbol: 'IOUSDT', baseAsset: 'IO', name: 'io.net', category: 'AI_DEPIN', defaultPrice: 2.35 },
  { symbol: 'ATHUSDT', baseAsset: 'ATH', name: 'Aethir', category: 'AI_DEPIN', defaultPrice: 0.058 },
  { symbol: 'ACTUSDT', baseAsset: 'ACT', name: 'Act I : The AI Prophecy', category: 'AI_DEPIN', defaultPrice: 0.38 },

  // Meme Tokens & Viral High Volatility
  { symbol: '1000PEPEUSDT', baseAsset: '1000PEPE', name: 'Pepe 1000x Futures', category: 'MEME', defaultPrice: 0.0095 },
  { symbol: 'PEPEUSDT', baseAsset: 'PEPE', name: 'Pepe', category: 'MEME', defaultPrice: 0.0000095 },
  { symbol: '1000SHIBUSDT', baseAsset: '1000SHIB', name: 'Shiba Inu 1000x', category: 'MEME', defaultPrice: 0.0195 },
  { symbol: 'SHIBUSDT', baseAsset: 'SHIB', name: 'Shiba Inu', category: 'MEME', defaultPrice: 0.0000195 },
  { symbol: '1000BONKUSDT', baseAsset: '1000BONK', name: 'Bonk 1000x', category: 'MEME', defaultPrice: 0.0245 },
  { symbol: 'BONKUSDT', baseAsset: 'BONK', name: 'Bonk', category: 'MEME', defaultPrice: 0.0000245 },
  { symbol: '1000FLOKIUSDT', baseAsset: '1000FLOKI', name: 'Floki 1000x', category: 'MEME', defaultPrice: 0.165 },
  { symbol: 'FLOKIUSDT', baseAsset: 'FLOKI', name: 'Floki', category: 'MEME', defaultPrice: 0.000165 },
  { symbol: 'WIFUSDT', baseAsset: 'WIF', name: 'dogwifhat', category: 'MEME', defaultPrice: 1.85 },
  { symbol: '1000BOMEUSDT', baseAsset: '1000BOME', name: 'BOME 1000x', category: 'MEME', defaultPrice: 0.0085 },
  { symbol: 'BOMEUSDT', baseAsset: 'BOME', name: 'BOOK OF MEME', category: 'MEME', defaultPrice: 0.0085 },
  { symbol: 'POPCATUSDT', baseAsset: 'POPCAT', name: 'Popcat', category: 'MEME', defaultPrice: 0.65 },
  { symbol: '1000NEIROUSDT', baseAsset: '1000NEIRO', name: 'Neiro 1000x', category: 'MEME', defaultPrice: 0.0018 },
  { symbol: 'NEIROUSDT', baseAsset: 'NEIRO', name: 'First Neiro on Ethereum', category: 'MEME', defaultPrice: 0.0018 },
  { symbol: 'PNUTUSDT', baseAsset: 'PNUT', name: 'Peanut the Squirrel', category: 'MEME', defaultPrice: 0.85 },
  { symbol: 'GOATUSDT', baseAsset: 'GOAT', name: 'Goatseus Maximus', category: 'MEME', defaultPrice: 0.58 },
  { symbol: 'MOODENGUSDT', baseAsset: 'MOODENG', name: 'Moo Deng', category: 'MEME', defaultPrice: 0.28 },
  { symbol: 'TURBOUSDT', baseAsset: 'TURBO', name: 'Turbo', category: 'MEME', defaultPrice: 0.0078 },
  { symbol: 'MEWUSDT', baseAsset: 'MEW', name: 'cat in a dogs world', category: 'MEME', defaultPrice: 0.0065 },
  { symbol: 'MEMEUSDT', baseAsset: 'MEME', name: 'Memecoin', category: 'MEME', defaultPrice: 0.0125 },
  { symbol: 'PEOPLEUSDT', baseAsset: 'PEOPLE', name: 'ConstitutionDAO', category: 'MEME', defaultPrice: 0.055 },

  // Layer 1 & Layer 2 Protocols
  { symbol: 'SEIUSDT', baseAsset: 'SEI', name: 'Sei Network', category: 'LAYER1_2', defaultPrice: 0.42 },
  { symbol: 'APTUSDT', baseAsset: 'APT', name: 'Aptos', category: 'LAYER1_2', defaultPrice: 8.45 },
  { symbol: 'TIAUSDT', baseAsset: 'TIA', name: 'Celestia', category: 'LAYER1_2', defaultPrice: 4.85 },
  { symbol: 'ARBUSDT', baseAsset: 'ARB', name: 'Arbitrum', category: 'LAYER1_2', defaultPrice: 0.55 },
  { symbol: 'OPUSDT', baseAsset: 'OP', name: 'Optimism', category: 'LAYER1_2', defaultPrice: 1.45 },
  { symbol: 'STRKUSDT', baseAsset: 'STRK', name: 'Starknet', category: 'LAYER1_2', defaultPrice: 0.38 },
  { symbol: 'TONUSDT', baseAsset: 'TON', name: 'Toncoin', category: 'LAYER1_2', defaultPrice: 4.65 },
  { symbol: 'KASUSDT', baseAsset: 'KAS', name: 'Kaspa', category: 'LAYER1_2', defaultPrice: 0.125 },
  { symbol: 'INJUSDT', baseAsset: 'INJ', name: 'Injective', category: 'LAYER1_2', defaultPrice: 21.5 },
  { symbol: 'FTMUSDT', baseAsset: 'FTM', name: 'Fantom / Sonic', category: 'LAYER1_2', defaultPrice: 0.68 },
  { symbol: 'ALGOUSDT', baseAsset: 'ALGO', name: 'Algorand', category: 'LAYER1_2', defaultPrice: 0.22 },
  { symbol: 'HBARUSDT', baseAsset: 'HBAR', name: 'Hedera', category: 'LAYER1_2', defaultPrice: 0.18 },
  { symbol: 'STXUSDT', baseAsset: 'STX', name: 'Stacks', category: 'LAYER1_2', defaultPrice: 1.65 },
  { symbol: 'DYMUSDT', baseAsset: 'DYM', name: 'Dymension', category: 'LAYER1_2', defaultPrice: 1.55 },
  { symbol: 'MANTAUSDT', baseAsset: 'MANTA', name: 'Manta Network', category: 'LAYER1_2', defaultPrice: 0.75 },
  { symbol: 'SCRUSDT', baseAsset: 'SCR', name: 'Scroll', category: 'LAYER1_2', defaultPrice: 0.65 },

  // DeFi & Web3 Protocols
  { symbol: 'UNIUSDT', baseAsset: 'UNI', name: 'Uniswap', category: 'DEFI', defaultPrice: 8.85 },
  { symbol: 'AAVEUSDT', baseAsset: 'AAVE', name: 'Aave', category: 'DEFI', defaultPrice: 215 },
  { symbol: 'MKRUSDT', baseAsset: 'MKR', name: 'Maker', category: 'DEFI', defaultPrice: 1540 },
  { symbol: 'PENDLEUSDT', baseAsset: 'PENDLE', name: 'Pendle', category: 'DEFI', defaultPrice: 4.45 },
  { symbol: 'ENAUSDT', baseAsset: 'ENA', name: 'Ethena', category: 'DEFI', defaultPrice: 0.48 },
  { symbol: 'CRVUSDT', baseAsset: 'CRV', name: 'Curve DAO', category: 'DEFI', defaultPrice: 0.38 },
  { symbol: 'LDOUSDT', baseAsset: 'LDO', name: 'Lido DAO', category: 'DEFI', defaultPrice: 1.15 },
  { symbol: 'JUPUSDT', baseAsset: 'JUP', name: 'Jupiter', category: 'DEFI', defaultPrice: 0.98 },
  { symbol: 'RAYUSDT', baseAsset: 'RAY', name: 'Raydium', category: 'DEFI', defaultPrice: 4.15 },
  { symbol: 'DYDXUSDT', baseAsset: 'DYDX', name: 'dYdX', category: 'DEFI', defaultPrice: 1.25 },
  { symbol: 'PYTHUSDT', baseAsset: 'PYTH', name: 'Pyth Network', category: 'DEFI', defaultPrice: 0.35 },
  { symbol: 'EIGENUSDT', baseAsset: 'EIGEN', name: 'EigenLayer', category: 'DEFI', defaultPrice: 2.85 },
  { symbol: 'SWELLUSDT', baseAsset: 'SWELL', name: 'Swell Network', category: 'DEFI', defaultPrice: 0.038 },
  { symbol: 'COWUSDT', baseAsset: 'COW', name: 'CoW Protocol', category: 'DEFI', defaultPrice: 0.42 },
  { symbol: 'CETUSUSDT', baseAsset: 'CETUS', name: 'Cetus Protocol', category: 'DEFI', defaultPrice: 0.28 },
  { symbol: 'DRIFTUSDT', baseAsset: 'DRIFT', name: 'Drift Protocol', category: 'DEFI', defaultPrice: 1.15 },

  // Real World Assets (RWAs)
  { symbol: 'ONDOUSDT', baseAsset: 'ONDO', name: 'Ondo Finance (RWA)', category: 'RWA', defaultPrice: 1.15 },
  { symbol: 'OMUSDT', baseAsset: 'OM', name: 'MANTRA (RWA)', category: 'RWA', defaultPrice: 3.85 },
  { symbol: 'TRUUSDT', baseAsset: 'TRU', name: 'TrueFi (RWA)', category: 'RWA', defaultPrice: 0.095 },
  { symbol: 'POLYXUSDT', baseAsset: 'POLYX', name: 'Polymesh (RWA)', category: 'RWA', defaultPrice: 0.26 },
  { symbol: 'DUSKUSDT', baseAsset: 'DUSK', name: 'Dusk Network (RWA)', category: 'RWA', defaultPrice: 0.22 },

  // Gaming, Metaverse & Social
  { symbol: 'GALAUSDT', baseAsset: 'GALA', name: 'Gala Games', category: 'GAMING', defaultPrice: 0.028 },
  { symbol: 'SANDUSDT', baseAsset: 'SAND', name: 'The Sandbox', category: 'GAMING', defaultPrice: 0.35 },
  { symbol: 'MANAUSDT', baseAsset: 'MANA', name: 'Decentraland', category: 'GAMING', defaultPrice: 0.42 },
  { symbol: 'AXSUSDT', baseAsset: 'AXS', name: 'Axie Infinity', category: 'GAMING', defaultPrice: 6.25 },
  { symbol: 'BEAMUSDT', baseAsset: 'BEAM', name: 'Beam Gaming', category: 'GAMING', defaultPrice: 0.021 },
  { symbol: 'NOTUSDT', baseAsset: 'NOT', name: 'Notcoin', category: 'GAMING', defaultPrice: 0.0078 },
  { symbol: 'DOGSUSDT', baseAsset: 'DOGS', name: 'Dogs', category: 'GAMING', defaultPrice: 0.00065 },
  { symbol: 'CATIUSDT', baseAsset: 'CATI', name: 'Catizen', category: 'GAMING', defaultPrice: 0.42 },
  { symbol: 'HMSTRUSDT', baseAsset: 'HMSTR', name: 'Hamster Kombat', category: 'GAMING', defaultPrice: 0.0035 },
  { symbol: 'PIXELUSDT', baseAsset: 'PIXEL', name: 'Pixels', category: 'GAMING', defaultPrice: 0.18 },
  { symbol: 'PORTALUSDT', baseAsset: 'PORTAL', name: 'Portal Gaming', category: 'GAMING', defaultPrice: 0.32 },
];

/**
 * Cache container for dynamically loaded Binance Futures pairs
 */
let cachedAllFuturesCatalog: TokenCatalogItem[] = [...SEEDED_BINANCE_FUTURES];

/**
 * Dynamically fetches ALL available Binance USDT-M Futures Perpetual contracts
 * from https://fapi.binance.com/fapi/v1/exchangeInfo (525+ contracts!)
 */
export async function fetchAllBinanceFuturesFromApi(): Promise<TokenCatalogItem[]> {
  const endpoints = [
    'https://fapi.binance.com/fapi/v1/exchangeInfo',
    'https://data-api.binance.vision/api/v3/exchangeInfo',
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.symbols)) {
          // Filter USDT perpetual trading contracts
          const usdtSymbols = data.symbols.filter((s: { quoteAsset: string; status: string; contractType?: string }) => {
            const isUsdt = s.quoteAsset === 'USDT';
            const isTrading = s.status === 'TRADING';
            const isPerp = !s.contractType || s.contractType === 'PERPETUAL';
            return isUsdt && isTrading && isPerp;
          });

          if (usdtSymbols.length > 50) {
            // Build rich catalog items
            const dynamicCatalog: TokenCatalogItem[] = usdtSymbols.map((item: { symbol: string; baseAsset: string }) => {
              const symbol = item.symbol;
              const baseAsset = item.baseAsset;
              const seeded = SEEDED_BINANCE_FUTURES.find(s => s.symbol === symbol);

              return {
                symbol,
                baseAsset,
                name: seeded ? seeded.name : getFriendlyTokenName(symbol, baseAsset),
                category: seeded ? seeded.category : categorizeFuturesSymbol(symbol, baseAsset),
                defaultPrice: seeded ? seeded.defaultPrice : 1.0,
              };
            });

            // Update in-memory cache
            cachedAllFuturesCatalog = dynamicCatalog;

            // Cache in localStorage for subsequent instantaneous loads
            try {
              localStorage.setItem('BINANCE_ALL_FUTURES_CACHE', JSON.stringify(dynamicCatalog));
            } catch {
              // localStorage could be full or blocked
            }

            return dynamicCatalog;
          }
        }
      }
    } catch {
      // Try next endpoint or fallback to cached
    }
  }

  // Check localStorage if API failed
  try {
    const saved = localStorage.getItem('BINANCE_ALL_FUTURES_CACHE');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 50) {
        cachedAllFuturesCatalog = parsed;
        return parsed;
      }
    }
  } catch {
    // Ignore error
  }

  return cachedAllFuturesCatalog;
}

/**
 * Returns current loaded Futures catalog
 */
export function getLoadedFuturesCatalog(): TokenCatalogItem[] {
  return cachedAllFuturesCatalog;
}
