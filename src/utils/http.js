// GET a URL and parse JSON; rejects on non-2xx or after `timeout` ms
async function getJson(url, headers = {}, timeout = 8000) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

module.exports = { getJson };
