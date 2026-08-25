const express = require("express");

const {
  getAvailableProduce,
  getMarketplaceProduceById,
} = require("../controllers/marketplace.controller");

const authenticate = require("../middleware/auth.middleware");

const router = express.Router();

router.get(
  "/produce",
  authenticate,
  getAvailableProduce
);

router.get(
  "/produce/:id",
  authenticate,
  getMarketplaceProduceById
);

module.exports = router;