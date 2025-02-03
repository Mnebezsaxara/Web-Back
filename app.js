import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bookingRoutes from "./routes/booking.js";
import authRoutes from "./routes/auth.js";
import connectDB from "./db.js";
import paymentRoutes from "./routes/payment.js";
import { authenticateToken, isAdmin } from "./middleware/authMiddleware.js";
import adminRoutes from "./routes/admin.js";

// Подключение базы данных
connectDB();

const app = express();
const PORT = process.env.PORT || 8080;

// Определение текущей директории
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware для обработки JSON и CORS
app.use(express.json());
app.use(cors()); // Разрешает запросы со всех доменов

// Указываем папку public для статических файлов
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// Маршруты для бронирования
app.use("/booking", bookingRoutes);

// Маршруты для авторизации
app.use("/auth", authRoutes);

// Payment routes
app.use("/payment", paymentRoutes);

// Add admin routes
app.use("/admin", adminRoutes);

// Move the admin-panel route after the static file middleware but before the generic :page route
app.get("/admin-panel", (req, res, next) => {
  res.sendFile(path.join(publicDir, "admin-panel.html"), (err) => {
    if (err) {
      next(err);
    }
  });
});

// Главная страница
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "home.html"));
});

// Маршруты для HTML-страниц без .html
app.get("/:page", (req, res, next) => {
  const { page } = req.params;
  const filePath = path.join(publicDir, `${page}.html`);
  res.sendFile(filePath, (err) => {
    if (err) {
      next(); // Передаем обработку дальше, если файл не найден
    }
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
