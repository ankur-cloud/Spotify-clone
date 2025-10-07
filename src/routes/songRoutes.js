const express = require("express");

const { protect, isAdmin } = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const {
  createSong,
  getSongs,
  getSongById,
  updateSong,
  deleteSong,
  getTopSongs,
  getNewReleases,
} = require("../controllers/songController");

const songRouter = express.Router();

// configure multer to handle multiple file types

const songUpload = upload.fields([
  { name: "audio", maxCount: 1 },
  {
    name: "cover",
    maxCount: 1,
  },
]);

// public routes
songRouter.get("/", getSongs);
songRouter.get("/top", getTopSongs);
songRouter.get("/new-releases", getNewReleases);
songRouter.get("/:id", getSongById);

// admin route
songRouter.post("/", protect, isAdmin, songUpload, createSong);
songRouter.put("/:id", protect, isAdmin, songUpload, updateSong);
songRouter.delete("/:id", protect, isAdmin, deleteSong);

module.exports = {
  songRouter,
};
