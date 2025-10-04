const { default: mongoose } = require("mongoose");

// schema

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be atleast 6 charaters"],

      trim: true,
    },
    profilePicture: {
      type: String,
      default:
        "https://media.istockphoto.com/id/1781141610/photo/blacky.jpg?s=612x612&w=0&k=20&c=iJp3EM4mdh6GsFBq6MgRtUjbLInuKqgY6IEYkwt_798=",
    },
    isAdmin: {
      type: String,
      default: false,
    },
    likedSongs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],
    likedAlbums: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Album",
      },
    ],
    followedArtists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Artist",
      },
    ],
    followedPlaylists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Playlist",
      },
    ],
  },
  {
    timestamps: true,
  }
);

/// compi;e fit  tge model

const User = mongoose.model("User", userSchema);

module.exports = User;
