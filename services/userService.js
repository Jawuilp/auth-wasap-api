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

async function createOrUpdateUser({ id, name, webEmail, whatsappNumber, conversationHistory }) {
  const dbType = process.env.DB_TYPE || 'mongodb';
  const db = getDatabaseInstance();

  if (dbType === 'mongodb') {
    let user = await UserMongo.findById(id) || new UserMongo({ _id: id });
    user.name = name;
    user.webEmail = webEmail;
    user.whatsappNumber = whatsappNumber;
    user.conversationHistory = conversationHistory;
    return await user.save();
  } else if (dbType === 'postgres') {
    return await db.models.User.upsert({
      id,
      name,
      webEmail,
      whatsappNumber,
      conversationHistory
    });
  } else if (dbType === 'supabase') {
    const supabase = getSupabaseInstance();
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id,
        name,
        web_email: webEmail,
        whatsapp_number: whatsappNumber,
        conversation_history: conversationHistory
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create/update user: ${error.message}`);
    }
    return data;
  }
}

export { findUserById, createOrUpdateUser };