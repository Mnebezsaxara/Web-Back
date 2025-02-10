// authController.js
import User from "../models/user.js";
import Otp from "../models/otp.js";
import { sendEmail } from "../utils/mailer.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || "defaultsecretkey";

// Add test mode handling
const handleEmailVerification = async (req, res, next) => {
  // If test mode is enabled, skip email sending
  if (req.headers["x-test-mode"] === "true") {
    req.testOTP = "123456"; // Use fixed OTP for tests
    return next();
  }

  try {
    // Your existing email sending logic
    await sendEmail(/* ... */);
    next();
  } catch (error) {
    next(error);
  }
};

// Логин пользователя с OTP
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate and store OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await storeOTP(email, otp);

    // Send OTP via email
    try {
      await sendEmail(email, "Login OTP", `Your OTP is: ${otp}`);
      res
        .status(200)
        .json({ message: "OTP отправлен на email. Проверьте почту." });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      res.status(500).json({ error: "Error sending OTP email" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Helper function to store OTP
async function storeOTP(email, otp) {
  try {
    // Delete any existing OTP for this email
    await Otp.deleteMany({ email });

    // Create new OTP record
    const otpRecord = new Otp({
      email,
      otp,
      createdAt: new Date(),
    });

    await otpRecord.save();
  } catch (error) {
    console.error("Error storing OTP:", error);
    throw error;
  }
}

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  try {
    const otpRecord = await Otp.findOne({
      email,
      otp,
      createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) }, // OTP valid for 5 minutes
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Delete used OTP
    await Otp.deleteMany({ email });

    const user = await User.findOne({ email });
    const sessionId = uuidv4();
    const deviceId = req.headers["user-agent"];

    // Update user's session
    await User.updateOne(
      { email },
      {
        $set: {
          currentSessionId: sessionId,
          activeSessions: [{ sessionId, deviceId }],
        },
      }
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email,
        role: user.role,
        sessionId,
        deviceId,
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Авторизация успешна",
      token,
      role: user.role,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const logout = async (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    await User.updateOne(
      { email: decoded.email },
      { $pull: { activeSessions: decoded.sessionId } } // Удаляем текущую сессию
    );

    res.status(200).json({ message: "Вы успешно вышли из системы." });
  } catch (error) {
    res.status(403).json({ error: "Invalid token. Could not logout." });
  }
};

// Регистрация пользователя
export const registerUser = async (req, res) => {
  const { email, password } = req.body;

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({
      error: "Password must be at least 6 characters long",
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password and create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      role: "user", // Default role
      devices: [],
      activeSessions: [],
    });

    await user.save();

    // Generate token for immediate login after registration
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    // Return success response with token
    res.status(201).json({
      message: "User registered successfully",
      token,
      role: user.role,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
