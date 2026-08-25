const prisma = require("../lib/prisma");

// ==========================
// CREATE PRODUCE
// ==========================

const createProduce = async (req, res) => {
  try {
    const {
      cropId,
      quantity,
      unit,
      price,
      harvestDate,
    } = req.body;

    // Validate crop ID
    const parsedCropId = Number(cropId);

    if (!Number.isInteger(parsedCropId) || parsedCropId <= 0) {
      return res.status(400).json({
        message: "Invalid crop ID",
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

    // Validate unit
    if (
      typeof unit !== "string" ||
      !unit.trim() ||
      unit.trim().length > 20
    ) {
      return res.status(400).json({
        message: "Unit is required and must be at most 20 characters",
      });
    }

    // Validate price if provided
    if (
      price !== undefined &&
      price !== null &&
      (
        typeof price !== "number" ||
        !Number.isFinite(price) ||
        price < 0
      )
    ) {
      return res.status(400).json({
        message: "Price must be a non-negative number",
      });
    }

    // Validate harvest date if provided
    let parsedHarvestDate = null;

    if (harvestDate !== undefined && harvestDate !== null) {
      parsedHarvestDate = new Date(harvestDate);

      if (Number.isNaN(parsedHarvestDate.getTime())) {
        return res.status(400).json({
          message: "Invalid harvest date",
        });
      }
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

    // Make sure crop belongs to this farmer
    const crop = await prisma.crop.findFirst({
      where: {
        id: parsedCropId,
        farm: {
          farmerId: farmer.id,
        },
      },
    });

    if (!crop) {
      return res.status(404).json({
        message: "Crop not found",
      });
    }

    const produce = await prisma.produce.create({
      data: {
        farmerId: farmer.id,
        cropId: parsedCropId,
        quantity,
        unit: unit.trim(),
        price:
          price !== undefined && price !== null
            ? price
            : null,
        harvestDate: parsedHarvestDate,
      },

      include: {
        crop: true,
      },
    });

    return res.status(201).json({
      message: "Produce listed successfully",
      produce,
    });
  } catch (error) {
    console.error("Create produce error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// GET MY PRODUCE
// ==========================

const getMyProduce = async (req, res) => {
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

    const produce = await prisma.produce.findMany({
      where: {
        farmerId: farmer.id,
      },

      include: {
        crop: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      produce,
    });
  } catch (error) {
    console.error("Get produce error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// GET PRODUCE BY ID
// ==========================

const getProduceById = async (req, res) => {
  try {
    const produceId = Number(req.params.id);

    if (!Number.isInteger(produceId) || produceId <= 0) {
      return res.status(400).json({
        message: "Invalid produce ID",
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

    const produce = await prisma.produce.findFirst({
      where: {
        id: produceId,
        farmerId: farmer.id,
      },

      include: {
        crop: true,
      },
    });

    if (!produce) {
      return res.status(404).json({
        message: "Produce not found",
      });
    }

    return res.status(200).json({
      produce,
    });
  } catch (error) {
    console.error("Get produce error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// UPDATE PRODUCE
// ==========================

const updateProduce = async (req, res) => {
  try {
    const produceId = Number(req.params.id);

    if (!Number.isInteger(produceId) || produceId <= 0) {
      return res.status(400).json({
        message: "Invalid produce ID",
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

    const existingProduce = await prisma.produce.findFirst({
      where: {
        id: produceId,
        farmerId: farmer.id,
      },
    });

    if (!existingProduce) {
      return res.status(404).json({
        message: "Produce not found",
      });
    }

    const {
      quantity,
      unit,
      price,
      harvestDate,
    } = req.body;

    // Validate quantity if provided
    if (quantity !== undefined) {
      if (
        typeof quantity !== "number" ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          message: "Quantity must be a positive number",
        });
      }
    }

    // Validate unit if provided
    if (unit !== undefined) {
      if (
        typeof unit !== "string" ||
        !unit.trim() ||
        unit.trim().length > 20
      ) {
        return res.status(400).json({
          message: "Invalid unit",
        });
      }
    }

    // Validate price if provided
    if (price !== undefined && price !== null) {
      if (
        typeof price !== "number" ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        return res.status(400).json({
          message: "Price must be a non-negative number",
        });
      }
    }

    // Validate harvest date if provided
    let parsedHarvestDate;

    if (harvestDate !== undefined) {
      if (harvestDate === null || harvestDate === "") {
        parsedHarvestDate = null;
      } else {
        parsedHarvestDate = new Date(harvestDate);

        if (Number.isNaN(parsedHarvestDate.getTime())) {
          return res.status(400).json({
            message: "Invalid harvest date",
          });
        }
      }
    }

    const produce = await prisma.produce.update({
      where: {
        id: produceId,
      },

      data: {
        ...(quantity !== undefined && {
          quantity,
        }),

        ...(unit !== undefined && {
          unit: unit.trim(),
        }),

        ...(price !== undefined && {
          price,
        }),

        ...(harvestDate !== undefined && {
          harvestDate: parsedHarvestDate,
        }),
      },

      include: {
        crop: true,
      },
    });

    return res.status(200).json({
      message: "Produce updated successfully",
      produce,
    });
  } catch (error) {
    console.error("Update produce error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// DELETE PRODUCE
// ==========================

const deleteProduce = async (req, res) => {
  try {
    const produceId = Number(req.params.id);

    if (!Number.isInteger(produceId) || produceId <= 0) {
      return res.status(400).json({
        message: "Invalid produce ID",
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

    const existingProduce = await prisma.produce.findFirst({
      where: {
        id: produceId,
        farmerId: farmer.id,
      },
    });

    if (!existingProduce) {
      return res.status(404).json({
        message: "Produce not found",
      });
    }

    await prisma.produce.delete({
      where: {
        id: produceId,
      },
    });

    return res.status(200).json({
      message: "Produce deleted successfully",
    });
  } catch (error) {
    console.error("Delete produce error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// UPDATE PRODUCE STATUS
// ==========================

const updateProduceStatus = async (req, res) => {
  try {
    const produceId = Number(req.params.id);
    const { status } = req.body;

    const allowedStatuses = [
      "AVAILABLE",
      "RESERVED",
      "SOLD",
    ];

    if (!Number.isInteger(produceId) || produceId <= 0) {
      return res.status(400).json({
        message: "Invalid produce ID",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Invalid status. Use AVAILABLE, RESERVED or SOLD",
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

    const existingProduce = await prisma.produce.findFirst({
      where: {
        id: produceId,
        farmerId: farmer.id,
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
    });

    return res.status(200).json({
      message: "Produce status updated successfully",
      produce,
    });
  } catch (error) {
    console.error("Update produce status error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// EXPORT
// ==========================

module.exports = {
  createProduce,
  getMyProduce,
  getProduceById,
  updateProduce,
  deleteProduce,
  updateProduceStatus,
};