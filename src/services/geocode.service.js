const { getJson } = require("../utils/http");

const cache = new Map();

// Pincode -> { lat, lon } via OpenStreetMap (cached in memory)
async function pincodeToCoords(pincode) {
  if (cache.has(pincode)) return cache.get(pincode);

  const url = `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json&limit=1`;
  const [place] = await getJson(url, { "User-Agent": "compare-karo/1.0" });
  if (!place) throw new Error("Pincode not found");

  const coords = { lat: Number(place.lat), lon: Number(place.lon) };
  cache.set(pincode, coords);
  return coords;
}

module.exports = { pincodeToCoords };
