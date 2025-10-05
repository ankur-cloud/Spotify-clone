const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/userController");
const { protect } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

const userRouter = express.Router();

// public route
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
// private route
userRouter.get("/profile", protect, getUserProfile);
userRouter.put(
  "/profile",
  protect,
  upload.single("profilePicture"),
  updateUserProfile
);

module.exports = {
  userRouter,
};
