const { default: mongoose } = require("mongoose");

// schema

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title of song is required"],
      trim: true,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Artist of song is required"],
      ref: "Artist",
      trim: true,
    },
    album: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
    },
    duration: {
      type: Number,
      required: [true, "Duration of song is required"],
    },
    audioUrl: {
      type: String,
      required: [true, "Audio url is required"],
    },
    coverImage: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2024/07/02/06/19/rain-8866774_1280.png",
    },
    releasedDate: {
      type: Date,
      default: Date.now(),
    },
    genre: {
      type: String,
      trim: true,
    },
    plays: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    isExplicit: {
      type: Boolean,
      default: false,
    },
    featuredArtist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Artist",
      },
    ],
  },
  {
    timestamps: true,
  }
);

/// compi;e fit  tge model

const Song = mongoose.model("Song", songSchema);

module.exports = Song;
