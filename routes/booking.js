import express from 'express';
import { getAllBookings, createBooking, updateBooking, deleteBooking } from '../controllers/bookingController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getAllBookings);
router.post('/', authenticateToken, createBooking);
router.put('/update', authenticateToken, updateBooking); // Чёткий маршрут для обновления
router.delete('/delete', authenticateToken, deleteBooking); // Чёткий маршрут для удаления

export default router;
