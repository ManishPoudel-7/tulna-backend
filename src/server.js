const express = require("express");
const searchRoutes = require("./routes/search.routes");

const app = express();
const PORT = process.env.PORT || 4000;

// Allow the frontend (different port) to call this API
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  next();
});

app.use("/api", searchRoutes);
app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => console.log(`Backend on http://localhost:${PORT}`));
