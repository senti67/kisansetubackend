const express = require("express");

const {
  getDashboard,
  getUsers,
  updateUserRole,
  getOrders,
  getProduce,
  updateProduceStatus,
} = require("../controllers/admin.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

router.use(authenticate);
router.use(requireRole("ADMIN"));

router.get("/dashboard", getDashboard);

router.get("/users", getUsers);

router.patch("/users/:id/role", updateUserRole);

router.get("/orders", getOrders);

router.get("/produce", getProduce);

router.patch("/produce/:id/status", updateProduceStatus);

module.exports = router;