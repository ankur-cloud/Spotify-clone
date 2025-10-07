const asyncHandler = require("express-async-handler");
const { StatusCodes } = require("http-status-codes");
const Artist = require("../models/Artist");
const { uploadToCloudinary } = require("../utils/cloudinaryUpload");
const Song = require("../models/Song");
const Album = require("../models/Album");

// @desc - create a new song
// @route POST /api/songs
// @Access- private/admin

const createSong = asyncHandler(async (req, res) => {
  //get the payload
  if (!req.body) {
    res.status(StatusCodes.BAD_REQUEST);

    throw new Error("Request body is required");
  }

  const {
    title,
    artistId,
    albumId,
    duration,
    genre,
    lyrics,
    isExplicit,
    featuredArtists,
  } = req.body;

  const artist = await Artist.findById(artistId);

  if (!artist) {
    res.status(StatusCodes.BAD_REQUEST);

    throw new Error(" Artist not found");
  }

  if (albumId) {
    const album = Album.findById(albumId);
    if (!album) {
      res.status(StatusCodes.BAD_REQUEST);

      throw new Error(" album not found");
    }
  }

  if (!req.files || !req.files.audio) {
    res.status(StatusCodes.BAD_REQUEST);

    throw new Error("Audio file is required");
  }

  const audioResult = await uploadToCloudinary(
    req.files.audio[0].path,
    "spotify/songs"
  );

  let coverImageUrl = "";
  if (req.files && req.files.cover) {
    const imageResult = await uploadToCloudinary(
      req.files.cover[0].path,
      "spotify/covers"
    );
    coverImageUrl = imageResult.secure_url;
  }

  // create the songs

  const song = await Song.create({
    title,
    artist: artistId,
    album: albumId || null,
    duration,
    audioUrl: audioResult.secure_url,
    genre,
    lyrics,
    isExplicit: isExplicit === "true",
    featuredArtists: featuredArtists ? JSON.parse(featuredArtists) : [],
    coverImage: coverImageUrl,
  });

  // add song to artust's songs

  artist.songs.push(song._id);

  await artist.save();

  //  add song to album if albumid is provided

  if (albumId) {
    const album = await Album.findById(albumId);
    album.songs.push(song._id);
    await album.save();
  }
  res.status(StatusCodes.CREATED).json(song);
});

// @desc - get All songs with filtering and pagination
// @route get /api/songs?genre=pop&artist=2312312&search=dat&page=1&limit=10
// @Access- Public

const getSongs = asyncHandler(async (req, res) => {
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
    ];
  }

  // // count total songs with filter

  const count = await Song.countDocuments(filter);

  // pagination

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const songs = await Song.find(filter)
    .sort({ releasedDate: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .populate("artist", "name image")
    .populate("album", "title coverImage")
    .populate("featuredArtists", "name");

  res.status(StatusCodes.OK).json({
    songs,
    page: parseInt(page),
    pages: Math.ceil(count / parseInt(limit)),
    totalSongs: count,
  });
});

// @desc - get sng by id
// @route get /api/song/:id
// @Access- Public

const getSongById = asyncHandler(async (req, res) => {
  const song = await Song.findById(req.params.id)
    .populate("artist", "name image bio")
    .populate("album", "title coverImage releasedData")
    .populate("featuredArtists", "name image");

  if (song) {
    // increment plays coutn
    song.plays += 1;
    await song.save();
    res.status(StatusCodes.OK).json(song);
  } else {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error(" Song not found");
  }
});

// @desc - update song details
// @route put /api/song/:id
// @Access- Private/admin

const updateSong = asyncHandler(async (req, res) => {
  const {
    title,
    artistId,
    albumId,
    duration,
    genre,
    lyrics,
    isExplicit,
    featuredArtists,
  } = req.body;

  const song = await Song.findById(req.params.id);
  if (!song) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Song not found");
  }

  // update song details

  song.title = title || song.title;
  song.album = albumId || song.album;
  song.artist = artistId || song.artistId;
  song.lyrics = lyrics || song.lyrics;
  song.genre = genre || song.genre;
  song.duration = duration || song.duration;
  song.isExplicit =
    song.isExplicit !== undefined ? isExplicit === "true" : song.isExplicit;
  song.featuredArtists = featuredArtists
    ? JSON.parse(featuredArtists)
    : song.featuredArtists;

  // update cover image if provided

  if (req.files && req.files.cover) {
    const imageResult = await uploadToCloudinary(
      req.files.cover[0].path,
      "spotify/covers"
    );
    song.coverImage = imageResult.secure_url;
  }
  // update audio file if provided
  if (req.files || req.files.audio) {
    const audioResult = await uploadToCloudinary(
      req.files.audio[0].path,
      "spotify/songs"
    );
    song.audioUrl = audioResult.secure_url;
  }

  //   reSave

  const updatedSong = await song.save();

  res.status(StatusCodes.OK).json(updatedSong);
});

// @desc - delete song
// @route delete /api/songs/:id
// @Access- Private/admin

const deleteSong = asyncHandler(async (req, res) => {
  const song = await Song.findById(req.params.id);

  if (!song) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Song not found");
  }

  //   delete songs from artist songs

  await Artist.updateOne({ _id: song.artist }, { $pull: { songs: song._id } });

  // update album to remove song reference

  if (song.album) {
    await Album.updateOne({ _id: song.album }, { $pull: { songs: song._id } });
  }

  //   delte all songs nyt song

  await song.deleteOne();

  res.status(StatusCodes.OK).json({ message: "Song removed" });
});

// @desc - get top songs by plays
// @route get /api/songs/top?limit=10
// @Access- Private/admin
const getTopSongs = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const songs = await Song.find()
    .sort({ plays: -1 })
    .limit(parseInt(limit))
    .populate("artist", "name image")
    .populate("album", "title coverImage");

  res.status(StatusCodes.OK).json(songs);
});

// @desc - get toip songs songs by created at
// @route put /api/songs/:id/remove-songs/:songId
// @Access- Public

const getNewReleases = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const songs = await Song.find()
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate("artist", "name image")
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
  createSong,
  getSongs,
  getSongById,
  updateSong,
  deleteSong,
  getTopSongs,
  getNewReleases,
};
