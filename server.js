require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./src/routes/auth.routes");
const farmerRoutes = require("./src/routes/farmer.routes");
const farmRoutes = require("./src/routes/farm.routes");
const cropRoutes = require("./src/routes/crop.routes");
const produceRoutes = require("./src/routes/produce.routes");
const marketplaceRoutes = require("./src/routes/marketplace.routes");
const orderRoutes = require("./src/routes/order.routes");
const farmerOrderRoutes = require("./src/routes/farmer-order.routes");
const adminRoutes = require("./src/routes/admin.routes");
const procurementRoutes = require("./src/routes/procurement.routes");

const app = express();

app.use(helmet());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req) => req.path.startsWith("/auth"),
  message: {
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "Too many authentication attempts. Please try again later.",
  },
});

app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.use("/api/auth", authLimiter);
// Root
app.get("/", (req, res) => {
  res.json({
    message: "KisanSetu backend is running",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/farmers", farmerRoutes);
app.use("/api/farms", farmRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/produce", produceRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/farmer/orders", farmerOrderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/procurement", procurementRoutes);

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`KisanSetu backend running on http://localhost:${PORT}`);
});