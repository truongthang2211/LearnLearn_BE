import express from "express";
import mongoose from "mongoose";
import User from "./models/user";
require("dotenv").config();
mongoose.connect((process.env.MONGODB_URL as string) || "", (e) => {
  if (!e) {
    console.log("MongoDB connected!");
    return;
  }
  console.log(e);
});

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}!`));
