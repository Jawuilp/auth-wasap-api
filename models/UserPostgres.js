import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

export default function defineUser(sequelize) {
  const User = sequelize.define('User', {
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^\+[1-9]\d{1,14}$/,
      }
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verificationCode: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    codeExpiresAt: {
      type: DataTypes.DATE,
      defaultValue: null
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('verificationCode') && user.verificationCode) {
          user.verificationCode = await bcrypt.hash(user.verificationCode, 10);
        }
      }
    },
    tableName: 'Users'
  });

  return User;
}