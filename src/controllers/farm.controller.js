const prisma = require("../lib/prisma");

// ==========================
// CREATE FARM
// ==========================

const createFarm = async (req, res) => {
  try {
    const { name, location, areaAcres } = req.body;

    // Validate name
    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        message: "Farm name is required",
      });
    }

    const normalizedName = name.trim();

    if (normalizedName.length < 2 || normalizedName.length > 100) {
      return res.status(400).json({
        message: "Farm name must be between 2 and 100 characters",
      });
    }

    // Validate location if provided
    if (
      location !== undefined &&
      location !== null &&
      (
        typeof location !== "string" ||
        location.trim().length > 200
      )
    ) {
      return res.status(400).json({
        message: "Invalid farm location",
      });
    }

    // Validate area
    if (
      areaAcres !== undefined &&
      (
        typeof areaAcres !== "number" ||
        !Number.isFinite(areaAcres) ||
        areaAcres <= 0
      )
    ) {
      return res.status(400).json({
        message: "Area must be a positive number",
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

    const farm = await prisma.farm.create({
      data: {
        farmerId: farmer.id,
        name: normalizedName,
        location:
          location !== undefined && location !== null
            ? location.trim()
            : null,
        areaAcres,
      },
    });

    return res.status(201).json({
      message: "Farm created successfully",
      farm,
    });
  } catch (error) {
    console.error("Create farm error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// GET MY FARMS
// ==========================

const getMyFarms = async (req, res) => {
  try {
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

    const farms = await prisma.farm.findMany({
      where: {
        farmerId: farmer.id,
      },

      include: {
        crops: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      farms,
    });
  } catch (error) {
    console.error("Get farms error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// GET FARM BY ID
// ==========================

const getFarmById = async (req, res) => {
  try {
    const farmId = Number(req.params.id);

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

    const farm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        farmerId: farmer.id,
      },

      include: {
        crops: true,
      },
    });

    if (!farm) {
      return res.status(404).json({
        message: "Farm not found",
      });
    }

    return res.status(200).json({
      farm,
    });
  } catch (error) {
    console.error("Get farm error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// UPDATE FARM
// ==========================

const updateFarm = async (req, res) => {
  try {
    const farmId = Number(req.params.id);

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

    const existingFarm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        farmerId: farmer.id,
      },
    });

    if (!existingFarm) {
      return res.status(404).json({
        message: "Farm not found",
      });
    }

    const { name, location, areaAcres } = req.body;

    // Validate name if provided
    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          message: "Farm name cannot be empty",
        });
      }

      if (
        name.trim().length < 2 ||
        name.trim().length > 100
      ) {
        return res.status(400).json({
          message:
            "Farm name must be between 2 and 100 characters",
        });
      }
    }

    // Validate location if provided
    if (location !== undefined) {
      if (
        location !== null &&
        (
          typeof location !== "string" ||
          location.trim().length > 200
        )
      ) {
        return res.status(400).json({
          message: "Invalid farm location",
        });
      }
    }

    // Validate area if provided
    if (areaAcres !== undefined) {
      if (
        typeof areaAcres !== "number" ||
        !Number.isFinite(areaAcres) ||
        areaAcres <= 0
      ) {
        return res.status(400).json({
          message: "Area must be a positive number",
        });
      }
    }

    const farm = await prisma.farm.update({
      where: {
        id: farmId,
      },

      data: {
        ...(name !== undefined && {
          name: name.trim(),
        }),

        ...(location !== undefined && {
          location:
            location === null
              ? null
              : location.trim(),
        }),

        ...(areaAcres !== undefined && {
          areaAcres,
        }),
      },
    });

    return res.status(200).json({
      message: "Farm updated successfully",
      farm,
    });
  } catch (error) {
    console.error("Update farm error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// DELETE FARM
// ==========================

const deleteFarm = async (req, res) => {
  try {
    const farmId = Number(req.params.id);

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

    await prisma.farm.delete({
      where: {
        id: farmId,
      },
    });

    return res.status(200).json({
      message: "Farm deleted successfully",
    });
  } catch (error) {
    console.error("Delete farm error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// EXPORT
// ==========================

module.exports = {
  createFarm,
  getMyFarms,
  getFarmById,
  updateFarm,
  deleteFarm,
};