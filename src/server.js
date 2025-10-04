require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const { userRouter } = require("./routes/userRoutes");

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

const PORT = process.env.PORT || 1500;
app.listen(PORT, () => {
  console.log("listenlisten", PORT);
});
