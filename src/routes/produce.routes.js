const express = require("express");

const {
  createProduce,
  getMyProduce,
  getProduceById,
  updateProduce,
  deleteProduce,
  updateProduceStatus,
} = require("../controllers/produce.controller");

const authenticate = require("../middleware/auth.middleware");

const router = express.Router();

router.post(
  "/",
  authenticate,
  createProduce
);

router.get(
  "/",
  authenticate,
  getMyProduce
);

router.get(
  "/:id",
  authenticate,
  getProduceById
);

router.put(
  "/:id",
  authenticate,
  updateProduce
);

router.delete(
  "/:id",
  authenticate,
  deleteProduce
);

router.patch(
  "/:id/status",
  authenticate,
  updateProduceStatus
);

module.exports = router;