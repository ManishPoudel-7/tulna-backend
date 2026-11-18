const { pincodeToCoords } = require("../services/geocode.service");
const { searchAllPlatforms } = require("../services/quickcommerce.service");
const { groupProducts } = require("../utils/product.utils");
const cache = require("../services/cache.service");

// GET /api/search?q=milk&pincode=110019   or   ?q=milk&lat=28.5&lon=77.2
async function search(req, res) {
  const q = req.query.q?.trim();
  const pincode = req.query.pincode?.trim();
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const hasCoords = Boolean(lat && lon);

  if (!q || (!hasCoords && !/^\d{6}$/.test(pincode))) {
    return res.status(400).json({ error: "q and either lat/lon or a 6-digit pincode are required" });
  }

  try {
    const coords = hasCoords ? { lat, lon } : await pincodeToCoords(pincode);

    // Round to ~1 km so nearby pincodes share cached results
    const cacheKey = `${q.toLowerCase()}|${Number(coords.lat).toFixed(2)}|${Number(coords.lon).toFixed(2)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, pincode: pincode ?? cached.pincode, cached: true });
    }

    const { results, errors } = await searchAllPlatforms(q, coords.lat, coords.lon);
    const payload = { query: q, pincode: pincode ?? null, ...coords, results: groupProducts(results, q), errors };

    cache.set(cacheKey, payload);
    res.json(payload);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}

module.exports = { search };
