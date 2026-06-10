/**
 * massiveApi.ts
 * Correct wiring for Massive Finance API (Polygon-compatible)
 * Base: https://api.massive.com
 * Free "Stocks Basic" plan endpoints only.
 */

import { ENV } from '../src/config/env';
import { fetchWithTimeout } from '../src/lib/fetchWithTimeout';

export const MASSIVE_KEY = ENV.MASSIVE_KEY;
const BASE   = 'https://api.massive.com';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function qs(params: Record<string, string | number | boolean>) {
  return Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
}

/** ISO date string YYYY-MM-DD from a Date */
function isoDate(d: Date) {
  return d.toISOString().split('T')[0];
}

/** n trading days ago (rough — skips weekends only, not holidays) */
function tradingDaysAgo(n: number): string {
  const d = new Date();
  let skipped = 0;
  while (skipped < n) {
    d.setDate(d.getDate() - 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) skipped++;
  }
  return isoDate(d);
}

/** Latest completed trading date (yesterday if today is weekend) */
function lastTradingDate(): string {
  const d = new Date();
  // Walk back until we land on a weekday
  do { d.setDate(d.getDate() - 1); } while (d.getDay() === 0 || d.getDay() === 6);
  return isoDate(d);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuoteItem = {
  ticker: string;
  name: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  prevClose: number;
  change: number;
  changePct: number;
  volume: number;
  iconUrl?: string;
};

export type TickerOverview = {
  ticker: string;
  name: string;
  description: string;
  marketCap: number;
  employees: number;
  homepageUrl: string;
  exchange: string;
  iconUrl: string;
  logoUrl: string;
  currencyName: string;
  listDate: string;
  shareClassSharesOutstanding: number;
};

export type OHLCBar = {
  t: number;   // timestamp ms
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  vw: number;
};

export type NewsItem = {
  id: string;
  title: string;
  author: string;
  published_utc: string;
  article_url: string;
  description: string;
  publisher: { name: string };
  tickers: string[];
};

export type IndicatorPoint = { timestamp: number; value: number };

export type MarketStatus = {
  market: string;        // 'open' | 'closed' | 'extended-hours'
  serverTime: string;
  exchanges: Record<string, string>;
};

// ─── Module-level caches (survive re-renders, reset on app restart) ───────────

const _iconCache: Record<string, string> = {};           // ticker → iconUrl
const _ohlcCache: Record<string, OHLCBar[]> = {};        // `${ticker}:${period}` → bars


// ─── Seed / fallback data ─────────────────────────────────────────────────────

export const DISPLAY_NAMES: Record<string, string> = {
  AAPL:'Apple Inc.',MSFT:'Microsoft Corp.',NVDA:'NVIDIA Corp.',AMZN:'Amazon.com',
  GOOGL:'Alphabet Inc.',TSLA:'Tesla Inc.',META:'Meta Platforms',AVGO:'Broadcom Inc.',
  'BRK.B':'Berkshire Hathaway',JPM:'JPMorgan Chase',V:'Visa Inc.',UNH:'UnitedHealth Grp',
  XOM:'ExxonMobil',MA:'Mastercard',LLY:'Eli Lilly',HD:'Home Depot',
  PG:'Procter & Gamble',MRK:'Merck & Co.',COST:'Costco Wholesale',ABBV:'AbbVie Inc.',
  CVX:'Chevron Corp.',PEP:'PepsiCo Inc.',KO:'Coca-Cola Co.',ADBE:'Adobe Inc.',
  WMT:'Walmart Inc.',BAC:'Bank of America',MCD:"McDonald's Corp.",CRM:'Salesforce',
  CSCO:'Cisco Systems',ACN:'Accenture PLC',
  // NGX
  DANGCEM:'Dangote Cement',GTCO:'GT Holding Co.',ZENITHBANK:'Zenith Bank',
  MTNN:'MTN Nigeria',AIRTELAFRI:'Airtel Africa',FBNH:'First Bank Hldg',
  UBA:'United Bank Africa',ACCESSCORP:'Access Bank Corp.',SEPLAT:'Seplat Energy',
  BUAFOODS:'BUA Foods Plc',TRANSCORP:'Transcorp Plc',OKOMUOIL:'Okomu Oil',
  TOTAL:'TotalEnergies Mktg',NESTLE:'Nestle Nigeria',FLOURMILL:'Flour Mills Nig.',
  NB:'Nigerian Breweries',CADBURY:'Cadbury Nigeria',UNILEVER:'Unilever Nigeria',
  GUINNESS:'Guinness Nigeria',WAPCO:'Lafarge WAPCO',
};

export const SEED_PRICES: Record<string, number> = {
  AAPL:189.5,MSFT:415.8,NVDA:891.2,AMZN:183.9,GOOGL:175.1,TSLA:178.4,
  META:512.3,AVGO:1680,'BRK.B':404,JPM:199,V:279,UNH:502,XOM:118,
  MA:471,LLY:780,HD:355,PG:165,MRK:128,COST:890,ABBV:178,
  CVX:161,PEP:181,KO:63,ADBE:483,WMT:67,BAC:39,MCD:304,CRM:315,CSCO:49,ACN:380,
  DANGCEM:452,GTCO:48.5,ZENITHBANK:36.2,MTNN:182,AIRTELAFRI:1410,
  FBNH:22.1,UBA:18.7,ACCESSCORP:19.2,SEPLAT:4200,BUAFOODS:380,
  TRANSCORP:14.5,OKOMUOIL:310,TOTAL:650,NESTLE:1200,FLOURMILL:34,
  NB:28,CADBURY:22,UNILEVER:17.5,GUINNESS:58,WAPCO:44,
};

export function seedQuote(ticker: string): QuoteItem {
  const s    = ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const up   = s % 3 !== 0;
  const pct  = parseFloat((((s % 480) / 100 + 0.1) * (up ? 1 : -1)).toFixed(2));
  const close = SEED_PRICES[ticker] ?? 100 + (s % 200);
  const prev  = close / (1 + pct / 100);
  return {
    ticker, name: DISPLAY_NAMES[ticker] ?? ticker,
    price: close, open: close * 0.998, high: close * 1.012,
    low: close * 0.985, close, prevClose: prev,
    change: parseFloat((close - prev).toFixed(2)),
    changePct: pct, volume: 1_000_000 + (s % 50_000_000),
  };
}

export function seedCandles(ticker: string, days = 30): OHLCBar[] {
  const seed = ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = SEED_PRICES[ticker] ?? 100;
  const now  = Date.now();
  return Array.from({ length: days }, (_, i) => {
    const t = now - (days - 1 - i) * 86_400_000;
    const drift = ((seed + i * 13) % 100 - 50) / 250;
    const c = parseFloat((base * (1 + drift * (i / days))).toFixed(2));
    return { t, o: c * 0.991, h: c * 1.013, l: c * 0.982, c, v: 5_000_000 + seed * i, vw: c };
  });
}

// ─── API: Daily Market Summary (1 call = all tickers) ────────────────────────
// GET /v2/aggs/grouped/locale/us/market/stocks/{date}
// Returns { results: [{ T (ticker), o, h, l, c, v, vw, n }] }
// This is the most efficient way to bulk-load prices on the free tier.

export async function fetchGroupedDay(tickers: string[]): Promise<QuoteItem[]> {
  //console.log("Massive key:", MASSIVE_KEY);
  const tickerSet = new Set(tickers);
  const date = lastTradingDate();
  const prevDate = tradingDaysAgo(2); // we'll use prev close from a second call

  try {
    // Primary: current day summary
    const url = `${BASE}/v2/aggs/grouped/locale/us/market/stocks/${date}?adjusted=true&apiKey=${MASSIVE_KEY}`;
    const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 8000);

    if (!res.ok) {
      console.warn(`[Massive] grouped day ${res.status}:`, await res.text());
      return tickers.map(seedQuote);
    }

    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.length) {
      console.warn('[Massive] grouped day: bad status or empty results', data.status);
      return tickers.map(seedQuote);
    }

    // Build a map from the results
    const map: Record<string, any> = {};
    for (const r of data.results) {
      if (tickerSet.has(r.T)) map[r.T] = r;
    }

    // Fetch prev-day to compute change%
    // Use the 2-day range endpoint for all needed tickers at once
    const found = tickers.filter(t => map[t]);
    const missing = tickers.filter(t => !map[t]);

    // For found tickers, get prevClose via /prev endpoint in parallel (batched 5)
    const withPrev = await enrichWithPrevClose(found, map);

    return [
      ...withPrev,
      ...missing.map(seedQuote),
    ];
  } catch (err) {
    console.error('[Massive] fetchGroupedDay error:', err);
    return tickers.map(seedQuote);
  }
}

/** Fetch prev-day bar for each ticker to get prevClose and compute change% */
async function enrichWithPrevClose(
  tickers: string[],
  currentMap: Record<string, any>
): Promise<QuoteItem[]> {
  const BATCH = 5;
  const results: QuoteItem[] = [];

  for (let i = 0; i < tickers.length; i += BATCH) {
    const slice = tickers.slice(i, i + BATCH);
    const prevBars = await Promise.allSettled(
      slice.map(t =>
        fetchWithTimeout(`${BASE}/v2/aggs/ticker/${t}/prev?adjusted=true&apiKey=${MASSIVE_KEY}`, {}, 5000)
          .then(r => r.json())
          .catch(() => null)
      )
    );

    for (let j = 0; j < slice.length; j++) {
      const ticker = slice[j];
      const cur    = currentMap[ticker];
      const prevResult = prevBars[j];

      let prevClose = cur.o ?? cur.c * 0.99;
      if (prevResult.status === 'fulfilled' && prevResult.value?.results?.[0]) {
        prevClose = prevResult.value.results[0].c;
      }

      const close  = cur.c ?? 0;
      const change = parseFloat((close - prevClose).toFixed(2));
      const changePct = prevClose ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0;

      results.push({
        ticker,
        name: DISPLAY_NAMES[ticker] ?? ticker,
        price: close,
        open: cur.o ?? 0,
        high: cur.h ?? 0,
        low:  cur.l ?? 0,
        close,
        prevClose,
        change,
        changePct,
        volume: cur.v ?? 0,
      });
    }
  }

  return results;
}

// ─── API: Lazy icon batch fetch ───────────────────────────────────────────────
// Call this AFTER fetchGroupedDay returns, so prices render immediately.
// Fetches icons for tickers not yet cached, in small batches with delay.
// Returns a patch map: ticker → iconUrl (caller merges into quotes state).

export async function fetchIconsBatched(
  tickers: string[],
  onPatch: (patch: Record<string, string>) => void
): Promise<void> {
  const needed = tickers.filter(t => !_iconCache[t]);
  if (!needed.length) return;

  const BATCH = 3;       // 3 at a time — stay well under rate limit
  const DELAY = 400;     // 400ms between batches

  for (let i = 0; i < needed.length; i += BATCH) {
    const slice = needed.slice(i, i + BATCH);

    const results = await Promise.allSettled(
      slice.map(t =>
        fetchWithTimeout(
          `${BASE}/v3/reference/tickers/${t}?apiKey=${MASSIVE_KEY}`,
          { headers: { Accept: 'application/json' } },
          6000
        ).then(r => r.json()).catch(() => null)
      )
    );
    const patch: Record<string, string> = {};
    for (let j = 0; j < slice.length; j++) {
      const ticker = slice[j];
      const res    = results[j];
      if (res.status === 'fulfilled' && res.value?.status === 'OK') {
        const icon = res.value.results?.branding?.icon_url;
        if (icon) {
          const url = `${icon}?apiKey=${MASSIVE_KEY}`;
          _iconCache[ticker] = url;
          patch[ticker]      = url;
        }
      }
    }

    if (Object.keys(patch).length) onPatch(patch);

    // Don't delay after last batch
    if (i + BATCH < needed.length) {
      await new Promise(r => setTimeout(r, DELAY));
    }
  }
}

// ─── API: Ticker Overview ─────────────────────────────────────────────────────
// GET /v3/reference/tickers/{ticker}

export async function fetchTickerOverview(ticker: string): Promise<TickerOverview | null> {
  try {
    const url = `${BASE}/v3/reference/tickers/${ticker}?apiKey=${MASSIVE_KEY}`;
    const res  = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 8000);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 'OK' || !data.results) return null;

    const r = data.results;
    return {
      ticker:    r.ticker,
      name:      r.name            ?? DISPLAY_NAMES[ticker] ?? ticker,
      description: r.description   ?? '',
      marketCap: r.market_cap       ?? 0,
      employees: r.total_employees  ?? 0,
      homepageUrl: r.homepage_url   ?? '',
      exchange:  r.primary_exchange ?? '',
      iconUrl:   r.branding?.icon_url  ? `${r.branding.icon_url}?apiKey=${MASSIVE_KEY}` : '',
      logoUrl:   r.branding?.logo_url  ? `${r.branding.logo_url}?apiKey=${MASSIVE_KEY}` : '',
      currencyName: r.currency_name ?? 'usd',
      listDate:  r.list_date        ?? '',
      shareClassSharesOutstanding: r.share_class_shares_outstanding ?? 0,
    };
  } catch (err) {
    console.error('[Massive] fetchTickerOverview error:', err);
    return null;
  }
}

// ─── API: OHLC Aggregates ─────────────────────────────────────────────────────
// GET /v2/aggs/ticker/{ticker}/range/1/day/{from}/{to}

export async function fetchOHLC(
  ticker: string,
  period: '1D' | '1W' | '1M' | '3M' | '1Y'
): Promise<OHLCBar[]> {
  const cacheKey = `${ticker}:${period}`;
  if (_ohlcCache[cacheKey]) return _ohlcCache[cacheKey];
  const to   = lastTradingDate();
  const daysMap = { '1D': 2, '1W': 7, '1M': 30, '3M': 90, '1Y': 365 };
  const days = daysMap[period];
  const from = tradingDaysAgo(days);

  // For 1D we use 1-hour bars; otherwise daily
  const timespan  = period === '1D' ? 'hour' : 'day';
  const multiplier = 1;

  try {
    const url = `${BASE}/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=500&apiKey=${MASSIVE_KEY}`;
    const res  = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 8000);
    if (!res.ok) {
      console.warn(`[Massive] OHLC ${ticker} ${res.status}`);
      return seedCandles(ticker, Math.min(days, 60));
    }
    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.length) {
      return seedCandles(ticker, Math.min(days, 60));
    }
    const bars: OHLCBar[] = data.results.map((r: any) => ({
      t: r.t, o: r.o, h: r.h, l: r.l, c: r.c, v: r.v, vw: r.vw ?? r.c,
    }));

    _ohlcCache[cacheKey] = bars;  // cache it
    return bars;
  } catch (err) {
    console.error('[Massive] fetchOHLC error:', err);
    return seedCandles(ticker, Math.min(days, 60));
  }
}

// ─── API: Previous Day Bar ────────────────────────────────────────────────────
// GET /v2/aggs/ticker/{ticker}/prev

export async function fetchPrevDay(ticker: string): Promise<OHLCBar | null> {
  try {
    const url = `${BASE}/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${MASSIVE_KEY}`;
    const res  = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 5000);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.[0]) return null;
    const r = data.results[0];
    return { t: r.t, o: r.o, h: r.h, l: r.l, c: r.c, v: r.v, vw: r.vw ?? r.c };
  } catch {
    return null;
  }
}

// ─── API: RSI ─────────────────────────────────────────────────────────────────
// GET /v1/indicators/rsi/{ticker}

export async function fetchRSI(ticker: string): Promise<number | null> {
  try {
    const url = `${BASE}/v1/indicators/rsi/${ticker}?timespan=day&adjusted=true&window=14&series_type=close&order=desc&limit=1&apiKey=${MASSIVE_KEY}`;
    const res  = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 8000);
    if (!res.ok) return null;
    const data = await res.json();
    const value = data.results?.values?.[0]?.value;
    return value != null ? parseFloat(value.toFixed(2)) : null;
  } catch {
    return null;
  }
}

// ─── API: SMA ─────────────────────────────────────────────────────────────────

export async function fetchSMA(ticker: string, window = 20): Promise<number | null> {
  try {
    const url = `${BASE}/v1/indicators/sma/${ticker}?timespan=day&adjusted=true&window=${window}&series_type=close&order=desc&limit=1&apiKey=${MASSIVE_KEY}`;
    const res  = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 8000);
    if (!res.ok) return null;
    const data = await res.json();
    const value = data.results?.values?.[0]?.value;
    return value != null ? parseFloat(value.toFixed(2)) : null;
  } catch {
    return null;
  }
}

// ─── API: News ────────────────────────────────────────────────────────────────
// GET /v2/reference/news

export async function fetchNews(ticker: string, limit = 4): Promise<NewsItem[]> {
  try {
    const url = `${BASE}/v2/reference/news?ticker=${ticker}&limit=${limit}&apiKey=${MASSIVE_KEY}`;
    const res  = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 8000);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}

// ─── API: Market Status ───────────────────────────────────────────────────────
// GET /v1/marketstatus/now

export async function fetchMarketStatus(): Promise<MarketStatus | null> {
  try {
    const url = `${BASE}/v1/marketstatus/now?apiKey=${MASSIVE_KEY}`;
    const res  = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 8000);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      market:      data.market      ?? 'unknown',
      serverTime:  data.serverTime  ?? '',
      exchanges:   data.exchanges   ?? {},
    };
  } catch {
    return null;
  }
}

// ─── API: Related Companies ───────────────────────────────────────────────────
// GET /v1/related-companies/{ticker}
// Returns tickers related via news coverage & returns analysis.
// Great for "Peers" section in detail modal.

export async function fetchRelatedCompanies(ticker: string): Promise<string[]> {
  try {
    const url = `${BASE}/v1/related-companies/${ticker}?apiKey=${MASSIVE_KEY}`;
    const res  = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 8000);
    if (!res.ok) return [];
    const data = await res.json();
    // Response: { results: [{ ticker: "MSFT" }, { ticker: "GOOGL" }, ...] }
    return (data.results ?? [])
      .map((r: { ticker: string }) => r.ticker)
      .slice(0, 6); // cap at 6 peers
  } catch {
    return [];
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

export function fmtBig(n: number, prefix = '$') {
  if (n >= 1e12) return `${prefix}${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `${prefix}${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `${prefix}${(n / 1e6).toFixed(2)}M`;
  return `${prefix}${n.toLocaleString()}`;
}