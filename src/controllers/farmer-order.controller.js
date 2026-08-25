const prisma = require("../lib/prisma");

// ==========================
// GET FARMER ORDERS
// ==========================
const getFarmerOrders = async (req, res) => {
  try {
    // Find farmer profile belonging to logged-in user
    const farmer = await prisma.farmer.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer profile not found",
      });
    }

    const orders = await prisma.order.findMany({
      where: {
        produce: {
          farmerId: farmer.id,
        },
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
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
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get farmer orders error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// GET FARMER ORDER BY ID
// ==========================
const getFarmerOrderById = async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    if (Number.isNaN(orderId)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const farmer = await prisma.farmer.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer profile not found",
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        produce: {
          farmerId: farmer.id,
        },
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
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
    console.error("Get farmer order error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// UPDATE ORDER STATUS
// ==========================
const updateFarmerOrderStatus = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(orderId)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const allowedStatuses = [
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Invalid status. Use CONFIRMED, COMPLETED or CANCELLED",
      });
    }

    const farmer = await prisma.farmer.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer profile not found",
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        produce: {
          farmerId: farmer.id,
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Terminal states cannot be changed
    if (
      order.status === "COMPLETED" ||
      order.status === "CANCELLED"
    ) {
      return res.status(400).json({
        message: `Order is already ${order.status}`,
      });
    }

    // CONFIRMED → COMPLETED or CANCELLED
    if (
      order.status === "CONFIRMED" &&
      status !== "COMPLETED" &&
      status !== "CANCELLED"
    ) {
      return res.status(400).json({
        message:
          "CONFIRMED orders can only be COMPLETED or CANCELLED",
      });
    }

    // PENDING → CONFIRMED or CANCELLED
    if (
      order.status === "PENDING" &&
      status !== "CONFIRMED" &&
      status !== "CANCELLED"
    ) {
      return res.status(400).json({
        message:
          "PENDING orders can only be CONFIRMED or CANCELLED",
      });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // CONFIRMED → CANCELLED
      if (
        order.status === "CONFIRMED" &&
        status === "CANCELLED"
      ) {
        const cancelledOrder = await tx.order.updateMany({
          where: {
            id: orderId,
            status: "CONFIRMED",
          },
          data: {
            status: "CANCELLED",
          },
        });

        // Another request changed the order first
        if (cancelledOrder.count !== 1) {
          throw new Error("ORDER_STATE_CHANGED");
        }

        // Restore inventory exactly once
        await tx.produce.update({
          where: {
            id: order.produceId,
          },
          data: {
            quantity: {
              increment: order.quantity,
            },
            status: "AVAILABLE",
          },
        });
      }

      // Other valid transitions
      else {
        const updated = await tx.order.updateMany({
          where: {
            id: orderId,
            status: order.status,
          },
          data: {
            status,
          },
        });

        if (updated.count !== 1) {
          throw new Error("ORDER_STATE_CHANGED");
        }
      }

      return tx.order.findUnique({
        where: {
          id: orderId,
        },
        include: {
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          produce: {
            include: {
              crop: true,
            },
          },
        },
      });
    });

    return res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    if (error.message === "ORDER_STATE_CHANGED") {
      return res.status(409).json({
        message: "Order status changed by another request",
      });
    }

    console.error("Update farmer order error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
module.exports = {
  getFarmerOrders,
  getFarmerOrderById,
  updateFarmerOrderStatus,
};