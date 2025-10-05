// middleware to protect routes- verify the jwt toke and set req.user

const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

const protect = asyncHandler(async (req, res, next) => {
  let token;
  // checl if user is attaching token to header

  if (!req.headers.authorization) {
    res.status(StatusCodes.UNAUTHORIZED);
    throw new Error("Token not provided");
  }
  // chech if token exist in header

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // get token from the header
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT);
      //    set req.user to user found in the token

      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (err) {
      res.status(StatusCodes.UNAUTHORIZED);
      throw new Error("Not autorized, token faulure");
    }
  }
});
// middleware to checj id the user is an admin
const isAdmin = asyncHandler(async (req, res, next) => {
  console.log("req.user", req.user);
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(StatusCodes.FORBIDDEN);
    throw new Error("Not authorized as an admin");
  }
});

module.exports = { protect, isAdmin };
