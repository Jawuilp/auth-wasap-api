import UserMongo from '../models/UserMongo.js';
import { getDatabaseInstance, getSupabaseInstance } from '../dbFactory.js';

async function findUserById(userId) {
  const dbType = process.env.DB_TYPE || 'mongodb';
  const db = getDatabaseInstance();

  if (dbType === 'mongodb') {
    return await UserMongo.findById(userId);
  } else if (dbType === 'postgres') {
    return await db.models.User.findByPk(userId);
  } else if (dbType === 'supabase') {
    const supabase = getSupabaseInstance();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to find user: ${error.message}`);
    }
    return data;
  }
}

async function findUserByWhatsappNumber(whatsappNumber) {
  const dbType = process.env.DB_TYPE || 'mongodb';
  const db = getDatabaseInstance();

  if (dbType === 'mongodb') {
    return await UserMongo.findOne({ whatsappNumber });
  } else if (dbType === 'postgres') {
    return await db.models.User.findOne({ where: { whatsapp_number: whatsappNumber } });
  } else if (dbType === 'supabase') {
    const supabase = getSupabaseInstance();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('whatsapp_number', whatsappNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No row found
        return null;
      }
      throw new Error(`Failed to find user: ${error.message}`);
    }
    return data;
  }
}

async function createOrUpdateUser({ id, name, webEmail, whatsappNumber, conversationHistory, verificationCode, codeExpiresAt, isVerified }) {
  const dbType = process.env.DB_TYPE || 'mongodb';
  const db = getDatabaseInstance();

  if (dbType === 'mongodb') {
    let user = await UserMongo.findById(id) || new UserMongo({ _id: id });
    user.name = name;
    user.webEmail = webEmail;
    user.whatsappNumber = whatsappNumber;
    user.conversationHistory = conversationHistory;
    user.verificationCode = verificationCode;
    user.codeExpiresAt = codeExpiresAt;
    user.isVerified = isVerified !== undefined ? isVerified : user.isVerified;
    return await user.save();
  } else if (dbType === 'postgres') {
    return await db.models.User.upsert({
      id,
      name,
      webEmail,
      whatsappNumber,
      conversationHistory,
      verificationCode,
      codeExpiresAt,
      isVerified: isVerified !== undefined ? isVerified : false
    });
  } else if (dbType === 'supabase') {
    const supabase = getSupabaseInstance();
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: id || undefined,
        name,
        web_email: webEmail,
        whatsapp_number: whatsappNumber,
        conversation_history: conversationHistory,
        verification_code: verificationCode,
        code_expires_at: codeExpiresAt,
        is_verified: isVerified !== undefined ? isVerified : false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create/update user: ${error.message}`);
    }
    return data;
  }
}

export { findUserById, findUserByWhatsappNumber, createOrUpdateUser };