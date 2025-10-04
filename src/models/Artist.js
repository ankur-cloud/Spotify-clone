const { default: mongoose } = require("mongoose");

// schema

const artistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    releasedDate: {
      type: Date,
      default: Date.now(),
    },
    image: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2024/07/02/06/19/rain-8866774_1280.png",
    },
    genres: [
      {
        type: String,
        ref: "Song",
      },
    ],
    followers: {
      type: Number,
      default: 0,
    },

    albums: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Album",
      },
    ],
    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/// compi;e fit  tge model

const Artist = mongoose.model("Album", artistSchema);

module.exports = Artist;
