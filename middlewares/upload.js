// middlewares/upload.js
const multer = require('multer');

const storage = multer.memoryStorage(); // keep file in memory to upload directly to S3

// file filter: only images (adjust if you want video/pdf etc)
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Only image files are allowed!'), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit (adjust)
  fileFilter,
});

module.exports = upload;


//testing  when to upload huge school list 

// const multer = require("multer");

// const storage = multer.memoryStorage();

// const upload = multer({
//   storage,
//   fileFilter: (req, file, cb) => {
//     if (
//       file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
//       file.mimetype === "application/vnd.ms-excel"
//     ) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only Excel files are allowed"), false);
//     }
//   },
// });

// module.exports = upload;
