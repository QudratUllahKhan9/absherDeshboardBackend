const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  idNo: { type: String, required: true, trim: true },
  phone: { type: String, default: '', trim: true },
  // Keep only if this field is genuinely required by your workflow.
  // Prefer storing a hash, never a plain-text password.
  password: { type: String, default: '' },

  passportNo: { type: String, default: '' },
  passportType: { type: String, default: '' },
  passportIssueDate: { type: String, default: '' },
  passportExpiryDate: { type: String, default: '' },
  passportPlaceOfIssue: { type: String, default: '' },
  passportStatus: { type: String, default: '' },

  idVersion: { type: String, default: '' },
  iqamaIssueDate: { type: String, default: '' },
  iqamaExpiryDate: { type: String, default: '' },

  travelStatus: { type: String, default: '' },
  lastTravelDestination: { type: String, default: '' },
  lastTravelDate: { type: String, default: '' },
  balance: { type: String, default: '' },

  userImageUrl: { type: String, default: '' },
  userImagePublicId: { type: String, default: '' },
  cardImageUrl: { type: String, default: '' },
  cardImagePublicId: { type: String, default: '' },
  iqamaImageUrl: { type: String, default: '' },
  iqamaImagePublicId: { type: String, default: '' },
  qrCode1Url: { type: String, default: '' },
  qrCode1PublicId: { type: String, default: '' },
  drivingLicenseImageUrl: { type: String, default: '' },
  drivingLicenseImagePublicId: { type: String, default: '' },
  qrCode2Url: { type: String, default: '' },
  qrCode2PublicId: { type: String, default: '' },
}, { timestamps: true, strict: true });

module.exports = mongoose.models.Item || mongoose.model('Item', itemSchema);
