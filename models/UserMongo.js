import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^\+[1-9]\d{1,14}$/, 'Please enter a valid phone number']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    default: null
  },
  codeExpiresAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash verification code before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('verificationCode') && this.verificationCode) {
    this.verificationCode = await bcrypt.hash(this.verificationCode, 10);
  }
  next();
});

export default mongoose.model('User', userSchema);