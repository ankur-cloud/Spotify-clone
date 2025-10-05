require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const { userRouter } = require("./routes/userRoutes");
const { StatusCodes } = require("http-status-codes");
const { artistRouter } = require("./routes/artistRoutes");
const { albumRouter } = require("./routes/albumRoutes");

const app = express();
//connect to database

async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    console.log("connected");
  } catch (e) {
    console.log("MONGODB", e);
  }
}
connectMongo();

// pass incomiung data
app.use(express.json());

// Routes middleware
app.use("/api/users", userRouter);
app.use("/api/artists", artistRouter);
app.use("/api/albums", albumRouter);

// error handler middleweaer
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
app.listen(PORT, () => {
  console.log("listenlisten", PORT);
});
