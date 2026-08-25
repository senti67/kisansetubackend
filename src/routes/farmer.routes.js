const express = require("express");

const {
  getMyProfile,
  updateMyProfile,
} = require("../controllers/farmer.controller");

const authenticate = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/me", authenticate, getMyProfile);

router.put("/me", authenticate, updateMyProfile);

module.exports = router;