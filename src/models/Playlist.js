const { default: mongoose } = require("mongoose");

// schema

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Playlsit name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2024/07/02/06/19/rain-8866774_1280.png",
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creater name is required"],
    },

    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
    followers: {
      type: Number,
      default: 0,
    },

    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

/// compi;e fit  tge model

const Playlist = mongoose.model("Playlist", playlistSchema);

module.exports = Playlist;
