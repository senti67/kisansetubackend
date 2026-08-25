const express = require("express");

const {
  getDashboard,
  getUsers,
  getOrders,
  getProduce,
} = require("../controllers/admin.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

router.use(authenticate);
router.use(requireRole("ADMIN"));

router.get("/dashboard", getDashboard);
router.get("/users", getUsers);
router.get("/orders", getOrders);
router.get("/produce", getProduce);

module.exports = router;