import express from "express";
import {
  login,
  verifyOtp,
  registerUser,
  logout,
} from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login); // Отправка OTP
router.post("/verify-otp", verifyOtp); // Проверка OTP
router.post("/register", registerUser); // Регистрация пользователя
router.post("/logout", logout);

// 🔥 Новый маршрут для проверки сессии
router.get("/verify-session", authenticateToken, (req, res) => {
  res.status(200).json({ message: "Session is active" });
});

export default router;
