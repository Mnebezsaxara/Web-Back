import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  currentSessionId: { type: String },
  activeSessions: [
    {
      sessionId: { type: String },
      deviceId: { type: String }, // Уникальный идентификатор браузера
    },
  ],
  devices: [
    {
      deviceId: { type: String, required: true },
      token: { type: String, required: true },
    },
  ],
});

// Add compound indexes
userSchema.index({ email: 1, role: 1 }); // For user lookup with role checks
userSchema.index({ "activeSessions.sessionId": 1 }); // For session verification

// Удаляем пароль из возвращаемых данных
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model("User", userSchema);

export default User;
