const crypto = require("crypto");
const prisma = require("../lib/prisma");

const getCenters = async (req, res) => {
  try {
    const centers = await prisma.procurementCenter.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      centers,
    });
  } catch (error) {
    console.error("Get procurement centers error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const createCenter = async (req, res) => {
  try {
    const {
      name,
      location,
      district,
      operatingHours,
      dailyCapacity,
      status = "ACTIVE",
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    if (
      !Number.isInteger(dailyCapacity) ||
      dailyCapacity <= 0
    ) {
      return res.status(400).json({
        message: "Daily capacity must be a positive integer",
      });
    }

    const allowedStatuses = ["ACTIVE", "INACTIVE"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid procurement center status",
      });
    }

    const center = await prisma.procurementCenter.create({
      data: {
        name: name.trim(),
        location:
          typeof location === "string"
            ? location.trim()
            : null,
        district:
          typeof district === "string"
            ? district.trim()
            : null,
        operatingHours:
          typeof operatingHours === "string"
            ? operatingHours.trim()
            : null,
        dailyCapacity,
        status,
      },
    });

    return res.status(201).json({
      message: "Procurement center created successfully",
      center,
    });
  } catch (error) {
    console.error("Create procurement center error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
const createSlot = async (req, res) => {
  try {
    const { centerId } = req.params;
    const {
      date,
      startTime,
      endTime,
      capacity,
    } = req.body;

    const parsedCenterId = Number(centerId);

    if (!Number.isInteger(parsedCenterId) || parsedCenterId <= 0) {
      return res.status(400).json({
        message: "Invalid center ID",
      });
    }

    if (typeof date !== "string" || !date.trim()) {
      return res.status(400).json({
        message: "Date is required",
      });
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date",
      });
    }

    if (
      typeof startTime !== "string" ||
      !startTime.trim() ||
      typeof endTime !== "string" ||
      !endTime.trim()
    ) {
      return res.status(400).json({
        message: "Start time and end time are required",
      });
    }

    if (
      !Number.isInteger(capacity) ||
      capacity <= 0
    ) {
      return res.status(400).json({
        message: "Slot capacity must be a positive integer",
      });
    }

    const center = await prisma.procurementCenter.findUnique({
      where: {
        id: parsedCenterId,
      },
      select: {
        id: true,
        dailyCapacity: true,
        status: true,
      },
    });

    if (!center) {
      return res.status(404).json({
        message: "Procurement center not found",
      });
    }

    if (center.status !== "ACTIVE") {
      return res.status(400).json({
        message: "Procurement center is inactive",
      });
    }

    if (capacity > center.dailyCapacity) {
      return res.status(400).json({
        message:
          "Slot capacity cannot exceed the center daily capacity",
      });
    }

    const slot = await prisma.procurementSlot.create({
      data: {
        centerId: parsedCenterId,
        date: parsedDate,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        capacity,
      },
    });

    return res.status(201).json({
      message: "Procurement slot created successfully",
      slot,
    });
  } catch (error) {
    console.error("Create procurement slot error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
const getSlots = async (req, res) => {
  try {
    const { centerId } = req.params;
    const parsedCenterId = Number(centerId);

    if (!Number.isInteger(parsedCenterId) || parsedCenterId <= 0) {
      return res.status(400).json({
        message: "Invalid center ID",
      });
    }

    const center = await prisma.procurementCenter.findUnique({
      where: {
        id: parsedCenterId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!center) {
      return res.status(404).json({
        message: "Procurement center not found",
      });
    }

    if (center.status !== "ACTIVE") {
      return res.status(400).json({
        message: "Procurement center is inactive",
      });
    }

    const slots = await prisma.procurementSlot.findMany({
      where: {
        centerId: parsedCenterId,
      },
      orderBy: [
        {
          date: "asc",
        },
        {
          startTime: "asc",
        },
      ],
    });

    return res.status(200).json({
      slots,
    });
  } catch (error) {
    console.error("Get procurement slots error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
const createBooking = async (req, res) => {
  try {
    const { produceId, centerId, slotId, quantity, unit } = req.body;

    const parsedProduceId = Number(produceId);
    const parsedCenterId = Number(centerId);
    const parsedSlotId = Number(slotId);

    if (
      !Number.isInteger(parsedProduceId) ||
      parsedProduceId <= 0 ||
      !Number.isInteger(parsedCenterId) ||
      parsedCenterId <= 0 ||
      !Number.isInteger(parsedSlotId) ||
      parsedSlotId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid produce, center, or slot ID",
      });
    }

    if (
      typeof quantity !== "number" ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        message: "Quantity must be a positive number",
      });
    }

    if (typeof unit !== "string" || !unit.trim()) {
      return res.status(400).json({
        message: "Unit is required",
      });
    }

    const farmer = await prisma.farmer.findUnique({
      where: {
        userId: req.user.userId,
      },
      select: {
        id: true,
      },
    });

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer profile not found",
      });
    }

    const produce = await prisma.produce.findUnique({
      where: {
        id: parsedProduceId,
      },
      select: {
        id: true,
        farmerId: true,
        quantity: true,
        unit: true,
        status: true,
      },
    });

    if (!produce) {
      return res.status(404).json({
        message: "Produce not found",
      });
    }

    if (produce.farmerId !== farmer.id) {
      return res.status(403).json({
        message: "You can only book your own produce",
      });
    }

    if (produce.status !== "AVAILABLE") {
      return res.status(400).json({
        message: "Produce is not available for booking",
      });
    }

    if (quantity > produce.quantity) {
      return res.status(400).json({
        message: "Booking quantity cannot exceed available produce quantity",
      });
    }

    if (unit.trim() !== produce.unit) {
      return res.status(400).json({
        message: "Booking unit must match the produce unit",
      });
    }

    const center = await prisma.procurementCenter.findUnique({
      where: {
        id: parsedCenterId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!center) {
      return res.status(404).json({
        message: "Procurement center not found",
      });
    }

    if (center.status !== "ACTIVE") {
      return res.status(400).json({
        message: "Procurement center is inactive",
      });
    }

    const slot = await prisma.procurementSlot.findUnique({
      where: {
        id: parsedSlotId,
      },
      select: {
        id: true,
        centerId: true,
        capacity: true,
        bookedCount: true,
      },
    });

    if (!slot) {
      return res.status(404).json({
        message: "Procurement slot not found",
      });
    }

    if (slot.centerId !== parsedCenterId) {
      return res.status(400).json({
        message: "Selected slot does not belong to the selected center",
      });
    }

    let result;

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        result = await prisma.$transaction(async (tx) => {
          const updatedSlot = await tx.procurementSlot.updateMany({
            where: {
              id: parsedSlotId,
              bookedCount: {
                lt: slot.capacity,
              },
            },
            data: {
              bookedCount: {
                increment: 1,
              },
            },
          });

          if (updatedSlot.count !== 1) {
            throw new Error("SLOT_CAPACITY_FULL");
          }

          const tokenNumber = String(
            crypto.randomInt(100000, 1000000)
          );

          const booking = await tx.booking.create({
            data: {
              farmerId: farmer.id,
              produceId: parsedProduceId,
              centerId: parsedCenterId,
              slotId: parsedSlotId,
              quantity,
              unit: unit.trim(),
              tokenNumber,
              status: "PENDING",
            },
          });

          return booking;
        });

        break;
      } catch (error) {
        if (
          error.code === "P2002" &&
          attempt < 4
        ) {
          continue;
        }

        throw error;
      }
    }

    return res.status(201).json({
      message: "Procurement booking created successfully",
      booking: result,
    });
  } catch (error) {
    if (error.message === "SLOT_CAPACITY_FULL") {
      return res.status(409).json({
        message: "Procurement slot is full",
      });
    }

    console.error("Create procurement booking error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
const createPrice = async (req, res) => {
  try {
    const {
      cropId,
      rate,
      effectiveFrom,
      effectiveTo,
    } = req.body;

    const parsedCropId = Number(cropId);

    if (!Number.isInteger(parsedCropId) || parsedCropId <= 0) {
      return res.status(400).json({
        message: "Invalid crop ID",
      });
    }

    if (
      typeof rate !== "number" ||
      !Number.isFinite(rate) ||
      rate <= 0
    ) {
      return res.status(400).json({
        message: "Rate must be a positive number",
      });
    }

    if (
      typeof effectiveFrom !== "string" ||
      !effectiveFrom.trim()
    ) {
      return res.status(400).json({
        message: "Effective from date is required",
      });
    }

    const parsedEffectiveFrom = new Date(effectiveFrom);

    if (Number.isNaN(parsedEffectiveFrom.getTime())) {
      return res.status(400).json({
        message: "Invalid effective from date",
      });
    }

    let parsedEffectiveTo = null;

    if (effectiveTo !== undefined && effectiveTo !== null) {
      if (
        typeof effectiveTo !== "string" ||
        !effectiveTo.trim()
      ) {
        return res.status(400).json({
          message: "Invalid effective to date",
        });
      }

      parsedEffectiveTo = new Date(effectiveTo);

      if (Number.isNaN(parsedEffectiveTo.getTime())) {
        return res.status(400).json({
          message: "Invalid effective to date",
        });
      }

      if (parsedEffectiveTo <= parsedEffectiveFrom) {
        return res.status(400).json({
          message: "Effective to date must be after effective from date",
        });
      }
    }

    const crop = await prisma.crop.findUnique({
      where: {
        id: parsedCropId,
      },
      select: {
        id: true,
      },
    });

    if (!crop) {
      return res.status(404).json({
        message: "Crop not found",
      });
    }

    const price = await prisma.procurementPrice.create({
      data: {
        cropId: parsedCropId,
        rate,
        effectiveFrom: parsedEffectiveFrom,
        effectiveTo: parsedEffectiveTo,
      },
    });

    return res.status(201).json({
      message: "Procurement price created successfully",
      price,
    });
  } catch (error) {
    console.error("Create procurement price error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
const getPrices = async (req, res) => {
  try {
    const { cropId } = req.query;

    const where = {};

    if (cropId !== undefined) {
      const parsedCropId = Number(cropId);

      if (!Number.isInteger(parsedCropId) || parsedCropId <= 0) {
        return res.status(400).json({
          message: "Invalid crop ID",
        });
      }

      where.cropId = parsedCropId;
    }

    const prices = await prisma.procurementPrice.findMany({
      where,
      orderBy: [
        {
          effectiveFrom: "desc",
        },
        {
          id: "desc",
        },
      ],
      include: {
        crop: {
          select: {
            id: true,
            name: true,
            variety: true,
            season: true,
            unit: true,
          },
        },
      },
    });

    return res.status(200).json({
      prices,
    });
  } catch (error) {
    console.error("Get procurement prices error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
const confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const parsedBookingId = Number(bookingId);

    if (!Number.isInteger(parsedBookingId) || parsedBookingId <= 0) {
      return res.status(400).json({
        message: "Invalid booking ID",
      });
    }

    const booking = await prisma.booking.findUnique({
      where: {
        id: parsedBookingId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (booking.status !== "PENDING") {
      return res.status(400).json({
        message: "Only pending bookings can be confirmed",
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: {
        id: parsedBookingId,
      },
      data: {
        status: "CONFIRMED",
      },
    });

    return res.status(200).json({
      message: "Procurement booking confirmed successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Confirm procurement booking error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
const verifyBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const {
      decision,
      verifiedQuantity,
      verifiedQuality,
      rejectionReason,
    } = req.body;

    const parsedBookingId = Number(bookingId);

    if (!Number.isInteger(parsedBookingId) || parsedBookingId <= 0) {
      return res.status(400).json({
        message: "Invalid booking ID",
      });
    }

    const allowedDecisions = [
      "ACCEPTED",
      "PARTIALLY_ACCEPTED",
      "REJECTED",
    ];

    if (!allowedDecisions.includes(decision)) {
      return res.status(400).json({
        message: "Invalid procurement decision",
      });
    }

    if (
      typeof verifiedQuantity !== "number" ||
      !Number.isFinite(verifiedQuantity) ||
      verifiedQuantity < 0
    ) {
      return res.status(400).json({
        message: "Verified quantity must be a non-negative number",
      });
    }

    if (
      decision !== "REJECTED" &&
      verifiedQuantity <= 0
    ) {
      return res.status(400).json({
        message: "Verified quantity must be greater than zero",
      });
    }

    if (
      decision === "REJECTED" &&
      verifiedQuantity !== 0
    ) {
      return res.status(400).json({
        message: "Rejected procurement must have zero verified quantity",
      });
    }

    if (
      typeof verifiedQuality !== "undefined" &&
      verifiedQuality !== null &&
      typeof verifiedQuality !== "string"
    ) {
      return res.status(400).json({
        message: "Verified quality must be a string",
      });
    }

    if (
      decision === "REJECTED" &&
      (
        typeof rejectionReason !== "string" ||
        !rejectionReason.trim()
      )
    ) {
      return res.status(400).json({
        message: "Rejection reason is required when procurement is rejected",
      });
    }

    const booking = await prisma.booking.findUnique({
      where: {
        id: parsedBookingId,
      },
      include: {
        produce: {
          select: {
            id: true,
            quantity: true,
            cropId: true,
          },
        },
        slot: {
          select: {
            date: true,
          },
        },
        transaction: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (booking.status !== "CONFIRMED") {
      return res.status(400).json({
        message: "Only confirmed bookings can be verified",
      });
    }

    if (booking.transaction) {
      return res.status(400).json({
        message: "Booking has already been verified",
      });
    }

    if (verifiedQuantity > booking.quantity) {
      return res.status(400).json({
        message: "Verified quantity cannot exceed booked quantity",
      });
    }

    const verifiedAt = new Date();

    // Use the procurement slot date to determine
    // which MSP/base price was applicable.
    const procurementDate = new Date(booking.slot.date);

    const price = await prisma.procurementPrice.findFirst({
      where: {
        cropId: booking.produce.cropId,
        effectiveFrom: {
          lte: procurementDate,
        },
        OR: [
          {
            effectiveTo: null,
          },
          {
            effectiveTo: {
              gt: procurementDate,
            },
          },
        ],
      },
      orderBy: [
        {
          effectiveFrom: "desc",
        },
        {
          id: "desc",
        },
      ],
    });

    if (!price) {
      return res.status(400).json({
        message: "No applicable procurement price found for this crop",
      });
    }

    const finalPayableAmount =
      Number(verifiedQuantity) * Number(price.rate);

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.procurementTransaction.create({
        data: {
          bookingId: booking.id,
          verifiedBy: req.user.userId,
          decision,
          verifiedQuantity,
          verifiedQuality:
            typeof verifiedQuality === "string"
              ? verifiedQuality.trim()
              : null,
          applicableRate: price.rate,
          finalPayableAmount,
          rejectionReason:
            decision === "REJECTED"
              ? rejectionReason.trim()
              : null,
          verifiedAt,
        },
      });

      const updatedBooking = await tx.booking.update({
        where: {
          id: booking.id,
        },
        data: {
          status:
            decision === "REJECTED"
              ? "CANCELLED"
              : "COMPLETED",
        },
      });

      return {
        transaction,
        booking: updatedBooking,
      };
    });

    return res.status(201).json({
      message: "Procurement verification completed successfully",
      transaction: result.transaction,
      booking: result.booking,
    });
  } catch (error) {
    console.error("Verify procurement booking error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Booking has already been verified",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
const getMyBookings = async (req, res) => {
  try {
    const farmer = await prisma.farmer.findUnique({
      where: {
        userId: req.user.userId,
      },
      select: {
        id: true,
      },
    });

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer profile not found",
      });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        farmerId: farmer.id,
      },
      include: {
        produce: {
          select: {
            id: true,
            quantity: true,
            unit: true,
            status: true,
            crop: {
              select: {
                id: true,
                name: true,
                variety: true,
                season: true,
                unit: true,
              },
            },
          },
        },
        center: {
          select: {
            id: true,
            name: true,
            location: true,
            district: true,
            operatingHours: true,
            status: true,
          },
        },
        slot: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            capacity: true,
            bookedCount: true,
          },
        },
        transaction: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      bookings,
    });
  } catch (error) {
    console.error("Get farmer procurement bookings error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getBookingById = async (req, res) => {
  try {
    const parsedBookingId = Number(req.params.bookingId);

    if (!Number.isInteger(parsedBookingId) || parsedBookingId <= 0) {
      return res.status(400).json({
        message: "Invalid booking ID",
      });
    }

    const booking = await prisma.booking.findUnique({
      where: {
        id: parsedBookingId,
      },
      include: {
        farmer: {
          select: {
            id: true,
            userId: true,
          },
        },
        produce: {
          select: {
            id: true,
            quantity: true,
            unit: true,
            status: true,
            crop: {
              select: {
                id: true,
                name: true,
                variety: true,
                season: true,
                unit: true,
              },
            },
          },
        },
        center: true,
        slot: true,
        transaction: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    const isAdmin = req.user.role === "ADMIN";

    if (!isAdmin && booking.farmer.userId !== req.user.userId) {
      return res.status(403).json({
        message: "You can only access your own bookings",
      });
    }

    return res.status(200).json({
      booking,
    });
  } catch (error) {
    console.error("Get procurement booking error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getBookingByToken = async (req, res) => {
  try {
    const parsedSlotId = Number(req.params.slotId);
    const tokenNumber = String(req.params.tokenNumber || "").trim();

    if (!Number.isInteger(parsedSlotId) || parsedSlotId <= 0) {
      return res.status(400).json({
        message: "Invalid slot ID",
      });
    }

    if (!tokenNumber) {
      return res.status(400).json({
        message: "Token number is required",
      });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        slotId: parsedSlotId,
        tokenNumber,
      },
      include: {
        produce: {
          select: {
            id: true,
            quantity: true,
            unit: true,
            status: true,
            crop: {
              select: {
                id: true,
                name: true,
                variety: true,
                season: true,
                unit: true,
              },
            },
          },
        },
        center: {
          select: {
            id: true,
            name: true,
            location: true,
            district: true,
            operatingHours: true,
            status: true,
          },
        },
        slot: {
          select: {
            id: true,
            centerId: true,
            date: true,
            startTime: true,
            endTime: true,
            capacity: true,
            bookedCount: true,
          },
        },
        transaction: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking with token not found",
      });
    }

    return res.status(200).json({
      booking,
    });
  } catch (error) {
    console.error("Get procurement booking by token error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const parsedTransactionId = Number(req.params.transactionId);

    if (
      !Number.isInteger(parsedTransactionId) ||
      parsedTransactionId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid transaction ID",
      });
    }

    const transaction = await prisma.procurementTransaction.findUnique({
      where: {
        id: parsedTransactionId,
      },
      include: {
        booking: {
          include: {
            farmer: {
              select: {
                id: true,
                userId: true,
              },
            },
            produce: {
              select: {
                id: true,
                quantity: true,
                unit: true,
                cropId: true,
                crop: {
                  select: {
                    id: true,
                    name: true,
                    variety: true,
                    season: true,
                    unit: true,
                  },
                },
              },
            },
            center: {
              select: {
                id: true,
                name: true,
                location: true,
                district: true,
              },
            },
            slot: {
              select: {
                id: true,
                date: true,
                startTime: true,
                endTime: true,
              },
            },
          },
        },
        verifier: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Procurement transaction not found",
      });
    }

    if (
      req.user.role !== "ADMIN" &&
      transaction.booking.farmer.userId !== req.user.userId
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    return res.status(200).json({
      transaction,
    });
  } catch (error) {
    console.error("Get procurement transaction error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getTransactions = async (req, res) => {
  try {
    const transactions = await prisma.procurementTransaction.findMany({
      include: {
        booking: {
          include: {
            farmer: {
              select: {
                id: true,
                userId: true,
              },
            },
            produce: {
              select: {
                id: true,
                quantity: true,
                unit: true,
                crop: {
                  select: {
                    id: true,
                    name: true,
                    variety: true,
                    season: true,
                    unit: true,
                  },
                },
              },
            },
            center: {
              select: {
                id: true,
                name: true,
                location: true,
                district: true,
              },
            },
            slot: {
              select: {
                id: true,
                date: true,
                startTime: true,
                endTime: true,
              },
            },
          },
        },
        verifier: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      transactions,
    });
  } catch (error) {
    console.error("Get procurement transactions error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
module.exports = {
  getCenters,
  createCenter,
  createSlot,
  getSlots,
  createBooking,
  createPrice,
  getPrices,
  confirmBooking,
  verifyBooking,
  getMyBookings,
  getBookingById,
  getBookingByToken,
  getTransactionById,
  getTransactions,
};