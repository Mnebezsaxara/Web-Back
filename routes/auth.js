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

// Add this route for testing purposes only
if (process.env.NODE_ENV === "test") {
  router.post("/get-test-otp", async (req, res) => {
    const { email } = req.body;
    // Get the OTP from your storage (database/cache)
    const otp = await getStoredOTP(email); // Implement this function
    res.json({ otp });
  });
}

export default router;
