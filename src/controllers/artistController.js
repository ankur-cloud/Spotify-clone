const asyncHandler = require("express-async-handler");
const { StatusCodes } = require("http-status-codes");
const Artist = require("../models/Artist");
const { uploadToCloudinary } = require("../utils/cloudinaryUpload");
const Song = require("../models/Song");
const Album = require("../models/Album");

// @desc - createArtist
// @route POST /api/artists
// @Access- Public

const createArtist = asyncHandler(async (req, res) => {
  //get the payload
  console.log("reqreq", req);
  if (!req.body) {
    res.status(StatusCodes.BAD_REQUEST);

    throw new Error("Request body is required");
  }

  const { name, bio, genres } = req.body;

  if (!name || !bio || !genres) {
    res.status(StatusCodes.BAD_REQUEST);

    throw new Error(" name, bio, genres is required");
  }
  // Check user
  const existingArtist = await Artist.findOne({ name });

  if (existingArtist) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error(" Artist already exist");
  }
  // upload artist image if provided
  let imageUrl = "";
  if (req.file) {
    const result = await uploadToCloudinary(req.file.path, "spotify/artists");

    imageUrl = result.secure_url;
  }

  // create the artists

  const artist = await Artist.create({
    name,
    bio,
    genres,
    isVerified: true,
    image: imageUrl,
  });

  res.status(StatusCodes.CREATED).json(artist);
});

// @desc - get All artists with filtering and pagination
// @route get /api/artists>genre=Pop&serch=shreya&limit=10
// @Access- Public

const getArtists = asyncHandler(async (req, res) => {
  console.log("req.query", req.query);

  const { genre, search, page = 1, limit = 10 } = req.query;

  // build filter object

  const filter = {};

  if (genre) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { bio: { $regex: search, $options: "i" } },
    ];
  }

  // // count total artists wit  filter

  const count = await Artist.countDocuments(filter);

  // pagination

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const artists = await Artist.find(filter)
    .sort({ followers: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  res.status(StatusCodes.OK).json({
    artists,
    page: parseInt(page),
    pages: Math.ceil(count / parseInt(limit)),
    totalArtists: count,
  });
});

// @desc - get artist by id
// @route get /api/artists/id
// @Access- Public

const getArtistById = asyncHandler(async (req, res) => {
  const artist = await Artist.findById(req.params.id);

  if (artist) {
    res.status(StatusCodes.OK).json({
      artist,
    });
  } else {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error(" Artist not found");
  }
});

// @desc - update artist details
// @route put /api/artists/id
// @Access- Private/admin

const updateArtist = asyncHandler(async (req, res) => {
  const { name, bio, genres, isVerified } = req.body;

  const artist = await Artist.findById(req.params.id);

  if (!artist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error(" Artist not found");
  }

  // update artist details

  artist.name = name || artist.name;
  artist.bio = bio || artist.bio;
  artist.genres = genres || artist.genres;
  artist.isVerified =
    isVerified !== undefined ? isVerified === true : artist.isVerified;

  // update image if provided

  if (req.file) {
    const result = await uploadToCloudinary(req.file.path, "spotify/artists");

    artist.image = result.secure_url;
  }

  //   reSave

  const updatedArtist = await artist.save();

  res.status(StatusCodes.OK).json(updatedArtist);
});

// @desc - delete artist,albuns abd songs details
// @route put /api/artists/id
// @Access- Private/admin

const deleteArtist = asyncHandler(async (req, res) => {
  const artist = await Artist.findById(req.params.id);

  if (!artist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error(" Artist not found");
  }

  //   delete all soings by artist and all songs

  await Song.deleteMany({ artist: artist._id });

  //   delte all albums nyt artist
  await Album.deleteMany({ artist: artist._id });

  await artist.deleteOne();

  res.status(StatusCodes.OK).json({ message: "Artist removed" });
});

// @desc - get toip 10 artists by followers
// @route put /api/artists/top?limit=10
// @Access- Public
const getTopArtists = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  console.log("req.query", req.query);
  const artists = await Artist.find()
    .sort({ followers: -1 })
    .limit(parseInt(limit));
  console.log("artists", artists);
  res.status(StatusCodes.OK).json(artists);
});

// @desc - get toip songs artists by followers
// @route put /api/artists/:id/top-songs?limit=12
// @Access- Public
const getTopSongsArtists = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const songs = await Song.find()
    .sort({ plays: -1 })
    .limit(parseInt(limit))
    .populate("album", "title coverImage");

  
console.log('songs', songs);
  if (songs.length) {
    res.status(StatusCodes.OK).json(songs);
  } else {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error(" No Songs found");
  }
});

module.exports = {
  createArtist,
  getArtists,
  getArtistById,
  updateArtist,
  deleteArtist,
  getTopArtists,
  getTopSongsArtists,
};
