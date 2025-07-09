import UserMongo from '../models/UserMongo.js';
import { getDatabaseInstance } from '../dbFactory.js';

async function findUserByPhoneNumber(phoneNumber) {
  const dbType = process.env.DB_TYPE || 'mongodb';
  const db = getDatabaseInstance();

  if (dbType === 'mongodb') {
    return await UserMongo.findOne({ phoneNumber });
  } else {
    return await db.models.User.findOne({ where: { phoneNumber } });
  }
}

async function createOrUpdateUser({ phoneNumber, verificationCode, codeExpiresAt, isVerified }) {
  const dbType = process.env.DB_TYPE || 'mongodb';
  const db = getDatabaseInstance();

  if (dbType === 'mongodb') {
    let user = await UserMongo.findOne({ phoneNumber });
    if (!user) {
      user = new UserMongo({ phoneNumber });
    }
    user.verificationCode = verificationCode;
    user.codeExpiresAt = codeExpiresAt;
    user.isVerified = isVerified !== undefined ? isVerified : user.isVerified;
    return await user.save();
  } else {
    return await db.models.User.upsert({
      phoneNumber,
      verificationCode,
      codeExpiresAt,
      isVerified: isVerified !== undefined ? isVerified : false
    });
  }
}

async function findUserById(userId) {
  const dbType = process.env.DB_TYPE || 'mongodb';
  const db = getDatabaseInstance();

  if (dbType === 'mongodb') {
    return await UserMongo.findById(userId);
  } else {
    return await db.models.User.findByPk(userId);
  }
}

export { findUserByPhoneNumber, createOrUpdateUser, findUserById };