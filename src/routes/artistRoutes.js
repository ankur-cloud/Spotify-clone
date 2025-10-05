const express = require("express");

const { protect, isAdmin } = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const {
  createArtist,
  getArtists,
  getArtistById,
  updateArtist,
  deleteArtist,
  getTopArtists,
  getTopSongsArtists,
} = require("../controllers/artistController");

const artistRouter = express.Router();

// public route
artistRouter.get("/", getArtists);
artistRouter.get("/topartists", getTopArtists);
artistRouter.get("/:id/top-songs", getTopSongsArtists);
artistRouter.get("/:id", getArtistById);

// admin route
artistRouter.post("/", protect, isAdmin, upload.single("image"), createArtist);
artistRouter.put(
  "/:id",
  protect,
  isAdmin,
  upload.single("image"),
  updateArtist
);
artistRouter.delete("/:id", protect, isAdmin, deleteArtist);

module.exports = {
  artistRouter,
};
