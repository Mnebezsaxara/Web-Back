import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date(), expires: 300 }
});

const Otp = mongoose.model('Otp', otpSchema);

console.log("Otp модель загружена");

export default Otp;