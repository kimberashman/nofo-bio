#!/usr/bin/env node
// Checks each URL in the OPPORTUNITIES array and reports failures.
// Usage: node tools/check-urls.js
//
// HEAD requests with redirect-following (up to 5 hops). Falls back to GET if
// the server rejects HEAD. Bot-blocking sites (Cloudflare, etc.) may show as
// 403 even when the page loads fine in a browser — eyeball those manually.

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const m = html.match(/const OPPORTUNITIES = (\[[\s\S]*?\n\]);/);
if (!m) {
  console.error("Couldn't find OPPORTUNITIES array in index.html");
  process.exit(1);
}
const OPPORTUNITIES = eval(m[1]);

const UA = 'Mozilla/5.0 (compatible; NOFO.bio-URL-Checker/1.0)';
const TIMEOUT = 12000;

function request(url, method, hops = 0) {
  return new Promise((resolve) => {
    if (hops > 5) return resolve({ status: 'TOO_MANY_REDIRECTS', finalUrl: url });
    let u;
    try { u = new URL(url); } catch (e) { return resolve({ status: 'INVALID', finalUrl: url }); }
    const mod = u.protocol === 'https:' ? https : http;
    const req = mod.request({
      method, hostname: u.hostname,
      path: (u.pathname || '/') + (u.search || ''),
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      headers: { 'User-Agent': UA, 'Accept': '*/*' },
      timeout: TIMEOUT,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = new URL(res.headers.location, url).href;
        req.destroy();
        request(next, method, hops + 1).then(resolve);
      } else if (method === 'HEAD' && (res.statusCode === 405 || res.statusCode === 403 || res.statusCode === 501)) {
        req.destroy();
        request(url, 'GET', hops).then(resolve);
      } else {
        resolve({ status: res.statusCode, finalUrl: url });
        req.destroy();
      }
    });
    req.on('error', (err) => resolve({ status: 'ERROR', error: err.code || err.message, finalUrl: url }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 'TIMEOUT', finalUrl: url }); });
    req.end();
  });
}

const isFail = (r) => {
  if (typeof r.status === 'number') return r.status >= 400;
  return ['ERROR', 'TIMEOUT', 'INVALID', 'TOO_MANY_REDIRECTS'].includes(r.status);
};

(async () => {
  console.log(`Checking ${OPPORTUNITIES.length} URLs...\n`);
  const results = [];
  const batchSize = 8;
  for (let i = 0; i < OPPORTUNITIES.length; i += batchSize) {
    const batch = OPPORTUNITIES.slice(i, i + batchSize);
    const rs = await Promise.all(batch.map(async (o) => {
      const r = await request(o.url, 'HEAD');
      return { title: o.title, url: o.url, ...r };
    }));
    results.push(...rs);
    process.stdout.write(`  ${i + rs.length}/${OPPORTUNITIES.length}\r`);
  }
  console.log('\n');

  const failed = results.filter(isFail);
  const ok = results.filter(r => !isFail(r));

  console.log(`OK:     ${ok.length}`);
  console.log(`FAILED: ${failed.length}\n`);

  if (failed.length > 0) {
    console.log('=== FAILED URLs ===\n');
    for (const r of failed) {
      const label = typeof r.status === 'number' ? r.status : r.status + (r.error ? ` (${r.error})` : '');
      console.log(`[${label}]  ${r.title}`);
      console.log(`         ${r.url}`);
      if (r.finalUrl && r.finalUrl !== r.url) console.log(`         → ${r.finalUrl}`);
      console.log('');
    }
  }
})();
