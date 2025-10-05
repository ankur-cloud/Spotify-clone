const cloudinary = require("../config/cloudnary");
const fs = require("fs");

const uploadToCloudinary = async (filePath, folder) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });

    // delete the local file after sccesful upload

    fs.unlinkSync(filePath);
    return result;
  } catch (err) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error("failed to upload to cloudinary", err.message);
  }
};

module.exports = { uploadToCloudinary };
