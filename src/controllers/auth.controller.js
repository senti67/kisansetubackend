const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

// ==========================
// REGISTER
// ==========================

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role = "FARMER",
    } = req.body;

    // ==========================
    // REQUIRED FIELD VALIDATION
    // ==========================

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // ==========================
    // NAME VALIDATION
    // ==========================

    if (
      normalizedName.length < 2 ||
      normalizedName.length > 100
    ) {
      return res.status(400).json({
        message: "Name must be between 2 and 100 characters",
      });
    }

    // ==========================
    // EMAIL VALIDATION
    // ==========================

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // ==========================
    // PASSWORD VALIDATION
    // ==========================

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({
        message: "Password must be between 8 and 128 characters",
      });
    }

    // ==========================
    // PHONE VALIDATION
    // ==========================

    if (
      phone !== undefined &&
      phone !== null &&
      !/^\d{10}$/.test(String(phone))
    ) {
      return res.status(400).json({
        message: "Phone number must contain exactly 10 digits",
      });
    }

    const normalizedPhone =
      phone !== undefined && phone !== null
        ? String(phone).trim()
        : null;

    // ==========================
    // ROLE VALIDATION
    // ==========================

    const allowedRoles = ["FARMER", "BUYER"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Use FARMER or BUYER",
      });
    }

    // ==========================
    // CHECK EXISTING EMAIL
    // ==========================

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User with this email already exists",
      });
    }

    // ==========================
    // HASH PASSWORD
    // ==========================

    const passwordHash = await bcrypt.hash(password, 10);

    // ==========================
    // CREATE USER
    // ==========================

    const user = await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        passwordHash,
        phone: normalizedPhone,
        role,
      },
    });

    // ==========================
    // CREATE FARMER PROFILE
    // ==========================

    if (role === "FARMER") {
      await prisma.farmer.create({
        data: {
          userId: user.id,
        },
      });
    }

    // ==========================
    // RESPONSE
    // ==========================

    return res.status(201).json({
      message:
        role === "FARMER"
          ? "Farmer registered successfully"
          : "Buyer registered successfully",

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// LOGIN
// ==========================

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ==========================
    // REQUIRED FIELD VALIDATION
    // ==========================

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ==========================
    // EMAIL VALIDATION
    // ==========================

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // ==========================
    // FIND USER
    // ==========================

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // ==========================
    // COMPARE PASSWORD
    // ==========================

    const passwordMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // ==========================
    // CREATE JWT
    // ==========================

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // ==========================
    // RESPONSE
    // ==========================

    return res.status(200).json({
      message: "Login successful",

      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// GET CURRENT USER
// ==========================

const getMe = async (req, res) => {
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
        farmer: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ==========================
// EXPORT
// ==========================

module.exports = {
  register,
  login,
  getMe,
};