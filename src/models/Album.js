const { default: mongoose } = require("mongoose");

// schema

const albumSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "title is required"],
      trim: true,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "artist is required"],
      ref: "Artist",
    },
    releasedDate: {
      type: Date,
      default: Date.now(),
    },
    coverImage: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2024/09/17/23/23/studio-9054709_960_720.jpg",
    },
    songs: [
      {
        type: String,
        default: false,
        ref: "Song",
      },
    ],
    genre: {
      type: String,
      ref: "Song",
      trim: true,
    },

    likes: {
      type: Number,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    isExplicit: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/// compi;e fit  tge model

const Album = mongoose.model("Album", albumSchema);

module.exports = Album;
