const asyncHandler = require("express-async-handler");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const { generateToken } = require("../utils/generateToken");
const { uploadToCloudinary } = require("../utils/cloudinaryUpload");
const Song = require("../models/Song");
const Artist = require("../models/Artist");
const Playlist = require("../models/Playlist");

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

// @desc - getUser Profile
// @route get /api/users/login
// @Access- Public

const getUserProfile = asyncHandler(async (req, res) => {
 // find the user
  const user = await User.findById(req.user._id).select("-password")
  .populate("likedSongs", "title artist duration")
  .populate("likedAlbums", "title artist coverImage")
  .populate("followedArtists", "title image")
  .populate("followedPlaylists", "name creator coverImage");

  if (user) {
    res.status(StatusCodes.OK).json(user);
  } else {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("User Not Found");
  }
});

// @desc - updateUserProfile Profile
// @route POST /api/users/updateUserProfile
// @Access- private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const { name, email, password } = req.body;
  if (user) {
    user.name = name || user.name;
    user.email = email || user.email;

    if (password) {
      user.password = password;
    }

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
// @desc - toggle like Song
// @route POST /api/users/follow-artist
// @Access- private

const toggleLikeSong = asyncHandler(async (req, res) => {
  const songId = req.params.id;
  console.log("sonsongIdgId", songId);
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("User Not Found");
  }

  const song = await Song.findById(songId);

  if (!song) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("song Not Found");
  }

  const songIdx = user.likedSongs.indexOf(songId);
  if (songIdx === -1) {
    // add song to liked snog

    user.likedSongs.push(songId);

    // increament songs likes coumt

    /// incratese the song likes count

    song.likes += 1;
  } else {
    user.likedSongs.splice(songIdx, 1);
    if (song.likes > 0) {
      song.likes -= 1;
    }
  }

  await Promise.all([user.save(), song.save()]);

  res.status(StatusCodes.OK).json({
    likedSongs: user.likedSongs,
    message:
      songIdx === -1
        ? "Song added to liked songs"
        : "Song removed from like songs",
  });
});

// @desc - toggle follow artist
// @route POST /api/users/follow-artist
// @Access- private

const toggleFollowArtist = asyncHandler(async (req, res) => {
  const artistId = req.params.id;
  // / find the artisr
  const artist = await Artist.findById(artistId);
  if (!artist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("artist Not Found");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("User Not Found");
  }

  // chechk ifd artist is alreadu followed

  const artistIdx = user.followedArtists.indexOf(artistId);

  if (artistIdx === -1) {
    // artist add to followed artist
    user.followedArtists.push(artistId);

    artist.followers += 1;
  } else {
    /// decrment followers likes count
    if (artist.followers > 0) {
      artist.followers += 1;
    }

    user.followedArtists.splice(artistIdx, 1);
  }

  await Promise.all([user.save(), artist.save()]);

  res.status(StatusCodes.OK).json({
    followedArtists: user.followedArtists,
    message: artistIdx === -1 ? "artist followeds" : "artist unfollowed",
  });
});

// @desc - //toggle follow playlist
// @route POST /api/users/follow-playlise/:id
// @Access- private

const toggleFollowPlaylist = asyncHandler(async (req, res) => {
  const playlsitId = req.params.id;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("User Not Found");
  }

  // / find the artisr
  const playist = await Playlist.findById(playlsitId);
  if (!playist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("playist Not Found");
  }

  // chechk ifd playliost is alreadu followed

  const playlistIdx = user.followedPlaylists.indexOf(playlsitId);

  if (playlistIdx === -1) {
    // add playlist to followed playlist
    user.followedPlaylists.push(playlsitId);

    playist.followers += 1;
  } else {
    /// decrment followers likes count
    if (playist.followers > 0) {
      playist.followers += 1;
    }

    user.followedPlaylists.splice(playlistIdx, 1);
  }

  await Promise.all([user.save(), playist.save()]);

  res.status(StatusCodes.OK).json({
    followedPlaylists: user.followedPlaylists,
    message: playlistIdx === -1 ? "playist followeds" : "playist unfollowed",
  });
});
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
