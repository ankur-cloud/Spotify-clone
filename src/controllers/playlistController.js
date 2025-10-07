const asyncHandler = require("express-async-handler");
const { StatusCodes } = require("http-status-codes");
const Artist = require("../models/Artist");
const { uploadToCloudinary } = require("../utils/cloudinaryUpload");
const Song = require("../models/Song");
const Album = require("../models/Album");
const Playlist = require("../models/Playlist");
const User = require("../models/User");

// @desc - create mew paylist
// @route POST /api/playlists
// @Access- private/admin

const createPlaylist = asyncHandler(async (req, res) => {
  //get the payload
  if (!req.body) {
    res.status(StatusCodes.BAD_REQUEST);

    throw new Error("Request body is required");
  }

  const { name, description, isPublic } = req.body;

  if (!name || !description) {
    res.status(StatusCodes.BAD_REQUEST);

    throw new Error(" name, description is required");
  }

  if (name.length < 3 && name.length > 50) {
    res.status(StatusCodes.BAD_REQUEST);

    throw new Error(
      "Too low or too high number of characters Name is required"
    );
  }

  if (description.length < 10 && description.length > 200) {
    res.status(StatusCodes.BAD_REQUEST);

    throw new Error("Too low or too high number of descriptions <10 || >200");
  }

  // Check Playlist already exist
  const existing = await Playlist.findOne({ name, creator: req.user._id });

  if (existing) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error(" Playlsit with the name already exist");
  }
  // upload album image if provided
  let coverImageUrl = "";
  if (req.file) {
    const result = await uploadToCloudinary(req.file.path, "spotify/playlists");

    coverImageUrl = result.secure_url;
  }

  // create the albums

  const playlist = await Playlist.create({
    name,
    description,
    creator: req.user._id,
    isPublic: isPublic === "true",
    coverImage: coverImageUrl,
  });

  res.status(StatusCodes.CREATED).json(playlist);
});

// @desc - get All playlsit with filtering and pagination
// @route get /api/playlsits?search=summer&page=1&limit=10

// @Access- Public/private

const getPlaylists = asyncHandler(async (req, res) => {
  console.log("req.query", req.query);

  const { search, page = 1, limit = 10 } = req.query;

  // build filter object

  const filter = { isPublic: true }; // only public playlsit

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // // count total playist with filter

  const count = await Playlist.countDocuments(filter);

  // pagination

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const plalists = await Playlist.find(filter)
    .sort({ followers: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .populate("creator", "name profilePicture")
    .populate("collaborators", "name profilePicture");

  res.status(StatusCodes.OK).json({
    plalists,
    page: parseInt(page),
    pages: Math.ceil(count / parseInt(limit)),
    totalPlaylists: count,
  });
});

// @desc - get playlist
// @route get /api/playlists/user/me
// @Access- Public

const getUserPlaylists = asyncHandler(async (req, res) => {
  const playlist = await Playlist.find({
    $or: [{ creator: req.user._id }, { collaborators: req.user._id }],
  })
    .sort({ createdAt: -1 })
    .populate("creator", "name profilePicture");

  res.status(StatusCodes.OK).json(playlist);
});
// @desc - get Playlist by id
// @route get /api/playlists/:id
// @Access- Public

const getPlaylistById = asyncHandler(async (req, res) => {
  const playlist = await Playlist.findById(req.params.id)
    .populate("creator", "name profilePicture")
    .populate("collaborators", "name profilePicture");

  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error(" Playlist not found");
  }

  // check if the playlist is private and current user is not the creatot or collaborator
  if (
    !playlist.isPublic &&
    !(
      req.user._id &&
      (playlist.creator.equals(req.user._id) ||
        playlist.collaborators.some((pl) => pl.equals(req.user._id)))
    )
  ) {
    res.status(StatusCodes.FORBIDDEN);
    throw new Error("This playlist is private");
  }
  res.status(StatusCodes.OK).json(playlist);
});

// @desc - update Playlist details
// @route put /api/playlists/:id
// @Access- Private/admin

const updatePlaylist = asyncHandler(async (req, res) => {
  const { name, description, isPublic } = req.body;

  const playlist = await Playlist.findById(req.params.id);

  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("playlist not found");
  }
  // checj uf cyrrent user is creator or collaborator

  if (
    !playlist.creator.equals(req.user._id) &&
    !playlist.collaborators.some((collab) => collab.equals(req.user._id))
  ) {
    res.status(StatusCodes.FORBIDDEN);
    throw new Error("Not authorized to updatehtis playlist not found");
  }
  // update playlist details fields

  playlist.name = name || playlist.name;
  playlist.description = description || playlist.description;

  // only creatot can change pricacy settings
  if (playlist.creator.equals(req.user._id)) {
    playlist.isPublic =
      playlist.isPublic !== undefined ? isPublic === "true" : playlist.isPublic;
  }

  // update cove rimage if provided

  if (req.file) {
    const result = uploadToCloudinary(req.file.path, "spotify/playlists");

    playlist.coverImage = (await result).secure_url;
  }

  //   reSave

  const updatedPlaylist = await playlist.save();

  res.status(StatusCodes.OK).json(updatedPlaylist);
});

// @desc - delete album,albuns abd songs details
// @route delete /api/playlists/id
// @Access- Private/admin

const deletePlaylist = asyncHandler(async (req, res) => {
  const playlist = await Playlist.findById(req.params.id);

  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error(" Playlist not found");
  }

  // onlt creator can delete their own playlist

  if (!playlist.creator.equals(req.user._id)) {
    res.status(StatusCodes.UNAUTHORIZED);
    throw new Error("Only crrator can delte the plylist");
  }

  await playlist.deleteOne();

  res.status(StatusCodes.OK).json({ message: "playlist removed" });
});

// @desc - ad  somgs tp album
// @route put /api/playlists/:id/add-songs
// @Access- Private/admin
const addSongsToPlaylist = asyncHandler(async (req, res) => {
  const playlist = await Playlist.findById(req.params.id);
  // find the playlist

  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error(" playlist not found ");
  }

  // check of cirremt user is creator or collaborator
  if (
    !playlist.creator.equals(req.user._id) &&
    !playlist.collaborators.some((collab) => collab.equals(req.user._id))
  ) {
    res.status(StatusCodes.FORBIDDEN);
    throw new Error("Not authirized to add songs to this playlist");
  }
  const { songIds } = req.body;

  if (!songIds || !Array.isArray(songIds)) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error(" songIds required  ");
  }

  // add songs to playlist

  for (const songId of songIds) {
    const song = await Song.findById(songId);

    if (!song) continue;

    // check if song is alreadu in playlist

    if (playlist.songs.includes(songId)) continue;

    // add sont ot playlist

    playlist.songs.push(songId);
  }
  await playlist.save();

  res.status(StatusCodes.OK).json(playlist);
});

// @desc - get toip songs albums by followers
// @route put /api/playlists/:id/remove-songs/:songId
// @Access- Public

const removeSongsFromPlaylist = asyncHandler(async (req, res) => {
  const playlist = await Playlist.findById(req.params.id);

  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error(" playlist not found ");
  }

  // check of cirremt user is creator or collaborator
  if (
    !playlist.creator.equals(req.user._id) &&
    !playlist.collaborators.some((collab) => collab.equals(req.user._id))
  ) {
    res.status(StatusCodes.FORBIDDEN);
    throw new Error("Not authirized to add songs to this playlist");
  }

  const songId = req.params.songId;

  // check if sont is in playlsit

  if (!playlist.songs.includes(songId)) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Song not in playlist");
  }

  // remove songs to playlist

  playlist.songs = playlist.songs.filter((pl) => pl.toString() !== songId);

  await playlist.save();

  res.status(StatusCodes.OK).json({ message: "song removed form playlsit" });
});
// @desc - add collaboratoer to playlists
// @route get /api/playlists/:id/add-collaborator
// @Access- private

const addCollaboratorToPlaylist = asyncHandler(async (req, res) => {
  const userId = req.body.userId;

  if (!userId) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Userid is required");
  }

  const user = User.findById(userId);

  if (!user) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("user is not found ");
  }

  const playlist = await Playlist.findById(req.params.id);

  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error(" playlist not found ");
  }

  // only creator can add collaborators
  if (!playlist.creator.equals(req.user._id)) {
    res.status(StatusCodes.FORBIDDEN);
    throw new Error("only creator can add collaborators ");
  }

  // check if user is already a collaborator
  if (playlist.collaborators.includes(userId)) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("user is already a collaborator");
  }

  // add user to collaborators

  playlist.collaborators.push(userId);
  await playlist.save();
  res.status(StatusCodes.OK).json(playlist);
});

// @desc - add collaboratoer to playlists
// @route get /api/playlists/:id/add-collaborator
// @Access- private

const removeCollaboratorFromPlaylist = asyncHandler(async (req, res) => {
  const userId = req.body.userId;

  if (!userId) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Userid is required");
  }

  const playlist = await Playlist.findById(req.params.id);

  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error(" playlist not found ");
  }

  // only creator can remove collaborators
  if (!playlist.creator.equals(req.user._id)) {
    res.status(StatusCodes.FORBIDDEN);
    throw new Error("only pplaylsit creator can remove collaborators ");
  }

  // check if user is already a collaborator
  if (!playlist.collaborators.includes(userId)) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("user is not a collaborator");
  }

  // remove user to collaborators

  playlist.collaborators = playlist.collaborators.filter(
    (id) => id.toString() !== userId
  );

  await playlist.save();

  res.status(StatusCodes.OK).json(playlist);
});
// @desc - add collaboratoer to playlists
// @route get /api/playlists/:id/add-collaborator
// @Access- private

const getFeaturedPlaylists = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const filter = { isPublic: true };

  const playlists = await Playlist.find(filter)
    .limit(parseInt(limit))
    .sort({ followers: -1 })
    .populate("creator", "name profilePicture");

  res.status(StatusCodes.OK).json(playlists);
});

module.exports = {
  createPlaylist,
  getPlaylists,
  getUserPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addSongsToPlaylist,
  removeSongsFromPlaylist,
  addCollaboratorToPlaylist,
  removeCollaboratorFromPlaylist,
  getFeaturedPlaylists,
};
