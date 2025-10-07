const express = require("express");

const { protect, isAdmin } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

const {
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
} = require("../controllers/playlistController");

const playlistRouter = express.Router();

// public routes
playlistRouter.get("/", getPlaylists);
playlistRouter.get("/featured", getFeaturedPlaylists);
playlistRouter.get("/:id", getPlaylistById);

// admin route
playlistRouter.post("/", protect, upload.single("coverImage"), createPlaylist);
playlistRouter.get("/user/me", protect, getUserPlaylists);
playlistRouter.put(
  "/:id",
  protect,
  upload.single("coverImage"),
  updatePlaylist
);
playlistRouter.delete("/:id", protect, deletePlaylist);
playlistRouter.put("/:id/add-songs", protect, addSongsToPlaylist);
playlistRouter.put(
  "/:id/remove-songs/:songId",
  protect,
  removeSongsFromPlaylist
);
playlistRouter.put("/:id/add-collaborator", protect, addCollaboratorToPlaylist);
playlistRouter.put(
  "/:id/remove-collaborator",
  protect,
  removeCollaboratorFromPlaylist
);

module.exports = {
  playlistRouter,
};
