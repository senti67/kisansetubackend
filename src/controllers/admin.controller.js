const prisma = require("../lib/prisma");

// ==========================
// ADMIN DASHBOARD
// ==========================
const getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalFarmers,
      totalBuyers,
      totalFarms,
      totalCrops,
      totalProduce,
      totalOrders,
      pendingOrders,
      completedOrders,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.user.count({
        where: {
          role: "FARMER",
        },
      }),

      prisma.user.count({
        where: {
          role: "BUYER",
        },
      }),

      prisma.farm.count(),
      prisma.crop.count(),
      prisma.produce.count(),
      prisma.order.count(),

      prisma.order.count({
        where: {
          status: "CONFIRMED",
        },
      }),

      prisma.order.count({
        where: {
          status: "COMPLETED",
        },
      }),
    ]);

    return res.status(200).json({
      dashboard: {
        totalUsers,
        totalFarmers,
        totalBuyers,
        totalFarms,
        totalCrops,
        totalProduce,
        totalOrders,
        pendingOrders,
        completedOrders,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// GET ALL USERS
// ==========================
const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        farmer: {
          select: {
            id: true,
            district: true,
            state: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Admin users error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const allowedRoles = ["FARMER", "BUYER"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Use FARMER or BUYER",
      });
    }

    if (req.user.userId === userId) {
      return res.status(400).json({
        message: "Admin cannot change their own role",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (existingUser.role === "ADMIN") {
      return res.status(400).json({
        message: "Cannot modify another ADMIN",
      });
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      message: "User role updated successfully",
      user,
    });
  } catch (error) {
    console.error("Admin role update error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
// ==========================
// GET ALL ORDERS
// ==========================
const getOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
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
            farmer: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
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
    console.error("Admin orders error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// GET ALL PRODUCE
// ==========================
const getProduce = async (req, res) => {
  try {
    const produce = await prisma.produce.findMany({
      include: {
        farmer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        crop: {
          include: {
            farm: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      count: produce.length,
      produce,
    });
  } catch (error) {
    console.error("Admin produce error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
const updateProduceStatus = async (req, res) => {
  try {
    const produceId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(produceId)) {
      return res.status(400).json({
        message: "Invalid produce ID",
      });
    }

    const allowedStatuses = [
      "AVAILABLE",
      "RESERVED",
      "SOLD",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid produce status",
      });
    }

    const existingProduce = await prisma.produce.findUnique({
      where: {
        id: produceId,
      },
    });

    if (!existingProduce) {
      return res.status(404).json({
        message: "Produce not found",
      });
    }

    const produce = await prisma.produce.update({
      where: {
        id: produceId,
      },
      data: {
        status,
      },
      include: {
        crop: true,
        farmer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      message: "Produce status updated successfully",
      produce,
    });
  } catch (error) {
    console.error("Admin produce status error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
const updateOrderStatus = async (req, res) => {
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
        message: "Invalid order status",
      });
    }

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        produce: true,
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

    // Only allow sensible transitions
    if (
      order.status === "CONFIRMED" &&
      status !== "COMPLETED" &&
      status !== "CANCELLED"
    ) {
      return res.status(400).json({
        message: "CONFIRMED orders can only be COMPLETED or CANCELLED",
      });
    }

    if (
      order.status === "PENDING" &&
      status !== "CONFIRMED" &&
      status !== "CANCELLED"
    ) {
      return res.status(400).json({
        message: "PENDING orders can only be CONFIRMED or CANCELLED",
      });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // If cancelling a confirmed order,
      // restore the reserved quantity to produce.
      if (
        order.status === "CONFIRMED" &&
        status === "CANCELLED"
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

      return tx.order.update({
        where: {
          id: orderId,
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
    console.error("Admin order status error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
module.exports = {
  getDashboard,
  getUsers,
  updateUserRole,
  getOrders,
  getProduce,
  updateProduceStatus,
  updateOrderStatus,
};