const prisma = require("../lib/prisma");

const getMyProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
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
            address: true,
            district: true,
            state: true,
            pincode: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Farmer not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get farmer profile error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
const updateMyProfile = async (req, res) => {
  try {
    const {
      address,
      district,
      state,
      pincode,
    } = req.body;

    const farmer = await prisma.farmer.update({
      where: {
        userId: req.user.userId,
      },
      data: {
        address,
        district,
        state,
        pincode,
      },
      select: {
        id: true,
        address: true,
        district: true,
        state: true,
        pincode: true,
      },
    });

    return res.status(200).json({
      message: "Farmer profile updated successfully",
      farmer,
    });
  } catch (error) {
    console.error("Update farmer profile error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
};