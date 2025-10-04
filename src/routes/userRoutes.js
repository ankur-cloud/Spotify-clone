const express = require("express");
const { registerUser } = require("../controllers/userController");

const userRouter = express.Router();

// public route
userRouter.post("/register", registerUser);

module.exports = {
  userRouter,
};
