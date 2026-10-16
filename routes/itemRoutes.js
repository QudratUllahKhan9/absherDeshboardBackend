const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Item = require('../models/Item');

const router = express.Router();

// ==========================================
// CLOUDINARY CONFIG
// ==========================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==========================================
// MULTER (Memory Storage)
// ==========================================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sirf image files allowed hain'));
    }
  },
});

// Sab image fields accept karne ke liye (6 total)
const cpUpload = upload.fields([
  { name: 'userImage', maxCount: 1 },
  { name: 'cardImage', maxCount: 1 },
  { name: 'iqamaImage', maxCount: 1 },
  { name: 'qrCode1', maxCount: 1 },
  { name: 'drivingLicenseImage', maxCount: 1 },
  { name: 'qrCode2', maxCount: 1 }
]);

// ==========================================
// UPLOAD BUFFER TO CLOUDINARY
// ==========================================
function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'items',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    stream.end(buffer);
  });
}

// ==========================================
// DELETE IMAGE FROM CLOUDINARY
// ==========================================
async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });
  } catch (error) {
    console.error('[Cloudinary Delete Error]', error.message);
  }
}

// ==========================================
// CREATE (POST /api/items)
// ==========================================
router.post('/', cpUpload, async (req, res) => {
  try {
    const { name, idNo, phone, password } = req.body;

    if (!name || !String(name).trim()) return res.status(400).json({ success: false, message: 'Name zaroori hai' });
    if (!idNo || !String(idNo).trim()) return res.status(400).json({ success: false, message: 'ID No zaroori hai' });
    if (!phone || !String(phone).trim()) return res.status(400).json({ success: false, message: 'Phone Number zaroori hai' });
    if (!password || !String(password).trim()) return res.status(400).json({ success: false, message: 'Password zaroori hai' });

    let userImageUrl = '';
    let userImagePublicId = '';
    let cardImageUrl = '';
    let cardImagePublicId = '';
    let iqamaImageUrl = '';
    let iqamaImagePublicId = '';
    let qrCode1Url = '';
    let qrCode1PublicId = '';
    let drivingLicenseImageUrl = '';
    let drivingLicenseImagePublicId = '';
    let qrCode2Url = '';
    let qrCode2PublicId = '';

    // Check & Upload User Image
    if (req.files && req.files.userImage && req.files.userImage[0]) {
      const result = await uploadToCloudinary(req.files.userImage[0].buffer);
      userImageUrl = result.secure_url;
      userImagePublicId = result.public_id;
    }

    // Check & Upload Card Image
    if (req.files && req.files.cardImage && req.files.cardImage[0]) {
      const result = await uploadToCloudinary(req.files.cardImage[0].buffer);
      cardImageUrl = result.secure_url;
      cardImagePublicId = result.public_id;
    }

    // Check & Upload Iqama Image
    if (req.files && req.files.iqamaImage && req.files.iqamaImage[0]) {
      const result = await uploadToCloudinary(req.files.iqamaImage[0].buffer);
      iqamaImageUrl = result.secure_url;
      iqamaImagePublicId = result.public_id;
    }

    // Check & Upload QR Code 1
    if (req.files && req.files.qrCode1 && req.files.qrCode1[0]) {
      const result = await uploadToCloudinary(req.files.qrCode1[0].buffer);
      qrCode1Url = result.secure_url;
      qrCode1PublicId = result.public_id;
    }

    // Check & Upload Driving License Image
    if (req.files && req.files.drivingLicenseImage && req.files.drivingLicenseImage[0]) {
      const result = await uploadToCloudinary(req.files.drivingLicenseImage[0].buffer);
      drivingLicenseImageUrl = result.secure_url;
      drivingLicenseImagePublicId = result.public_id;
    }

    // Check & Upload QR Code 2
    if (req.files && req.files.qrCode2 && req.files.qrCode2[0]) {
      const result = await uploadToCloudinary(req.files.qrCode2[0].buffer);
      qrCode2Url = result.secure_url;
      qrCode2PublicId = result.public_id;
    }

    const item = await Item.create({
      name: String(name).trim(),
      idNo: String(idNo).trim(),
      phone: String(phone).trim(),
      password: String(password).trim(),
      userImageUrl,
      userImagePublicId,
      cardImageUrl,
      cardImagePublicId,
      iqamaImageUrl,
      iqamaImagePublicId,
      qrCode1Url,
      qrCode1PublicId,
      drivingLicenseImageUrl,
      drivingLicenseImagePublicId,
      qrCode2Url,
      qrCode2PublicId,
    });

    res.status(201).json({
      success: true,
      item: {
        _id: item._id,
        name: item.name,
        idNo: item.idNo,
        phone: item.phone,
        password: item.password,
        userImageUrl: item.userImageUrl,
        cardImageUrl: item.cardImageUrl,
        iqamaImageUrl: item.iqamaImageUrl,
        qrCode1Url: item.qrCode1Url,
        drivingLicenseImageUrl: item.drivingLicenseImageUrl,
        qrCode2Url: item.qrCode2Url,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
      message: 'Record aur images save ho gaye',
    });

  } catch (error) {
    console.error('[CREATE ERROR]', error);
    res.status(500).json({ success: false, message: error.message || 'Record save nahi hua' });
  }
});

// ==========================================
// GET ALL (GET /api/items)
// ==========================================
router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 }).lean();

    const result = items.map((item) => ({
      _id: item._id,
      name: item.name,
      idNo: item.idNo,
      phone: item.phone,
      password: item.password, 
      userImageUrl: item.userImageUrl || '',
      cardImageUrl: item.cardImageUrl || '',
      iqamaImageUrl: item.iqamaImageUrl || '',
      qrCode1Url: item.qrCode1Url || '',
      drivingLicenseImageUrl: item.drivingLicenseImageUrl || '',
      qrCode2Url: item.qrCode2Url || '',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    res.json({ success: true, items: result });
  } catch (error) {
    console.error('[GET ALL ERROR]', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// GET ONE (GET /api/items/:id)
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).lean();

    if (!item) return res.status(404).json({ success: false, message: 'Record nahi mila' });

    res.json({
      success: true,
      item: {
        _id: item._id,
        name: item.name,
        idNo: item.idNo,
        phone: item.phone,
        password: item.password,
        userImageUrl: item.userImageUrl || '',
        cardImageUrl: item.cardImageUrl || '',
        iqamaImageUrl: item.iqamaImageUrl || '',
        qrCode1Url: item.qrCode1Url || '',
        drivingLicenseImageUrl: item.drivingLicenseImageUrl || '',
        qrCode2Url: item.qrCode2Url || '',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    });
  } catch (error) {
    console.error('[GET ONE ERROR]', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// UPDATE (PUT /api/items/:id)
// ==========================================
router.put('/:id', cpUpload, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) return res.status(404).json({ success: false, message: 'Record nahi mila' });

    const { name, idNo, phone, password } = req.body;

    if (name !== undefined) item.name = String(name).trim();
    if (idNo !== undefined) item.idNo = String(idNo).trim();
    if (phone !== undefined) item.phone = String(phone).trim();
    if (password !== undefined) item.password = String(password).trim();

    let oldUserPublicId = '';
    let oldCardPublicId = '';
    let oldIqamaPublicId = '';
    let oldQrCode1PublicId = '';
    let oldDrivingLicensePublicId = '';
    let oldQrCode2PublicId = '';

    // Upload New User Image (if provided)
    if (req.files && req.files.userImage && req.files.userImage[0]) {
      oldUserPublicId = item.userImagePublicId; 
      const result = await uploadToCloudinary(req.files.userImage[0].buffer);
      item.userImageUrl = result.secure_url;
      item.userImagePublicId = result.public_id;
    }

    // Upload New Card Image (if provided)
    if (req.files && req.files.cardImage && req.files.cardImage[0]) {
      oldCardPublicId = item.cardImagePublicId; 
      const result = await uploadToCloudinary(req.files.cardImage[0].buffer);
      item.cardImageUrl = result.secure_url;
      item.cardImagePublicId = result.public_id;
    }

    // Upload New Iqama Image (if provided)
    if (req.files && req.files.iqamaImage && req.files.iqamaImage[0]) {
      oldIqamaPublicId = item.iqamaImagePublicId; 
      const result = await uploadToCloudinary(req.files.iqamaImage[0].buffer);
      item.iqamaImageUrl = result.secure_url;
      item.iqamaImagePublicId = result.public_id;
    }

    // Upload New QR Code 1 (if provided)
    if (req.files && req.files.qrCode1 && req.files.qrCode1[0]) {
      oldQrCode1PublicId = item.qrCode1PublicId; 
      const result = await uploadToCloudinary(req.files.qrCode1[0].buffer);
      item.qrCode1Url = result.secure_url;
      item.qrCode1PublicId = result.public_id;
    }

    // Upload New Driving License Image (if provided)
    if (req.files && req.files.drivingLicenseImage && req.files.drivingLicenseImage[0]) {
      oldDrivingLicensePublicId = item.drivingLicenseImagePublicId; 
      const result = await uploadToCloudinary(req.files.drivingLicenseImage[0].buffer);
      item.drivingLicenseImageUrl = result.secure_url;
      item.drivingLicenseImagePublicId = result.public_id;
    }

    // Upload New QR Code 2 (if provided)
    if (req.files && req.files.qrCode2 && req.files.qrCode2[0]) {
      oldQrCode2PublicId = item.qrCode2PublicId; 
      const result = await uploadToCloudinary(req.files.qrCode2[0].buffer);
      item.qrCode2Url = result.secure_url;
      item.qrCode2PublicId = result.public_id;
    }

    await item.save();

    // Delete old images from Cloudinary ONLY AFTER DB is updated successfully
    if (oldUserPublicId) await deleteFromCloudinary(oldUserPublicId);
    if (oldCardPublicId) await deleteFromCloudinary(oldCardPublicId);
    if (oldIqamaPublicId) await deleteFromCloudinary(oldIqamaPublicId);
    if (oldQrCode1PublicId) await deleteFromCloudinary(oldQrCode1PublicId);
    if (oldDrivingLicensePublicId) await deleteFromCloudinary(oldDrivingLicensePublicId);
    if (oldQrCode2PublicId) await deleteFromCloudinary(oldQrCode2PublicId);

    res.json({
      success: true,
      item: {
        _id: item._id,
        name: item.name,
        idNo: item.idNo,
        phone: item.phone,
        password: item.password,
        userImageUrl: item.userImageUrl || '',
        cardImageUrl: item.cardImageUrl || '',
        iqamaImageUrl: item.iqamaImageUrl || '',
        qrCode1Url: item.qrCode1Url || '',
        drivingLicenseImageUrl: item.drivingLicenseImageUrl || '',
        qrCode2Url: item.qrCode2Url || '',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
      message: 'Record update ho gaya',
    });
  } catch (error) {
    console.error('[UPDATE ERROR]', error);
    res.status(500).json({ success: false, message: error.message || 'Record update nahi hua' });
  }
});

// ==========================================
// DELETE (DELETE /api/items/:id)
// ==========================================
router.delete('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) return res.status(404).json({ success: false, message: 'Record nahi mila' });

    await Item.findByIdAndDelete(req.params.id);

    // Sab images Cloudinary se delete karein
    if (item.userImagePublicId) await deleteFromCloudinary(item.userImagePublicId);
    if (item.cardImagePublicId) await deleteFromCloudinary(item.cardImagePublicId);
    if (item.iqamaImagePublicId) await deleteFromCloudinary(item.iqamaImagePublicId);
    if (item.qrCode1PublicId) await deleteFromCloudinary(item.qrCode1PublicId);
    if (item.drivingLicenseImagePublicId) await deleteFromCloudinary(item.drivingLicenseImagePublicId);
    if (item.qrCode2PublicId) await deleteFromCloudinary(item.qrCode2PublicId);

    res.json({ success: true, message: 'Record aur uski images delete ho gayi hain' });
  } catch (error) {
    console.error('[DELETE ERROR]', error);
    res.status(500).json({ success: false, message: error.message || 'Record delete nahi hua' });
  }
});

// ==========================================
// MULTER ERROR HANDLER
// ==========================================
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Image maximum 5 MB ki honi chahiye' });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
  if (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  next();
});

module.exports = router;