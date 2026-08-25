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

module.exports = {
  getDashboard,
  getUsers,
  getOrders,
  getProduce,
};