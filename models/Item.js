const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    idNo: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },

    // User Profile Image
    userImageUrl: {
      type: String,
      default: '',
    },
    userImagePublicId: {
      type: String,
      default: '',
    },

    // ID Card Image
    cardImageUrl: {
      type: String,
      default: '',
    },
    cardImagePublicId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Item', itemSchema);