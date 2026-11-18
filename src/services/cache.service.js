// Tiny in-memory cache. Keys expire after TTL_MS.
// Lost on restart — fine for a cost-saver cache.
const TTL_MS = 20 * 60 * 1000;
const store = new Map();

function get(key) {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    store.delete(key);
    return null;
  }
  return hit.value;
}

function set(key, value) {
  store.set(key, { value, expires: Date.now() + TTL_MS });
}

module.exports = { get, set };
