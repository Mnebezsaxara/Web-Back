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

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;