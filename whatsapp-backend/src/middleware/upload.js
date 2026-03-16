const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');

const BACKEND_ROOT = path.join(__dirname, '../../');
const UPLOAD_ROOT = path.join(BACKEND_ROOT, 'uploads');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    path.join(UPLOAD_ROOT, 'images'),
    path.join(UPLOAD_ROOT, 'videos'),
    path.join(UPLOAD_ROOT, 'audios'),
    path.join(UPLOAD_ROOT, 'documents'),
    path.join(UPLOAD_ROOT, 'thumbnails')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(UPLOAD_ROOT);
    
    // Categorize files
    if (file.mimetype.startsWith('image/')) {
      uploadPath = path.join(uploadPath, 'images');
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath = path.join(uploadPath, 'videos');
    } else if (file.mimetype.startsWith('audio/')) {
      uploadPath = path.join(uploadPath, 'audios');
    } else {
      uploadPath = path.join(uploadPath, 'documents');
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES.split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('File type not allowed. Please upload a valid file type.', 400), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 16777216 // 16MB default
  }
});

// Error handling wrapper
const uploadMiddleware = (fieldName, maxCount = 1) => {
  return (req, res, next) => {
    const uploadHandler = upload.array(fieldName, maxCount);
    
    uploadHandler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError(`File too large. Max size: ${process.env.MAX_FILE_SIZE / 1048576}MB`, 400));
        }
        return next(new AppError(err.message, 400));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
};

module.exports = uploadMiddleware;