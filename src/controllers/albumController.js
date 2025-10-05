const asyncHandler = require("express-async-handler");
const { StatusCodes } = require("http-status-codes");
const Artist = require("../models/Artist");
const { uploadToCloudinary } = require("../utils/cloudinaryUpload");
const Song = require("../models/Song");
const Album = require("../models/Album");

// @desc - createAlbum
// @route POST /api/albums
// @Access- private/admin

const createAlbum = asyncHandler(async (req, res) => {
  //get the payload
  if (!req.body) {
    res.status(StatusCodes.BAD_REQUEST);

    throw new Error("Request body is required");
  }

  const { title, artist, releasedDate, genre, description, isExplicit } =
    req.body;

  if (!title || !artist || !genre || !description) {
    res.status(StatusCodes.BAD_REQUEST);

    throw new Error(
      " title, artist, releasedDate,releasedDate,genre, description is required"
    );
  }

  if (title.length < 3 && title.length > 100) {
    res.status(StatusCodes.BAD_REQUEST);

    throw new Error(
      "Too low or too high number of characters body is required"
    );
  }

  if (description.length < 10 && description.length > 200) {
    res.status(StatusCodes.BAD_REQUEST);

    throw new Error(
      "Too low or too high number of characters body is required"
    );
  }

  // Check artist already exist
  const artistbyId = await Artist.findById(artist);

  if (!artistbyId) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error(" Artist not found   ");
  }

  // Check album already exist already exist

  const findAlbum = await Album.findOne({ title });

  if (findAlbum) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error(" Album alreadu exist");
  }

  // upload album image if provided
  let coverImageUrl = "";
  if (req.file) {
    const result = await uploadToCloudinary(req.file.path, "spotify/albums");

    coverImageUrl = result.secure_url;
  }

  // create the albums

  const album = await Album.create({
    title,
    artist: artist,
    releasedDate: releasedDate ? new Date(releasedDate) : Date.now(),
    genre,
    image: coverImageUrl,
    description,
    isExplicit: isExplicit === "true",
  });

  artistbyId.albums.push(album._id);

  await artistbyId.save();
  res.status(StatusCodes.CREATED).json(album);
});

// @desc - get All getAlbums with filtering and pagination
// @route get /api/albums?genre=pop&artist=2312312&search=dat"[age=1&limit=10]
// @Access- Public

const getAlbums = asyncHandler(async (req, res) => {
  console.log("req.query", req.query);

  const { genre, artist, search, page = 1, limit = 10 } = req.query;

  // build filter object

  const filter = {};

  if (genre) filter.genre = genre;
  if (artist) filter.artist = artist;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { genre: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // // count total albums wit  filter

  const count = await Album.countDocuments(filter);

  // pagination

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const albums = await Album.find(filter)
    .sort({ releasedDate: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .populate("artist", "name image");

  res.status(StatusCodes.OK).json({
    albums,
    page: parseInt(page),
    pages: Math.ceil(count / parseInt(limit)),
    totalAlbums: count,
  });
});

// @desc - get album by id
// @route get /api/album/id
// @Access- Public

const getAlbumsById = asyncHandler(async (req, res) => {
  const album = await Album.findById(req.params.id).populate(
    "artist",
    "name image bio"
  );

  if (album) {
    res.status(StatusCodes.OK).json(album);
  } else {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error(" Album not found");
  }
});

// @desc - update album details
// @route put /api/albums/id
// @Access- Private/admin

const updateAlbum = asyncHandler(async (req, res) => {
  const { title, releasedDate, genre, description, isExplicit } = req.body;

  const album = await Album.findById(req.params.id);

  if (!album) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error(" Album not found");
  }

  // update album details

  album.title = title || album.title;
  album.releasedDate = releasedDate || album.releasedDate;
  album.genre = genre || album.genre;
  album.description = description || album.description;
  album.isExplicit = isExplicit || album.isExplicit;

  // update image if provided

  if (req.file) {
    const result = await uploadToCloudinary(req.file.path, "spotify/albums");

    album.image = result.secure_url;
  }

  //   reSave

  const updatedAlbum = await album.save();

  res.status(StatusCodes.OK).json(updatedAlbum);
});

// @desc - delete album,albuns abd songs details
// @route delete /api/albums/id
// @Access- Private/admin

const deleteAlbum = asyncHandler(async (req, res) => {
  const album = await Album.findById(req.params.id);

  if (!album) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error(" Album not found");
  }

  //   delete albums from artist albums

  await Artist.updateOne(
    { _id: album.artist },
    { $pull: { albums: album._id } }
  );

  // update songs to remiove album reference

  await Song.updateMany(
    {
      album: album._id,
    },
    { $unset: { album: 1 } }
  );

  //   delte all albums nyt album

  await album.deleteOne();

  res.status(StatusCodes.OK).json({ message: "Album removed" });
});

// @desc - ad  somgs tp album
// @route put /api/albums/:id/add-songs
// @Access- Private/admin
const addSongsToAlbum = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  console.log("req.query", req.query);
  const albums = await Artist.find()
    .sort({ followers: -1 })
    .limit(parseInt(limit));
  console.log("albums", albums);
  res.status(StatusCodes.OK).json(albums);
});

// @desc - get toip songs albums by followers
// @route put /api/albums/:id/remove-songs/:songId
// @Access- Public

const removeSongsFromAlbum = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const songs = await Song.find()
    .sort({ plays: -1 })
    .limit(parseInt(limit))
    .populate("album", "title coverImage");

  console.log("songs", songs);
  if (songs.length) {
    res.status(StatusCodes.OK).json(songs);
  } else {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error(" No Songs found");
  }
});

// @desc - get toip songs albums by followers
// @route get /api/albums/:id/remove-songs/:songId
// @Access- Public

const getNewReleases = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const songs = await Song.find()
    .sort({ plays: -1 })
    .limit(parseInt(limit))
    .populate("album", "title coverImage");

  console.log("songs", songs);
  if (songs.length) {
    res.status(StatusCodes.OK).json(songs);
  } else {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error(" No Songs found");
  }
});
module.exports = {
  createAlbum,
  getAlbums,
  getAlbumsById,
  updateAlbum,
  deleteAlbum,
  addSongsToAlbum,
  removeSongsFromAlbum,
  getNewReleases,
};
