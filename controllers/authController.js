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

    // Генерация нового OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email }); // Очистка старых OTP
    await Otp.create({ email, otp });

    // Отправка OTP
    await sendEmail(
      email,
      "Ваш код подтверждения",
      `Ваш код подтверждения: ${otp}`
    );

    res
      .status(200)
      .json({ message: "OTP отправлен на email. Проверьте почту." });
  } catch (error) {
    console.error("Ошибка при входе:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  try {
    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    await Otp.deleteMany({ email });

    const user = await User.findOne({ email });
    const sessionId = uuidv4();
    const deviceId = req.headers["user-agent"];

    console.log(`✅ Новый sessionId: ${sessionId}, deviceId: ${deviceId}`);

    // Очищаем все старые `sessionId` перед добавлением нового
    const updateResult = await User.updateOne(
      { email },
      {
        $set: {
          currentSessionId: sessionId,
          activeSessions: [{ sessionId, deviceId }],
        },
      }
    );

    console.log(`🔹 Результат обновления:`, updateResult);

    const updatedUser = await User.findOne({ email });
    console.log(`🔹 Обновленные activeSessions:`, updatedUser.activeSessions);

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

    console.log(`🔹 Новый токен: ${token}`);

    res.status(200).json({
      message: "Авторизация успешна",
      token,
      role: user.role,
    });
  } catch (error) {
    console.error("❌ Ошибка при проверке OTP:", error.message);
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
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters long" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      devices: [],
      activeSessions: [],
    });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: error.message });
  }
};
