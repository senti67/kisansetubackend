const express = require("express");

const {
  getFarmerOrders,
  getFarmerOrderById,
  updateFarmerOrderStatus,
} = require("../controllers/farmer-order.controller");

const authenticate = require("../middleware/auth.middleware");

const router = express.Router();

// Get all orders for logged-in farmer
router.get(
  "/",
  authenticate,
  getFarmerOrders
);

// Get one farmer order
router.get(
  "/:id",
  authenticate,
  getFarmerOrderById
);

// Update farmer order status
router.patch(
  "/:id/status",
  authenticate,
  updateFarmerOrderStatus
);

module.exports = router;