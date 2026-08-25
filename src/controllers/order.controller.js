const prisma = require("../lib/prisma");

// ==========================
// CREATE ORDER
// ==========================

const createOrder = async (req, res) => {
  try {
    const produceId = Number(req.params.produceId);
    const { quantity } = req.body;

    // Validate produce ID
    if (!Number.isInteger(produceId) || produceId <= 0) {
      return res.status(400).json({
        message: "Invalid produce ID",
      });
    }

    // Validate quantity
    if (
      typeof quantity !== "number" ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        message: "Quantity must be a positive number",
      });
    }

    const requestedQuantity = quantity;

    // ==========================
    // VERIFY BUYER
    // ==========================

    const buyer = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
    });

    if (!buyer) {
      return res.status(404).json({
        message: "Buyer not found",
      });
    }

    if (buyer.role !== "BUYER") {
      return res.status(403).json({
        message: "Only buyers can create orders",
      });
    }

    // ==========================
    // FIND AVAILABLE PRODUCE
    // ==========================

    const produce = await prisma.produce.findFirst({
      where: {
        id: produceId,
        status: "AVAILABLE",
      },
    });

    if (!produce) {
      return res.status(404).json({
        message: "Available produce not found",
      });
    }

    // ==========================
    // VALIDATE PRICE
    // ==========================

    if (
      produce.price === null ||
      !Number.isFinite(produce.price) ||
      produce.price < 0
    ) {
      return res.status(400).json({
        message: "This produce has an invalid price",
      });
    }

    // ==========================
    // CHECK QUANTITY
    // ==========================

    if (requestedQuantity > produce.quantity) {
      return res.status(400).json({
        message: `Only ${produce.quantity} ${produce.unit} is available`,
      });
    }

    // ==========================
    // CALCULATE TOTAL SERVER-SIDE
    // ==========================

    const totalPrice =
      requestedQuantity * produce.price;

    // ==========================
    // TRANSACTION
    // ==========================

    const result = await prisma.$transaction(async (tx) => {
      // Atomically reserve inventory
      const updatedProduce = await tx.produce.updateMany({
        where: {
          id: produceId,
          status: "AVAILABLE",
          quantity: {
            gte: requestedQuantity,
          },
        },

        data: {
          quantity: {
            decrement: requestedQuantity,
          },
        },
      });

      if (updatedProduce.count !== 1) {
        throw new Error("INSUFFICIENT_QUANTITY");
      }

      const remainingQuantity =
        produce.quantity - requestedQuantity;

      await tx.produce.update({
        where: {
          id: produceId,
        },

        data: {
          status:
            remainingQuantity === 0
              ? "SOLD"
              : "AVAILABLE",
        },
      });

      // Create order using server-controlled price
      const order = await tx.order.create({
        data: {
          buyerId: buyer.id,
          produceId,
          quantity: requestedQuantity,
          unit: produce.unit,
          unitPrice: produce.price,
          totalPrice,
          status: "CONFIRMED",
        },

        include: {
          produce: {
            include: {
              crop: true,
            },
          },
        },
      });

      return order;
    });

    return res.status(201).json({
      message: "Order created successfully",
      order: result,
    });
  } catch (error) {
    if (error.message === "INSUFFICIENT_QUANTITY") {
      return res.status(400).json({
        message: "Requested quantity is no longer available",
      });
    }

    console.error("Create order error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// GET MY ORDERS
// ==========================

const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        buyerId: req.user.userId,
      },

      include: {
        produce: {
          include: {
            crop: {
              include: {
                farm: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// GET ORDER BY ID
// ==========================

const getOrderById = async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        buyerId: req.user.userId,
      },

      include: {
        produce: {
          include: {
            crop: {
              include: {
                farm: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.status(200).json({
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// EXPORT
// ==========================

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
};