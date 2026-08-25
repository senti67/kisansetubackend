require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./src/routes/auth.routes");
const farmerRoutes = require("./src/routes/farmer.routes");
const farmRoutes = require("./src/routes/farm.routes");
const cropRoutes = require("./src/routes/crop.routes");
const produceRoutes = require("./src/routes/produce.routes");
const marketplaceRoutes = require("./src/routes/marketplace.routes");
const orderRoutes = require("./src/routes/order.routes");
const farmerOrderRoutes = require("./src/routes/farmer-order.routes");
const adminRoutes = require("./src/routes/admin.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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
app.use("/api/orders", orderRoutes);
app.use("/api/farmer/orders", farmerOrderRoutes);
app.use("/api/admin", adminRoutes);

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`KisanSetu backend running on http://localhost:${PORT}`);
});