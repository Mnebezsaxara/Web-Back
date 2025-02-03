import Payment from "../models/payment.js";
import Booking from "../models/booking.js";
import User from "../models/user.js";

// Gym membership prices
const MEMBERSHIP_PRICES = {
  "1month12visits_day": 15000,
  "1month12visits": 18000,
  "1month_unlimited": 25000,
  "6months_unlimited_vip": 80000,
  "1year_unlimited": 200000,
  "1year_unlimited_women": 180000,
  single_visit: 2000,
  single_visit_trainer: 4000,
};

// Field prices per hour
const FIELD_PRICES = {
  "Поле Бекет Батыра": 15000,
  "Поле Орынбаева": 15000,
};

export const processFieldPayment = async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Simulate payment processing
    const payment = await Payment.create({
      userId: req.user.userId,
      email: req.user.email,
      type: "field_reservation",
      amount: FIELD_PRICES[booking.field],
      bookingId: booking._id,
      status: "completed",
    });

    // Update booking payment status
    booking.paymentStatus = "completed";
    await booking.save();

    res.status(200).json({
      message: "Payment processed successfully",
      payment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const processGymMembership = async (req, res) => {
  const { membershipType } = req.body;

  if (!MEMBERSHIP_PRICES[membershipType]) {
    return res.status(400).json({ error: "Invalid membership type" });
  }

  try {
    // Calculate membership dates
    const startDate = new Date();
    const endDate = new Date(startDate);

    let visitsLeft = null;
    if (membershipType.includes("12visits")) {
      visitsLeft = 12;
    } else if (membershipType.includes("6months")) {
      endDate.setMonth(endDate.getMonth() + 6);
    } else if (membershipType.includes("1year")) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (membershipType.includes("1month")) {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Simulate payment processing
    const payment = await Payment.create({
      userId: req.user.userId,
      email: req.user.email,
      type: "gym_membership",
      amount: MEMBERSHIP_PRICES[membershipType],
      status: "completed",
      membershipDetails: {
        type: membershipType,
        startDate,
        endDate,
        visitsLeft,
      },
    });

    res.status(200).json({
      message: "Gym membership purchased successfully",
      payment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ email: req.user.email }).sort({
      paymentDate: -1,
    });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};