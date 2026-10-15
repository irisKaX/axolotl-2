export const PAGE_LIMIT_OPTIONS=Object.freeze([1000,5000,10000,20000]);
export const DEFAULT_MAX_PAGES=5000;
export const MAX_PAGES=20000;
export const CRAWL_DEADLINE_MS=2*60*60*1000;
export const MAX_DISCOVERED_URLS=100000;
export const MAX_SITEMAPS=200;
export const MAX_SITEMAP_LOCATIONS=50000;
export const PAGE_MAX_BYTES=2*1024*1024;
export const SITEMAP_MAX_BYTES=10*1024*1024;
export const REQUEST_TIMEOUT_MS=30000;
export const CRAWL_CONCURRENCY=2;
export const PROGRESS_INTERVAL_MS=100;

export function normalizePageLimit(value){
 const n=Number(value);
 return [100,300,...PAGE_LIMIT_OPTIONS].includes(n)?n:DEFAULT_MAX_PAGES;
}
export function crawlLimits(maxPages=DEFAULT_MAX_PAGES,{deadlineMs=CRAWL_DEADLINE_MS}={}){
 const pages=Number.isFinite(Number(maxPages))?Math.min(MAX_PAGES,Math.max(1,Math.floor(Number(maxPages)))):DEFAULT_MAX_PAGES;
 const deadline=Number.isFinite(Number(deadlineMs))?Math.min(CRAWL_DEADLINE_MS,Math.max(0,Number(deadlineMs))):CRAWL_DEADLINE_MS;
 return {maxPages:pages,deadlineMs:deadline,discoveredUrls:MAX_DISCOVERED_URLS,sitemaps:MAX_SITEMAPS,sitemapLocations:MAX_SITEMAP_LOCATIONS,pageBytes:PAGE_MAX_BYTES,sitemapBytes:SITEMAP_MAX_BYTES,totalBytes:pages*PAGE_MAX_BYTES+(MAX_SITEMAPS+1)*SITEMAP_MAX_BYTES,requestTimeoutMs:REQUEST_TIMEOUT_MS,concurrency:CRAWL_CONCURRENCY};
}
export function durationLabel(milliseconds){
 if(milliseconds%3600000===0)return `${milliseconds/3600000} h`;
 if(milliseconds%60000===0)return `${milliseconds/60000} min`;
 if(milliseconds%1000===0)return `${milliseconds/1000} s`;
 return `${milliseconds} ms`;
}
