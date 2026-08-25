const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");

const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User with this email already exists",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create User + Farmer together
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone,
        role: "FARMER",

        farmer: {
          create: {},
        },
      },

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        farmer: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "Farmer registered successfully",
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  register,
};