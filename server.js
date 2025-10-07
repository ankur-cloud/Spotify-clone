require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const { userRouter } = require("./src/routes/userRoutes");
const { StatusCodes } = require("http-status-codes");
const { artistRouter } = require("./src/routes/artistRoutes");
const { albumRouter } = require("./src/routes/albumRoutes");
const { songRouter } = require("./src/routes/songRoutes");
const { playlistRouter } = require("./src/routes/playlistRoutes");

const app = express();
//connect to database
let isConnected = false;

async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    console.log("connected");
    isConnected = true;
  } catch (e) {
    console.log("MONGODB", e);
  }
}

// app.use((req, res, next) => {
//   if (!isConnected) {
//     next();
//   }
// });

// pass incomiung data
app.use(express.json());

// Routes middleware
app.use("/api/users", userRouter);
app.use("/api/artists", artistRouter);
app.use("/api/albums", albumRouter);
app.use("/api/songs", songRouter);
app.use("/api/playlists", playlistRouter);

// error handler middleweaerplaylistRouter
// 404 /
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = StatusCodes.NOT_FOUND;

  next(error);
});

// Global errror handler

app.use((err, req, res) => {
  res.status(err.status || StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: err.message || "Internal Server error",
    status: "error",
  });
});

const PORT = process.env.PORT || 1500;
async function startServer() {
  await connectMongo();
  app.listen(PORT, () => {
    console.log("listen", PORT);
  });
}

startServer();

 