const express = require("express");

const {
  createOrder,
  getMyOrders,
  getOrderById,
} = require("../controllers/order.controller");

const authenticate = require("../middleware/auth.middleware");

const router = express.Router();

// Buyer creates an order for produce
router.post(
  "/produce/:produceId",
  authenticate,
  createOrder
);

// Get buyer's orders
router.get(
  "/",
  authenticate,
  getMyOrders
);

// Get one order
router.get(
  "/:id",
  authenticate,
  getOrderById
);

module.exports = router;