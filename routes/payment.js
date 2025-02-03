import express from "express";
import {
  processFieldPayment,
  processGymMembership,
  getPaymentHistory,
} from "../controllers/paymentController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/field", authenticateToken, processFieldPayment);
router.post("/gym-membership", authenticateToken, processGymMembership);
router.get("/history", authenticateToken, getPaymentHistory);

export default router;
