const prisma = require("../lib/prisma");

// ==========================
// GET AVAILABLE PRODUCE
// ==========================
const getAvailableProduce = async (req, res) => {
  try {
    const produce = await prisma.produce.findMany({
      where: {
        status: "AVAILABLE",
        quantity: {
          gt: 0,
        },
      },
      include: {
        crop: {
          include: {
            farm: {
              select: {
                id: true,
                name: true,
                location: true,
                areaAcres: true,
              },
            },
          },
        },
        farmer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
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
      count: produce.length,
      produce,
    });
  } catch (error) {
    console.error("Get marketplace produce error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// GET MARKETPLACE ITEM
// ==========================
const getMarketplaceProduceById = async (req, res) => {
  try {
    const produceId = Number(req.params.id);

    if (Number.isNaN(produceId)) {
      return res.status(400).json({
        message: "Invalid produce ID",
      });
    }

    const produce = await prisma.produce.findFirst({
      where: {
        id: produceId,
        status: "AVAILABLE",
        quantity: {
          gt: 0,
        },
      },
      include: {
        crop: {
          include: {
            farm: {
              select: {
                id: true,
                name: true,
                location: true,
                areaAcres: true,
              },
            },
          },
        },
        farmer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!produce) {
      return res.status(404).json({
        message: "Available produce not found",
      });
    }

    return res.status(200).json({
      produce,
    });
  } catch (error) {
    console.error("Get marketplace produce error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  getAvailableProduce,
  getMarketplaceProduceById,
};