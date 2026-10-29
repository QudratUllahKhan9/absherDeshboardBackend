const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const Item = require('../models/Item');

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGE_MAP = {
  userImage: ['userImageUrl', 'userImagePublicId'],
  cardImage: ['cardImageUrl', 'cardImagePublicId'],
  iqamaImage: ['iqamaImageUrl', 'iqamaImagePublicId'],
  qrCode1: ['qrCode1Url', 'qrCode1PublicId'],
  drivingLicenseImage: ['drivingLicenseImageUrl', 'drivingLicensePublicId'],
  qrCode2: ['qrCode2Url', 'qrCode2PublicId'],
};
const TEXT_FIELDS = [
  'name', 'idNo', 'phone', 'password',
  'passportNo', 'passportType', 'passportIssueDate', 'passportExpiryDate',
  'passportPlaceOfIssue', 'passportStatus', 'idVersion', 'iqamaIssueDate',
  'iqamaExpiryDate', 'travelStatus', 'lastTravelDestination', 'lastTravelDate', 'balance',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, WEBP or GIF images are allowed'));
  },
});
const cpUpload = upload.fields(Object.keys(IMAGE_MAP).map(name => ({ name, maxCount: 1 })));

function uploadBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'absher/items', resource_type: 'image' },
      (error, result) => error ? reject(error) : resolve(result)
    );
    stream.end(buffer);
  });
}
async function deleteCloudinary(publicId) {
  if (!publicId) return;
  try { await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }); }
  catch (e) { console.error('[Cloudinary delete]', e.message); }
}
function publicItem(item) {
  const out = item.toObject ? item.toObject() : item;
  delete out.password; // never send passwords back to browser
  delete out.__v;
  return out;
}
function validId(id) { return mongoose.Types.ObjectId.isValid(id); }

router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, items: items.map(publicItem) });
  } catch (e) {
    console.error('[GET ITEMS]', e);
    res.status(500).json({ success: false, message: 'Could not load records' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid record ID' });
    const item = await Item.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, item: publicItem(item) });
  } catch (e) {
    console.error('[GET ITEM]', e);
    res.status(500).json({ success: false, message: 'Could not load record' });
  }
});

router.post('/', cpUpload, async (req, res) => {
  const uploadedPublicIds = [];
  try {
    if (!String(req.body.name || '').trim() || !String(req.body.idNo || '').trim()) {
      return res.status(400).json({ success: false, message: 'Name and Iqama number are required' });
    }
    const data = {};
    for (const key of TEXT_FIELDS) {
      if (req.body[key] !== undefined) data[key] = String(req.body[key]).trim();
    }
    for (const [fileKey, [urlKey, publicKey]] of Object.entries(IMAGE_MAP)) {
      const file = req.files?.[fileKey]?.[0];
      if (file) {
        const result = await uploadBuffer(file.buffer);
        uploadedPublicIds.push(result.public_id);
        data[urlKey] = result.secure_url;
        data[publicKey] = result.public_id;
      }
    }
    const item = await Item.create(data);
    res.status(201).json({ success: true, item: publicItem(item), message: 'Record saved' });
  } catch (e) {
    await Promise.all(uploadedPublicIds.map(deleteCloudinary));
    console.error('[CREATE ITEM]', e);
    res.status(500).json({ success: false, message: e.message || 'Could not save record' });
  }
});

router.put('/:id', cpUpload, async (req, res) => {
  const newlyUploaded = [];
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid record ID' });
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Record not found' });

    for (const key of TEXT_FIELDS) {
      if (req.body[key] !== undefined) item[key] = String(req.body[key]).trim();
    }
    const oldPublicIds = [];
    for (const [fileKey, [urlKey, publicKey]] of Object.entries(IMAGE_MAP)) {
      const file = req.files?.[fileKey]?.[0];
      if (file) {
        const result = await uploadBuffer(file.buffer);
        newlyUploaded.push(result.public_id);
        if (item[publicKey]) oldPublicIds.push(item[publicKey]);
        item[urlKey] = result.secure_url;
        item[publicKey] = result.public_id;
      }
      // To remove an existing image, send remove_<fileKey>=true.
      if (req.body[`remove_${fileKey}`] === 'true') {
        if (item[publicKey]) oldPublicIds.push(item[publicKey]);
        item[urlKey] = '';
        item[publicKey] = '';
      }
    }
    await item.save();
    await Promise.all(oldPublicIds.map(deleteCloudinary));
    res.json({ success: true, item: publicItem(item), message: 'Record updated' });
  } catch (e) {
    await Promise.all(newlyUploaded.map(deleteCloudinary));
    console.error('[UPDATE ITEM]', e);
    res.status(500).json({ success: false, message: e.message || 'Could not update record' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid record ID' });
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Record not found' });
    const ids = Object.values(IMAGE_MAP).map(([, publicKey]) => item[publicKey]).filter(Boolean);
    await Promise.all(ids.map(deleteCloudinary));
    res.json({ success: true, message: 'Record deleted' });
  } catch (e) {
    console.error('[DELETE ITEM]', e);
    res.status(500).json({ success: false, message: 'Could not delete record' });
  }
});

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'Each image must be 5 MB or smaller' : error.message;
    return res.status(400).json({ success: false, message });
  }
  if (error) return res.status(400).json({ success: false, message: error.message || 'Upload failed' });
  next();
});

module.exports = router;
