const prisma = require("../lib/prisma");

// ==========================
// CREATE CROP
// ==========================

const createCrop = async (req, res) => {
  try {
    const farmId = Number(req.params.farmId);

    if (!Number.isInteger(farmId) || farmId <= 0) {
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

    // Validate crop name
    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        message: "Crop name is required",
      });
    }

    const normalizedName = name.trim();

    if (
      normalizedName.length < 2 ||
      normalizedName.length > 100
    ) {
      return res.status(400).json({
        message:
          "Crop name must be between 2 and 100 characters",
      });
    }

    // Validate variety if provided
    if (
      variety !== undefined &&
      variety !== null &&
      (
        typeof variety !== "string" ||
        variety.trim().length > 100
      )
    ) {
      return res.status(400).json({
        message: "Invalid crop variety",
      });
    }

    // Validate season if provided
    if (
      season !== undefined &&
      season !== null &&
      (
        typeof season !== "string" ||
        season.trim().length > 50
      )
    ) {
      return res.status(400).json({
        message: "Invalid crop season",
      });
    }

    // Validate quantity
    if (
      quantity !== undefined &&
      (
        typeof quantity !== "number" ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      )
    ) {
      return res.status(400).json({
        message: "Quantity must be a positive number",
      });
    }

    // Validate unit
    if (
      unit !== undefined &&
      unit !== null &&
      (
        typeof unit !== "string" ||
        unit.trim().length < 1 ||
        unit.trim().length > 20
      )
    ) {
      return res.status(400).json({
        message: "Invalid unit",
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

    // Make sure farm belongs to logged-in farmer
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
        name: normalizedName,

        variety:
          variety !== undefined && variety !== null
            ? variety.trim()
            : null,

        season:
          season !== undefined && season !== null
            ? season.trim()
            : null,

        quantity,
        unit:
          unit !== undefined && unit !== null
            ? unit.trim()
            : null,
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

    if (!Number.isInteger(farmId) || farmId <= 0) {
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

    // Make sure farm belongs to logged-in farmer
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

// ==========================
// EXPORT
// ==========================

module.exports = {
  createCrop,
  getFarmCrops,
};