import jwt from "jsonwebtoken";
import User from "../models/user.js";
import dotenv from "dotenv";
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || "defaultsecretkey";

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("Authorization Header:", authHeader);
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("❌ Токен отсутствует");
    return res
      .status(401)
      .json({ error: "Access denied. Please log in first." });
  }

  try {
    console.log(`🟢 SECRET_KEY для проверки: ${SECRET_KEY}`);
    const decoded = jwt.verify(token, SECRET_KEY);

    console.log(`🟢 Декодированный токен:`, decoded);

    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      console.error("❌ Пользователь не найден");
      return res
        .status(403)
        .json({ error: "Session expired. Please log in again." });
    }

    console.log(`🔹 activeSessions в базе:`, user.activeSessions);

    const session = user.activeSessions.find(
      (s) => s.sessionId === decoded.sessionId
    );

    if (!session) {
      console.error(
        `❌ sessionId ${decoded.sessionId} не найден в activeSessions`
      );
      return res
        .status(403)
        .json({ error: "Session expired. Please log in again." });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("❌ Ошибка верификации токена:", error.message);
    res
      .status(403)
      .json({ error: "Invalid or expired token. Please log in again." });
  }
};

export const isAdmin = async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
  }
};
