'use strict';

async function fetchRivianStock() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    console.warn('[RIVIAN] ALPHA_VANTAGE_API_KEY not set — skipping stock fetch');
    return null;
  }

  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=RIVN&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) {
      console.warn('[RIVIAN] Alpha Vantage non-OK response:', res.status);
      return null;
    }
    const data = await res.json();
    const quote = data['Global Quote'];
    if (!quote || !quote['05. price']) {
      console.warn('[RIVIAN] Unexpected Alpha Vantage response shape');
      return null;
    }

    const price     = parseFloat(quote['05. price']).toFixed(2);
    const changePct = quote['10. change percent'] || '0%';

    console.log(`[RIVIAN] RIVN: $${price}, ${changePct}`);
    return { price, changePct };
  } catch (err) {
    console.warn('[RIVIAN] Fetch failed (non-fatal):', err.message);
    return null;
  }
}

module.exports = { fetchRivianStock };
