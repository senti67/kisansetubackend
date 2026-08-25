const express = require("express");

const {
  createCrop,
  getFarmCrops,
} = require("../controllers/crop.controller");

const authenticate = require("../middleware/auth.middleware");

const router = express.Router();

// Create crop inside a farm
router.post(
  "/farm/:farmId",
  authenticate,
  createCrop
);

// Get crops belonging to a farm
router.get(
  "/farm/:farmId",
  authenticate,
  getFarmCrops
);

module.exports = router;
