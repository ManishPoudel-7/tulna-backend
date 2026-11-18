const express = require("express");
const rateLimit = require("express-rate-limit");
const searchRoutes = require("./routes/search.routes");

const app = express();
const PORT = process.env.PORT || 4000;

// Render terminates TLS and proxies traffic — trust the first proxy
// so rate-limit sees the real client IP from X-Forwarded-For.
app.set("trust proxy", 1);

// Allow the frontend (different origin) to call this API.
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  next();
});

// 30 requests per IP per minute. Protects the QuickCommerceAPI credit pool.
app.use("/api", rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again in a minute." },
}));

app.use("/api", searchRoutes);
app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => console.log(`Backend on http://localhost:${PORT}`));
