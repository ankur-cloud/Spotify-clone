const asyncHandler = require("express-async-handler");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const { generateToken } = require("../utils/generateToken");
const { uploadToCloudinary } = require("../utils/cloudinaryUpload");

// register a new user
// route post /api/users/register

const registerUser = asyncHandler(async (req, res) => {
  //get the payload

  const { name, email, password } = req.body;

  // Check if the user already exist
  console.log("name", name);
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("User already exists");
  }

  // crate user

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    res.status(StatusCodes.CREATED).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      profilePicture: user.profilePicture,
    });
  } else {
    res.status(StatusCodes.BAD_REQUEST);
  }
});

// @desc - Login user
// @route POST /api/users/login
// @Access- Public

const loginUser = asyncHandler(async (req, res) => {
  //get the payload

  const { email, password } = req.body;
  // Check user
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.status(StatusCodes.OK).json({
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
      profilePicture: user.profilePicture,
      token: generateToken(user._id),
    });
  } else {
    res.status(StatusCodes.UNAUTHORIZED);
    throw new Error("Invalid username or password");
  }
});

// getUser Profile
const getUserProfile = asyncHandler(async (req, res) => {
  console.log("getUserProfile");
  const user = await User.findById(req.user._id).select("-password");
  // .populate("likedSongs", "title artist duration")
  // .populate("likedAlbums", "title artist coverImage")
  // .populate("followedArtists", "title image")
  // .populate("followedPlaylists", "name creator coverImage");

  if (user) {
    res.status(StatusCodes.OK).json(user);
  } else {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("User Not Found");
  }
});

// updateUserProfile
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const { name, email, password } = req.body;
  if (user) {
    user.name = name || user.name;
    user.email = email || user.email;

    if (password) {
      user.password = password;
    }
    console.log("req.file", req.file);
    console.log("useruseruseruseruser", user);
    // upload profile picture if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.path, "spotify/users");
      console.log("result", result);
      user.profilePicture = result.secure_url;
    }

    const updatedUser = await user.save();
    res.status(StatusCodes.OK).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      profilePicture: updatedUser.profilePicture,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("User Not Found");
  }

  // check if user is passowrd is being uodated
});

//toggle like Song
const toggleLikeSong = asyncHandler(async (req, res) => {});

//toggle follow artist
const toggleFollowArtist = asyncHandler(async (req, res) => {});

//toggle follow playlist
const toggleFollowPlaylist = asyncHandler(async (req, res) => {});

// getUsers
const getUsers = asyncHandler(async (req, res) => {});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  toggleLikeSong,
  toggleFollowArtist,
  toggleFollowPlaylist,
  getUsers,
};
