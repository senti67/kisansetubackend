const express = require("express");

const {
  getCenters,
  createCenter,
  createSlot,
  getSlots,
  createBooking,
  createPrice,
  getPrices,
  confirmBooking,
  verifyBooking,
} = require("../controllers/procurement.controller");

const authenticate = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

router.get("/centers", authenticate, getCenters);

router.post(
  "/centers",
  authenticate,
  requireRole("ADMIN"),
  createCenter
);

router.post(
  "/centers/:centerId/slots",
  authenticate,
  requireRole("ADMIN"),
  createSlot
);

router.get(
  "/centers/:centerId/slots",
  authenticate,
  getSlots
);

router.post(
  "/bookings",
  authenticate,
  requireRole("FARMER"),
  createBooking
);

router.post(
  "/prices",
  authenticate,
  requireRole("ADMIN"),
  createPrice
);

router.get(
  "/prices",
  authenticate,
  getPrices
);

router.post(
  "/bookings/:bookingId/confirm",
  authenticate,
  requireRole("ADMIN"),
  confirmBooking
);

router.post(
  "/bookings/:bookingId/verify",
  authenticate,
  requireRole("ADMIN"),
  verifyBooking
);

module.exports = router;