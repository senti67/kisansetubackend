const prisma = require("../lib/prisma");

// ==========================
// CREATE CROP
// ==========================
const createCrop = async (req, res) => {
  try {
    const farmId = Number(req.params.farmId);

    if (Number.isNaN(farmId)) {
      return res.status(400).json({
        message: "Invalid farm ID",
      });
    }

    const {
      name,
      variety,
      season,
      quantity,
      unit,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Crop name is required",
      });
    }

    // Find logged-in farmer
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

    // Make sure this farm belongs to the logged-in farmer
    const farm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        farmerId: farmer.id,
      },
    });

    if (!farm) {
      return res.status(404).json({
        message: "Farm not found",
      });
    }

    const crop = await prisma.crop.create({
      data: {
        farmId,
        name,
        variety,
        season,
        quantity,
        unit,
      },
    });

    return res.status(201).json({
      message: "Crop created successfully",
      crop,
    });
  } catch (error) {
    console.error("Create crop error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// GET CROPS FOR MY FARM
// ==========================
const getFarmCrops = async (req, res) => {
  try {
    const farmId = Number(req.params.farmId);

    if (Number.isNaN(farmId)) {
      return res.status(400).json({
        message: "Invalid farm ID",
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

    const farm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        farmerId: farmer.id,
      },
    });

    if (!farm) {
      return res.status(404).json({
        message: "Farm not found",
      });
    }

    const crops = await prisma.crop.findMany({
      where: {
        farmId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      crops,
    });
  } catch (error) {
    console.error("Get crops error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  createCrop,
  getFarmCrops,
};