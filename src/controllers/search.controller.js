const { pincodeToCoords } = require("../services/geocode.service");
const { searchAllPlatforms } = require("../services/quickcommerce.service");
const { groupProducts } = require("../utils/product.utils");

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
    const { results, errors } = await searchAllPlatforms(q, coords.lat, coords.lon);

    res.json({ query: q, pincode: pincode ?? null, ...coords, results: groupProducts(results), errors });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}

module.exports = { search };
