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

// Dono image fields accept karne ke liye
const cpUpload = upload.fields([
  { name: 'userImage', maxCount: 1 },
  { name: 'cardImage', maxCount: 1 }
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

    const item = await Item.create({
      name: String(name).trim(),
      idNo: String(idNo).trim(),
      phone: String(phone).trim(),
      password: String(password).trim(),
      userImageUrl,
      userImagePublicId,
      cardImageUrl,
      cardImagePublicId,
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

    await item.save();

    // Delete old images from Cloudinary ONLY AFTER DB is updated successfully
    if (oldUserPublicId) await deleteFromCloudinary(oldUserPublicId);
    if (oldCardPublicId) await deleteFromCloudinary(oldCardPublicId);

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

    // Dono images Cloudinary se delete karein
    if (item.userImagePublicId) await deleteFromCloudinary(item.userImagePublicId);
    if (item.cardImagePublicId) await deleteFromCloudinary(item.cardImagePublicId);

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