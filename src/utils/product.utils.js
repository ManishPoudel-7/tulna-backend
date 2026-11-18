// "1 L" / "1000 ml" / "1 pack (250 g)" / "2 x 200 ml" -> { size, unit } in ml or g
function parseSize(text) {
  const m = /(\d+(?:\.\d+)?)\s*(kg|gm|g|ltr|litre|l|ml)\b/i.exec(text || "");
  if (!m) return null;

  const unit = m[2].toLowerCase();
  const isLarge = unit === "kg" || unit.startsWith("l");
  const packCount = Number(/(\d+)\s*x\s*\d/i.exec(text)?.[1] ?? 1);

  return {
    size: packCount * Number(m[1]) * (isLarge ? 1000 : 1),
    unit: unit === "kg" || unit.startsWith("g") ? "g" : "ml",
  };
}

// Words that differ between apps but don't change what the product is
const NOISE = new Set([
  "fresh", "homogenised", "pasteurised", "standardised", "pouch", "pack", "packet", "tetra", "carton",
  "bottle", "longer", "shelf", "life", "uht", "of", "and", "with", "the", "a", "ml", "l", "ltr", "litre", "g", "gm", "kg",
]);

// Same product on different apps -> same key.
// Unique, sorted words of brand + name, with spelling unified (homogenized -> homogenised),
// bracketed text, numbers and noise words removed, plus the normalised size.
function matchKey(item, size) {
  const words = `${item.brand ?? ""} ${item.name}`
    .toLowerCase()
    .replace(/\(.*?\)|[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/iz(e|ed|ing)$/, "is$1"))
    .filter((w) => w && !/^\d/.test(w) && !NOISE.has(w));

  return [...new Set(words)].sort().join(" ") + "|" + (size ? size.size + size.unit : item.quantity);
}

// Display name: "Amul Taaza Toned Milk" (adds brand only if the name doesn't already start with it)
function displayName(item) {
  const brand = item.brand ?? "";
  return item.name.toLowerCase().startsWith(brand.toLowerCase()) ? item.name : `${brand} ${item.name}`.trim();
}

// True if the item's brand+name contains any query word of length >= 3.
// Skips the length-2 words and NOISE so "ml", "l", "pack", "the" don't widen the net.
function matchesQuery(item, q) {
  if (!q) return true;
  const text = `${item.brand ?? ""} ${item.name ?? ""}`.toLowerCase();
  const words = q.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/)
    .filter((w) => w.length >= 3 && !NOISE.has(w));
  if (words.length === 0) return true; // query was all noise; keep everything
  return words.some((w) => text.includes(w));
}

// [{ platform, products }] -> one entry per product with in-stock prices from every app, cheapest first.
// `query` filters out off-topic results returned by the upstream API.
function groupProducts(platformResults, query) {
  const map = {};

  for (const { platform, products } of platformResults) {
    for (const item of products) {
      if (!item.available || item.offer_price == null) continue; // hide out-of-stock
      if (!matchesQuery(item, query)) continue;                   // hide off-topic results

      const size = parseSize(item.quantity);
      const key = matchKey(item, size);

      map[key] ??= {
        product: displayName(item),
        quantity: item.quantity ?? null,
        ...size,
        image: item.images?.[0] ?? null,
        prices: [],
      };

      // One price per app: if an app lists the same product twice, keep its cheapest
      const existing = map[key].prices.find((p) => p.platform === platform);
      if (existing && existing.price <= Number(item.offer_price)) continue;
      if (existing) map[key].prices.splice(map[key].prices.indexOf(existing), 1);

      map[key].prices.push({
        platform,
        icon: item.platform?.icon ?? null,
        price: Number(item.offer_price),
        mrp: item.mrp == null ? null : Number(item.mrp),
        delivery: item.platform?.sla ?? null,
        url: item.deeplink ?? null,
      });
    }
  }

  return Object.values(map)
    .map((p) => ({ ...p, prices: p.prices.sort((a, b) => a.price - b.price) }))
    .sort((a, b) => b.prices.length - a.prices.length); // products on more apps first
}

module.exports = { parseSize, matchKey, groupProducts };
