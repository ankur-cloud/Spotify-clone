const express = require("express");

const { protect, isAdmin } = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const {
  createAlbum,
  getAlbums,
  getAlbumsById,
  updateAlbum,
  deleteAlbum,
  addSongsToAlbum,
  removeSongsFromAlbum,
  getNewReleases,
} = require("../controllers/albumController");

const albumRouter = express.Router();

// public route
albumRouter.get("/", getAlbums);
albumRouter.get("/new-releases", getNewReleases);
albumRouter.get("/:id", getAlbumsById);

// admin route
albumRouter.post(
  "/",
  protect,
  isAdmin,
  upload.single("coverImage"),
  createAlbum
);
albumRouter.put(
  "/",
  protect,
  isAdmin,
  upload.single("coverImage"),
  updateAlbum
);
albumRouter.delete("/:id", protect, isAdmin, deleteAlbum);
albumRouter.post("/:id/add-songs", protect, isAdmin, addSongsToAlbum);
albumRouter.delete(
  "/:id/remove-songs/:songId",
  protect,
  isAdmin,
  removeSongsFromAlbum
);

module.exports = {
  albumRouter,
};
