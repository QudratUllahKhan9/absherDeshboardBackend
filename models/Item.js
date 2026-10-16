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

    // Iqama Image (naya)
    iqamaImageUrl: {
      type: String,
      default: '',
    },
    iqamaImagePublicId: {
      type: String,
      default: '',
    },

    // QR Code 1 (naya)
    qrCode1Url: {
      type: String,
      default: '',
    },
    qrCode1PublicId: {
      type: String,
      default: '',
    },

    // Driving License Image (naya)
    drivingLicenseImageUrl: {
      type: String,
      default: '',
    },
    drivingLicenseImagePublicId: {
      type: String,
      default: '',
    },

    // QR Code 2 (naya)
    qrCode2Url: {
      type: String,
      default: '',
    },
    qrCode2PublicId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Item', itemSchema);
