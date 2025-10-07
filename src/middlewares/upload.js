const multer = require("multer");
const path = require("path");
const fs = require("fs");

// conficutre storage for multer

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// file filter - only allow audio and image files

const fileFilter = (req, file, cb) => {
 
  if (file.mimetype === "audio/mpeg" || file.mimetype === "audio/wav") {
    cb(null, true);
  }

  // accept image files(jpeg, png, jpg)
  else if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png"||
    file.mimetype === "image/webp"

  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file format. Only audio or image files are allowed"
      )
    );
  }
};

// Initialize multer upload

const upload = multer({
  storage,
  limits: { fieldSize: 10 * 1024 * 1024 },
  fileFilter,
});

module.exports = upload;
