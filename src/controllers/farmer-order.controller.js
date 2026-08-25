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

    if (Number.isNaN(orderId)) {
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

    // Don't allow changes after completion/cancellation
    if (
      order.status === "COMPLETED" ||
      order.status === "CANCELLED"
    ) {
      return res.status(400).json({
        message: `Order is already ${order.status}`,
      });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
  // If order is cancelled, return the ordered quantity
  // back to the available produce.
  if (
    status === "CANCELLED" &&
    order.status === "CONFIRMED"
  ) {
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

  return await tx.order.update({
    where: {
      id: order.id,
    },
    data: {
      status,
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