import mongoose from "mongoose";

const bookingSchema = mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String, required: true },
  field: { type: String, required: true },
  email: { type: String, required: true }, // Связь через email пользователя
  price: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
});

// Add compound indexes
bookingSchema.index({ email: 1, date: 1 }); // For user's bookings on a specific date
bookingSchema.index({ field: 1, date: 1, time: 1 }, { unique: true }); // Prevent double bookings
bookingSchema.index({ paymentStatus: 1, date: 1 }); // For filtering bookings by status

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
