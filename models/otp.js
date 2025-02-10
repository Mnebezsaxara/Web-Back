import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: 300 }, // 5 minutes expiration
  },
});

// Add compound index
otpSchema.index({ email: 1, createdAt: -1 }); // For finding latest OTP for an email

// Add pre-save hook for debugging
otpSchema.pre("save", function (next) {
  console.log("Saving OTP:", {
    email: this.email,
    otp: this.otp,
    createdAt: this.createdAt,
  });
  next();
});

const Otp = mongoose.model("Otp", otpSchema);

// Verify the model is loaded
console.log("✅ OTP model initialized");

export default Otp;
