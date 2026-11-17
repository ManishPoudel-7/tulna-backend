const PLATFORMS = require("../config/platforms");
const { getJson } = require("../utils/http");

const BASE_URL = "https://api.quickcommerceapi.com/v1/search";

// Searches every platform in parallel.
// Returns [{ platform, products }] for successes and [{ platform, message }] for failures.
async function searchAllPlatforms(q, lat, lon) {
  const ids = Object.keys(PLATFORMS);
  const headers = { "X-API-Key": process.env.QUICKCOMMERCE_API_KEY };

  const settled = await Promise.allSettled(
    ids.map((id) => getJson(`${BASE_URL}?q=${encodeURIComponent(q)}&platform=${id}&lat=${lat}&lon=${lon}`, headers))
  );

  const results = [];
  const errors = [];

  settled.forEach((r, i) => {
    const platform = PLATFORMS[ids[i]];
    if (r.status === "fulfilled") {
      results.push({ platform, products: r.value?.data?.products ?? [] });
    } else {
      errors.push({ platform, message: r.reason.name === "TimeoutError" ? "timeout" : r.reason.message });
    }
  });

  return { results, errors };
}

module.exports = { searchAllPlatforms };
