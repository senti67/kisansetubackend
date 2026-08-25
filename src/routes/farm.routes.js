const express = require("express");

const {
  createFarm,
  getMyFarms,
  getFarmById,
  updateFarm,
  deleteFarm,
} = require("../controllers/farm.controller");

const authenticate = require("../middleware/auth.middleware");

const router = express.Router();

// Create a farm
router.post("/", authenticate, createFarm);

// Get all farms belonging to logged-in farmer
router.get("/", authenticate, getMyFarms);

// Get one farm
router.get("/:id", authenticate, getFarmById);

// Update one farm
router.put("/:id", authenticate, updateFarm);
router.delete("/:id", authenticate, deleteFarm);
module.exports = router;