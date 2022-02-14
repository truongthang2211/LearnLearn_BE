import express from "express";
import mongoose from "mongoose";
import router from "./routes/index";
import cookieParser from "cookie-parser";
require("dotenv").config();
const PORT = process.env.PORT || 3000;
// Connect MongoDB
mongoose.connect((process.env.MONGODB_URL as string) || "", (e) => {
  if (!e) {
    console.log("MongoDB connected!");
    return;
  }
  console.log(e);
});

const app = express();
app.use(express.json());
app.use(cookieParser());
//Use Router
app.use(router);
app.listen(PORT, () => console.log(`Server running on port ${PORT}!`));
